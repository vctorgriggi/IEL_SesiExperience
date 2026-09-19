import type { UIMessage } from 'ai';

/**
 * Extrai o texto de uma UIMessage (AI SDK v5+), concatenando todos os
 * `parts` do tipo `text`. Usado para copiar/persistir/renderizar mensagens
 * cujo conteúdo, no v4, era uma string única em `message.content`.
 */
export function messageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === 'text' ? part.text : ''))
    .join('');
}

/**
 * Converte mensagens persistidas ({ id, role, content }) para UIMessage[],
 * a estrutura de `parts` que o v5+ espera em `useChat`.
 */
export function toUIMessages(
  messages: ReadonlyArray<{ id: string; role: string; content: string }>
): UIMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role === 'assistant' ? 'assistant' : 'user',
    parts: [{ type: 'text', text: m.content }]
  }));
}
