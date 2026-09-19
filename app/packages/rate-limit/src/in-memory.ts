import cache from 'memory-cache';

import type { RateLimiter } from './types';

/**
 * Contagem em janela fixa na memória do processo. Serve para deploy de
 * instância única e para desenvolvimento; com várias instâncias o teto passa a
 * valer por processo (veja `createRateLimiter`).
 */
export function inMemoryRateLimiter(options: {
  intervalInMs: number;
}): RateLimiter {
  return {
    check: (requestLimit: number, uniqueIdentifier: string) => {
      const count = cache.get(uniqueIdentifier) || [0];
      if (count[0] === 0) {
        cache.put(uniqueIdentifier, count, options.intervalInMs);
      }
      count[0] += 1;

      const currentUsage = count[0];
      // `requestLimit` é quantas requisições são permitidas: a de número
      // `requestLimit` ainda passa, a seguinte é barrada. Mesma regra do
      // backend Redis, para trocar de um pro outro não mudar o comportamento.
      const isRateLimited = currentUsage > requestLimit;

      return Promise.resolve({
        isRateLimited,
        requestLimit,
        remaining: isRateLimited ? 0 : requestLimit - currentUsage
      });
    }
  };
}
