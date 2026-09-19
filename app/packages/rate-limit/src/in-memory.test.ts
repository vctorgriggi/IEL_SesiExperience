import { describe, expect, it } from 'vitest';

import { inMemoryRateLimiter } from './in-memory';

function uniqueId(name: string): string {
  return `${name}-${Math.round(performance.now() * 1000)}`;
}

describe('inMemoryRateLimiter', () => {
  it('permite exatamente `requestLimit` requisições', async () => {
    const limiter = inMemoryRateLimiter({ intervalInMs: 60_000 });
    const id = uniqueId('limite');

    const first = await limiter.check(3, id);
    const second = await limiter.check(3, id);
    const third = await limiter.check(3, id);
    const fourth = await limiter.check(3, id);

    expect(first.isRateLimited).toBe(false);
    expect(second.isRateLimited).toBe(false);
    expect(third.isRateLimited).toBe(false);
    expect(fourth.isRateLimited).toBe(true);
  });

  it('conta o que sobra até zerar', async () => {
    const limiter = inMemoryRateLimiter({ intervalInMs: 60_000 });
    const id = uniqueId('restante');

    expect((await limiter.check(2, id)).remaining).toBe(1);
    expect((await limiter.check(2, id)).remaining).toBe(0);
    expect((await limiter.check(2, id)).remaining).toBe(0);
  });

  it('conta cada identificador separadamente', async () => {
    const limiter = inMemoryRateLimiter({ intervalInMs: 60_000 });
    const a = uniqueId('usuario-a');
    const b = uniqueId('usuario-b');

    await limiter.check(1, a);
    expect((await limiter.check(1, a)).isRateLimited).toBe(true);
    expect((await limiter.check(1, b)).isRateLimited).toBe(false);
  });

  it('libera de novo quando a janela expira', async () => {
    const limiter = inMemoryRateLimiter({ intervalInMs: 30 });
    const id = uniqueId('janela');

    await limiter.check(1, id);
    expect((await limiter.check(1, id)).isRateLimited).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect((await limiter.check(1, id)).isRateLimited).toBe(false);
  });
});
