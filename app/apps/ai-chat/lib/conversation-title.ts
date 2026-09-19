import 'server-only';

import { generateText } from 'ai';

import { updateConversation } from '@workspace/ai';

import { DEFAULT_CONVERSATION_TITLE } from '~/types/conversation';

import { getTitleModel } from './available-models';
import { createChatModel } from './providers';

export { DEFAULT_CONVERSATION_TITLE };

const MAX_TITLE_LENGTH = 60;

export function fallbackTitle(question: string): string {
  const clean = question.replace(/\s+/g, ' ').trim();
  if (clean.length <= MAX_TITLE_LENGTH) return clean;
  return `${clean.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…`;
}

export function normalizeTitle(raw: string, question: string): string {
  const clean = raw
    .replace(/\s+/g, ' ')
    .replace(/^["'`]|["'`.]+$/g, '')
    .trim();

  if (!clean) return fallbackTitle(question);
  if (clean.length > MAX_TITLE_LENGTH) return fallbackTitle(clean);
  return clean;
}

/**
 * Gera o título a partir da primeira troca, com o modelo mais barato
 * disponível. Falha aqui não pode derrubar a conversa: cai no texto cortado.
 */
export async function generateConversationTitle(input: {
  conversationId: string;
  userId: string;
  question: string;
  answer: string;
}): Promise<void> {
  const model = getTitleModel();
  if (!model) return;

  let title = fallbackTitle(input.question);

  try {
    const result = await generateText({
      model: createChatModel(model),
      system:
        'Escreva um título curto, de no máximo 6 palavras, para a conversa. Responda só com o título, sem aspas e sem ponto final. Use o idioma da conversa.',
      prompt: `Pergunta: ${input.question}\n\nResposta: ${input.answer.slice(0, 1000)}`,
      maxOutputTokens: 32
    });
    title = normalizeTitle(result.text, input.question);
  } catch {
    // mantém o fallback
  }

  await updateConversation({
    id: input.conversationId,
    userId: input.userId,
    title
  });
}
