import { describe, expect, it } from 'vitest';

import { AI_CHAT_CREDIT_PACKS, resolveCreditPack } from './credit-packs';

describe('resolveCreditPack', () => {
  it('resolve as chaves válidas para o pacote correto', () => {
    expect(resolveCreditPack('10')).toEqual({
      pack: 10,
      ...AI_CHAT_CREDIT_PACKS[10]
    });
    expect(resolveCreditPack('50')).toEqual({
      pack: 50,
      ...AI_CHAT_CREDIT_PACKS[50]
    });
    expect(resolveCreditPack('100')).toEqual({
      pack: 100,
      ...AI_CHAT_CREDIT_PACKS[100]
    });
  });

  it('retorna null para chaves inválidas', () => {
    expect(resolveCreditPack('7')).toBeNull();
    expect(resolveCreditPack('')).toBeNull();
    expect(resolveCreditPack('10 ')).toBeNull();
    expect(resolveCreditPack('abc')).toBeNull();
  });
});
