import { describe, expect, it } from 'vitest';

import {
  buildCursor,
  clampLimit,
  CONVERSATIONS_PAGE_SIZE,
  parseCursor
} from './conversations';

const UUID = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';

describe('parseCursor', () => {
  it('separa data e id pelo último pipe', () => {
    const parsed = parseCursor(`2026-07-20T12:00:00.000Z|${UUID}`);
    expect(parsed?.at.toISOString()).toBe('2026-07-20T12:00:00.000Z');
    expect(parsed?.id).toBe(UUID);
  });

  it('recusa cursor sem id, sem data ou malformado', () => {
    expect(parseCursor(null)).toBeNull();
    expect(parseCursor('')).toBeNull();
    expect(parseCursor('sem-pipe')).toBeNull();
    expect(parseCursor('|abc')).toBeNull();
    expect(parseCursor('2026-07-20T12:00:00.000Z|')).toBeNull();
    expect(parseCursor('data-invalida|abc')).toBeNull();
  });

  it('recusa id que não é uuid, que viraria erro de sintaxe no Postgres', () => {
    expect(parseCursor('2026-07-20T12:00:00.000Z|abc')).toBeNull();
    expect(parseCursor("2026-07-20T12:00:00.000Z|1' OR '1'='1")).toBeNull();
  });
});

describe('buildCursor + parseCursor', () => {
  it('fazem a volta completa sem perder informação', () => {
    const conversation = {
      id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
      title: 'Qualquer',
      model: 'gpt-4o-mini',
      createdAt: new Date('2026-07-01T10:00:00.000Z'),
      updatedAt: new Date('2026-07-20T12:34:56.789Z')
    };

    const parsed = parseCursor(buildCursor(conversation));
    expect(parsed?.id).toBe(conversation.id);
    expect(parsed?.at.getTime()).toBe(conversation.updatedAt.getTime());
  });
});

describe('clampLimit', () => {
  it('usa o padrão quando o valor não serve', () => {
    expect(clampLimit(undefined)).toBe(CONVERSATIONS_PAGE_SIZE);
    expect(clampLimit(null)).toBe(CONVERSATIONS_PAGE_SIZE);
    expect(clampLimit(0)).toBe(CONVERSATIONS_PAGE_SIZE);
    expect(clampLimit(-5)).toBe(CONVERSATIONS_PAGE_SIZE);
    expect(clampLimit(Number.NaN)).toBe(CONVERSATIONS_PAGE_SIZE);
  });

  it('respeita o pedido e o teto', () => {
    expect(clampLimit(10)).toBe(10);
    expect(clampLimit(10.7)).toBe(10);
    expect(clampLimit(5000)).toBe(100);
  });
});
