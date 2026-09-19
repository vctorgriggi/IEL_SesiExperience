import { createRateLimiter } from '@workspace/rate-limit';

/**
 * Limites por usuário autenticado, não por IP: o custo aqui é por conta.
 *
 * Sem `RATE_LIMIT_REDIS_URL` a contagem é por processo, então num deploy com
 * várias instâncias o teto real vira N vezes o configurado.
 */
const MINUTE = 60 * 1000;

// Geração e checkout chamam provider pago: com o Redis fora, contar por
// processo é pior que o teto distribuído e muito melhor que liberar geral.
export const chatMessagesLimiter = createRateLimiter({
  intervalInMs: MINUTE,
  keyPrefix: 'ai-chat',
  fallbackToMemory: true
});
export const CHAT_MESSAGES_PER_MINUTE = 20;

export const chatWritesLimiter = createRateLimiter({
  intervalInMs: MINUTE,
  keyPrefix: 'ai-chat'
});
export const CHAT_WRITES_PER_MINUTE = 60;

export const chatCheckoutLimiter = createRateLimiter({
  intervalInMs: MINUTE,
  keyPrefix: 'ai-chat',
  fallbackToMemory: true
});
export const CHAT_CHECKOUT_PER_MINUTE = 5;

export function rateLimitedResponse(retryAfterSeconds = 60): Response {
  return new Response(
    JSON.stringify({
      error: 'Muitas requisições. Espere um pouco e tente de novo.',
      code: 'RATE_LIMITED'
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds)
      }
    }
  );
}
