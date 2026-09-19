import { inMemoryRateLimiter } from './in-memory';
import { redisRateLimiter } from './redis';
import type { RateLimiter, RateLimitResult } from './types';

export type { RateLimitResult, RateLimiter };
export { inMemoryRateLimiter } from './in-memory';
export { redisRateLimiter } from './redis';

export type CreateRateLimiterOptions = {
  intervalInMs: number;
  /** Prefixo das chaves quando o backend for Redis. */
  keyPrefix?: string;
  /**
   * Quando o Redis cai, conta na memória do processo em vez de liberar geral.
   * Ligue no que custa dinheiro: geração de IA, checkout, envio de e-mail.
   */
  fallbackToMemory?: boolean;
};

/** URL do Redis, se o deploy tiver um. */
export function getRateLimitRedisUrl(): string | null {
  const url = process.env.RATE_LIMIT_REDIS_URL ?? process.env.REDIS_URL ?? '';
  return url.trim() ? url.trim() : null;
}

/**
 * Escolhe o backend pelo ambiente: Redis quando houver URL configurada,
 * memória caso contrário.
 *
 * A diferença importa. O backend em memória conta **por processo**, então num
 * deploy com várias instâncias o limite real vira N vezes o configurado. Para
 * qualquer coisa que custe dinheiro (geração de IA, envio de e-mail, criação
 * de cobrança), configure `RATE_LIMIT_REDIS_URL` em produção.
 */
export function createRateLimiter(
  options: CreateRateLimiterOptions
): RateLimiter {
  const url = getRateLimitRedisUrl();
  if (url) {
    return redisRateLimiter({
      intervalInMs: options.intervalInMs,
      url,
      keyPrefix: options.keyPrefix,
      fallback: options.fallbackToMemory
        ? inMemoryRateLimiter({ intervalInMs: options.intervalInMs })
        : undefined
    });
  }

  return inMemoryRateLimiter({ intervalInMs: options.intervalInMs });
}
