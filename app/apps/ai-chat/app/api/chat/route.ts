import { convertToModelMessages, streamText } from 'ai';

import {
  AI_CHAT_MAX_OUTPUT_TOKENS,
  appendMessage,
  buildGroundedSystemPrompt,
  CHAT_MESSAGES_PER_MINUTE,
  chatMessagesLimiter,
  consumeAiMessage,
  consumeDemoQuota,
  formatKnowledgeContext,
  getConversation,
  rateLimitedResponse,
  refundAiMessage,
  releaseDemoQuota,
  searchKnowledgeChunks,
  selectContextMessages,
  upsertAssistantMessage,
  type AiCreditSource
} from '@workspace/ai';
import { dedupedAuth } from '@workspace/auth';
import { getClientIp } from '@workspace/common/client-ip';

import { jsonError } from '~/lib/api-response';
import { getDefaultChatModel, isModelAvailable } from '~/lib/available-models';
import { chatBodySchema, textOf } from '~/lib/chat-request';
import {
  DEFAULT_CONVERSATION_TITLE,
  generateConversationTitle
} from '~/lib/conversation-title';
import { embedQuery } from '~/lib/embeddings';
import { canEditKnowledge } from '~/lib/knowledge-access';
import { modelLabel } from '~/lib/models';
import { createChatModel } from '~/lib/providers';

export const runtime = 'nodejs';

const SYSTEM_PROMPT =
  process.env.AI_CHAT_SYSTEM_PROMPT?.trim() ||
  'Você é um assistente prestativo. Responda em português quando o usuário escrever em português.';

/**
 * Gera a resposta e é dono do ciclo: limite de uso, cobrança, persistência e
 * estorno.
 *
 * A gravação acontece aqui, e não no cliente, porque o cliente some no meio:
 * o usuário aperta parar, fecha a aba, cai a rede. O `consumeStream` faz o
 * servidor terminar o stream mesmo assim.
 */
export async function POST(req: Request): Promise<Response> {
  const session = await dedupedAuth();
  const userId = session?.user?.id;
  if (!userId) return jsonError('Não autorizado', 401);

  const { isRateLimited } = await chatMessagesLimiter.check(
    CHAT_MESSAGES_PER_MINUTE,
    `chat:${userId}`
  );
  if (isRateLimited) return rateLimitedResponse();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return jsonError('Corpo da requisição inválido', 400);
  }

  const parse = chatBodySchema.safeParse(json);
  if (!parse.success) {
    return jsonError(parse.error.issues.map((e) => e.message).join('; '), 400);
  }

  const { messages, conversationId, regenerate } = parse.data;
  const model = parse.data.model ?? getDefaultChatModel();

  if (!isModelAvailable(model)) {
    return jsonError(
      `O modelo ${modelLabel(model)} não está habilitado neste ambiente. Escolha outro modelo.`,
      400
    );
  }

  const conversation = conversationId
    ? await getConversation(conversationId, userId)
    : null;
  if (conversationId && !conversation) {
    return jsonError('Conversa não encontrada', 404);
  }

  // Todo mundo entra com a mesma conta de demonstração, então o que separa um
  // visitante do outro é o IP. Admin da base não gasta cota, para conseguir
  // mostrar o produto sem queimar as mensagens.
  const unlimited = canEditKnowledge(session.user?.email);
  const ip = getClientIp(req.headers);
  const demo = unlimited ? null : await consumeDemoQuota(ip, 'messages');

  if (demo && !demo.ok) {
    return jsonError(
      `Você usou as ${demo.limit} mensagens da demonstração. Compre um pacote para continuar.`,
      402,
      { code: 'DEMO_LIMIT', used: demo.used, limit: demo.limit }
    );
  }

  const releaseDemo = () =>
    demo ? releaseDemoQuota(ip, 'messages').catch(() => undefined) : undefined;

  const charge = await consumeAiMessage(userId);
  if (!charge.ok) {
    await releaseDemo();
    return jsonError(
      'Você usou todas as mensagens. Compre créditos para continuar.',
      402,
      { code: 'NO_CREDITS', ...charge.balance }
    );
  }

  const source: AiCreditSource = charge.source;
  let refunded = false;
  const refund = () => {
    if (refunded) return Promise.resolve(undefined);
    refunded = true;
    return Promise.all([refundAiMessage(userId, source), releaseDemo()]).then(
      () => undefined,
      () => undefined
    );
  };

  const last = messages.at(-1);
  const question = last && last.role === 'user' ? textOf(last) : '';

  const persist = async (content: string) => {
    if (!conversation || !content.trim()) return;

    await upsertAssistantMessage({
      conversationId: conversation.id,
      userId,
      content,
      replaceLast: regenerate === true
    }).catch(() => undefined);

    if (conversation.title === DEFAULT_CONVERSATION_TITLE && question) {
      await generateConversationTitle({
        conversationId: conversation.id,
        userId,
        question,
        answer: content
      }).catch(() => undefined);
    }
  };

  try {
    if (conversation && !regenerate && question) {
      await appendMessage({
        conversationId: conversation.id,
        userId,
        role: 'user',
        content: question
      });
    }

    const context = selectContextMessages(
      messages.map((message) => ({
        role: message.role,
        content: textOf(message),
        message
      }))
    ).map((entry) => entry.message);

    const modelMessages = await convertToModelMessages(context);

    const retrieved = question
      ? await searchKnowledgeChunks(await embedQuery(question))
      : [];

    const result = streamText({
      model: createChatModel(model),
      system: buildGroundedSystemPrompt(
        SYSTEM_PROMPT,
        formatKnowledgeContext(retrieved)
      ),
      messages: modelMessages,
      maxOutputTokens: AI_CHAT_MAX_OUTPUT_TOKENS,
      onEnd: ({ text }) => persist(text),
      onAbort: ({ steps }) => persist(steps.map((step) => step.text).join('')),
      onError: ({ error }) => {
        console.error(`[api/chat] ${model} falhou ao gerar resposta:`, error);
        return refund();
      }
    });

    void result.consumeStream();

    return result.toUIMessageStreamResponse({
      onError: () =>
        'Não consegui gerar a resposta agora. Tente de novo em instantes.'
    });
  } catch (err) {
    await refund();
    return jsonError(
      err instanceof Error ? err.message : 'Erro ao gerar resposta',
      502
    );
  }
}
