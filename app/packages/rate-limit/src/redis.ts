import { createClient, type RedisClientType } from 'redis';

import type { RateLimiter } from './types';

export type RedisRateLimiterOptions = {
  intervalInMs: number;
  url: string;
  /** Prefixo das chaves, para dividir o Redis com outras coisas. */
  keyPrefix?: string;
  /**
   * Limiter usado quando o Redis não responde. Sem ele a requisição passa
   * (fail-open), o que não serve para o que custa dinheiro.
   */
  fallback?: RateLimiter;
};

/**
 * Contagem em janela fixa no Redis. Diferente do backend em memória, o teto
 * vale para o deploy inteiro: em serverless, onde cada requisição pode cair
 * num processo diferente, é a única forma do limite significar alguma coisa.
 *
 * A janela é `INCR` + `EXPIRE` na primeira contagem. Simples de propósito;
 * quem precisar de sliding window troca só este arquivo.
 */
export function redisRateLimiter(
  options: RedisRateLimiterOptions
): RateLimiter {
  const prefix = options.keyPrefix ?? 'ratelimit';
  let clientPromise: Promise<RedisClientType> | null = null;

  async function getClient(): Promise<RedisClientType> {
    if (!clientPromise) {
      const client: RedisClientType = createClient({ url: options.url });
      // Sem listener de erro o node-redis derruba o processo em queda de rede.
      client.on('error', (error) => {
        console.error('[rate-limit] Redis indisponível:', error);
      });
      clientPromise = client.connect().then(() => client);
    }
    return clientPromise;
  }

  return {
    check: async (requestLimit: number, uniqueIdentifier: string) => {
      const key = `${prefix}:${uniqueIdentifier}`;

      try {
        const client = await getClient();
        // O TTL vem antes do INCR: com INCR primeiro, uma queda entre os dois
        // comandos deixa a chave sem expiração e trava o usuário para sempre.
        await client.set(key, 0, { NX: true, PX: options.intervalInMs });
        const currentUsage = await client.incr(key);

        const isRateLimited = currentUsage > requestLimit;
        return {
          isRateLimited,
          requestLimit,
          remaining: isRateLimited
            ? 0
            : Math.max(0, requestLimit - currentUsage)
        };
      } catch (error) {
        console.error('[rate-limit] falha ao consultar o Redis:', error);
        clientPromise = null;

        // Sem fallback a requisição passa: Redis fora do ar não derruba o
        // produto. Com fallback, o teto por processo ainda vale — é menos
        // preciso que o distribuído, e infinitamente melhor que nenhum.
        if (options.fallback) {
          return options.fallback.check(requestLimit, uniqueIdentifier);
        }

        return {
          isRateLimited: false,
          requestLimit,
          remaining: requestLimit
        };
      }
    }
  };
}
