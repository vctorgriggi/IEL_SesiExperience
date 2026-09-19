export type ContextMessage = { role: string; content: string };

export const AI_CHAT_MAX_CONTEXT_MESSAGES = (() => {
  const parsed = Number.parseInt(
    process.env.AI_CHAT_MAX_CONTEXT_MESSAGES ?? '',
    10
  );
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
})();

export const AI_CHAT_MAX_CONTEXT_CHARS = (() => {
  const parsed = Number.parseInt(
    process.env.AI_CHAT_MAX_CONTEXT_CHARS ?? '',
    10
  );
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 24_000;
})();

export const AI_CHAT_MAX_OUTPUT_TOKENS = (() => {
  const parsed = Number.parseInt(
    process.env.AI_CHAT_MAX_OUTPUT_TOKENS ?? '',
    10
  );
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 2048;
})();

/**
 * Corta o histórico pelas mensagens mais recentes, respeitando um teto de
 * quantidade e outro de caracteres. Sem isso uma conversa longa cresce o
 * prompt a cada turno até estourar o contexto do provider (e a fatura).
 *
 * A última mensagem sempre passa, mesmo sozinha estourando o teto: é a
 * pergunta que acabou de ser feita, e mandar um prompt vazio seria pior.
 */
export function selectContextMessages<T extends ContextMessage>(
  messages: readonly T[],
  options: { maxMessages?: number; maxChars?: number } = {}
): T[] {
  const maxMessages = options.maxMessages ?? AI_CHAT_MAX_CONTEXT_MESSAGES;
  const maxChars = options.maxChars ?? AI_CHAT_MAX_CONTEXT_CHARS;
  if (messages.length === 0) return [];

  const selected: T[] = [];
  let chars = 0;

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i]!;
    const size = message.content.length;

    if (selected.length >= maxMessages) break;
    if (selected.length > 0 && chars + size > maxChars) break;

    selected.unshift(message);
    chars += size;
  }

  // A Anthropic recusa histórico que começa com o assistente, e o corte acima
  // pode parar bem no meio de um par pergunta/resposta.
  while (selected.length > 1 && selected[0]!.role !== 'user') {
    selected.shift();
  }

  return selected;
}
