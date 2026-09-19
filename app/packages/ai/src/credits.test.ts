import { describe, expect, it } from 'vitest';

import { parseLedgerCursor } from './credits';

const UUID = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';

describe('parseLedgerCursor', () => {
  it('separa data e id pelo último pipe', () => {
    const parsed = parseLedgerCursor(`2026-07-20T12:00:00.000Z|${UUID}`);
    expect(parsed?.at.toISOString()).toBe('2026-07-20T12:00:00.000Z');
    expect(parsed?.id).toBe(UUID);
  });

  it('recusa cursor vazio ou malformado', () => {
    expect(parseLedgerCursor(null)).toBeNull();
    expect(parseLedgerCursor('')).toBeNull();
    expect(parseLedgerCursor('sem-pipe')).toBeNull();
    expect(parseLedgerCursor(`|${UUID}`)).toBeNull();
    expect(parseLedgerCursor('data-invalida|' + UUID)).toBeNull();
  });

  it('recusa id que não é uuid', () => {
    expect(parseLedgerCursor('2026-07-20T12:00:00.000Z|abc')).toBeNull();
  });

  it('ignora o cursor antigo só de data, voltando à primeira página', () => {
    expect(parseLedgerCursor('2026-07-20T12:00:00.000Z')).toBeNull();
  });
});
