import { describe, expect, it } from 'vitest';

import {
  addDays,
  buildInviteToken,
  CULTURE_INVITE_TOKEN_SEED,
  daysBetweenDates,
  getSuggestedSampleSize,
  MAX_SAMPLE_SIZE,
  MIN_SAMPLE_SIZE
} from './culture-invites';

describe('tamanho da amostra (R2)', () => {
  it('sugere 20% do quadro da área', () => {
    expect(getSuggestedSampleSize(30)).toBe(6);
    expect(getSuggestedSampleSize(45)).toBe(9);
  });

  it('nunca desce do mínimo que sustenta uma leitura de equipe', () => {
    expect(getSuggestedSampleSize(4)).toBe(MIN_SAMPLE_SIZE);
    expect(getSuggestedSampleSize(1)).toBe(MIN_SAMPLE_SIZE);
    expect(getSuggestedSampleSize(0)).toBe(MIN_SAMPLE_SIZE);
    expect(getSuggestedSampleSize(Number.NaN)).toBe(MIN_SAMPLE_SIZE);
  });

  it('nunca ultrapassa o teto de atenção da empresa', () => {
    expect(getSuggestedSampleSize(200)).toBe(MAX_SAMPLE_SIZE);
    expect(getSuggestedSampleSize(60)).toBe(MAX_SAMPLE_SIZE);
  });
});

describe('token do convite', () => {
  it('é opaco, estável e não deriva do e-mail', () => {
    const token = buildInviteToken('INV-EMP01-01', CULTURE_INVITE_TOKEN_SEED);

    expect(token).toMatch(/^[0-9a-f]{16}$/);
    expect(buildInviteToken('INV-EMP01-01', CULTURE_INVITE_TOKEN_SEED)).toBe(
      token
    );
    expect(
      buildInviteToken('INV-EMP01-02', CULTURE_INVITE_TOKEN_SEED)
    ).not.toBe(token);
  });
});

describe('datas do prazo', () => {
  it('soma dias sem depender do relógio', () => {
    expect(addDays('2026-09-12', 3)).toBe('2026-09-15');
    expect(addDays('2026-08-30', 3)).toBe('2026-09-02');
  });

  it('conta dias restantes e negativos quando venceu', () => {
    expect(daysBetweenDates('2026-09-14', '2026-09-15')).toBe(1);
    expect(daysBetweenDates('2026-09-14', '2026-09-01')).toBe(-13);
  });
});
