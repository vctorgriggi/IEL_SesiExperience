import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  aiCreditBalanceTable,
  aiCreditLedgerTable,
  db,
  eq,
  userTable
} from '@workspace/database';

import {
  consumeAiMessage,
  getAiCreditBalance,
  listCreditLedger,
  refundAiMessage
} from './credits';

/**
 * O que garante o saldo aqui é SQL (UPDATE condicional, transação), não
 * TypeScript: um mock provaria só o mock. Por isso este teste roda contra um
 * Postgres de verdade e fica desligado por padrão.
 *
 *   RUN_AI_INTEGRATION_TESTS=1 bun run test
 *
 * Precisa de `DATABASE_URL` apontando para um banco já migrado.
 */
const enabled = process.env.RUN_AI_INTEGRATION_TESTS === '1';

describe.skipIf(!enabled)('créditos (integração)', () => {
  let userId: string;

  beforeAll(async () => {
    const [user] = await db
      .insert(userTable)
      .values({
        name: 'Teste créditos IA',
        email: `ai-credits-${Date.now()}@test.local`
      })
      .returning({ id: userTable.id });
    userId = user!.id;
  });

  afterAll(async () => {
    if (userId) {
      await db.delete(userTable).where(eq(userTable.id, userId));
    }
  });

  it('concede a cota gratuita no primeiro acesso', async () => {
    const balance = await getAiCreditBalance(userId);
    expect(balance.freeRemaining).toBeGreaterThan(0);
    expect(balance.credits).toBe(0);
  });

  it('consome da cota gratuita e informa o bolso', async () => {
    const before = await getAiCreditBalance(userId);
    const charge = await consumeAiMessage(userId);

    expect(charge.ok).toBe(true);
    if (!charge.ok) return;
    expect(charge.source).toBe('free');
    expect(charge.balance.freeRemaining).toBe(before.freeRemaining - 1);
  });

  it('estorna no mesmo bolso e deixa o saldo como estava', async () => {
    const before = await getAiCreditBalance(userId);
    const charge = await consumeAiMessage(userId);
    expect(charge.ok).toBe(true);
    if (!charge.ok) return;

    const after = await refundAiMessage(userId, charge.source);
    expect(after.freeRemaining).toBe(before.freeRemaining);
    expect(after.credits).toBe(before.credits);
  });

  it('registra todo movimento no ledger', async () => {
    const rows = await db
      .select({
        delta: aiCreditLedgerTable.delta,
        reason: aiCreditLedgerTable.reason
      })
      .from(aiCreditLedgerTable)
      .where(eq(aiCreditLedgerTable.userId, userId));

    expect(rows.some((r) => r.reason === 'grant')).toBe(true);
    expect(rows.some((r) => r.reason === 'use')).toBe(true);
    expect(rows.some((r) => r.reason === 'refund')).toBe(true);

    // A soma do ledger tem que bater com o saldo atual.
    const balance = await getAiCreditBalance(userId);
    const total = rows.reduce((sum, r) => sum + r.delta, 0);
    expect(total).toBe(balance.freeRemaining + balance.credits);
  });

  it('recusa quando o saldo acaba, sem deixar negativo', async () => {
    await db
      .update(aiCreditBalanceTable)
      .set({ freeRemaining: 0, credits: 0 })
      .where(eq(aiCreditBalanceTable.userId, userId));

    const charge = await consumeAiMessage(userId);
    expect(charge.ok).toBe(false);
    expect(charge.balance.freeRemaining).toBe(0);
    expect(charge.balance.credits).toBe(0);
  });

  it('aguenta envios simultâneos sem furar o saldo', async () => {
    await db
      .update(aiCreditBalanceTable)
      .set({ freeRemaining: 3, credits: 0 })
      .where(eq(aiCreditBalanceTable.userId, userId));

    const results = await Promise.all(
      Array.from({ length: 10 }, () => consumeAiMessage(userId))
    );

    expect(results.filter((r) => r.ok)).toHaveLength(3);

    const balance = await getAiCreditBalance(userId);
    expect(balance.freeRemaining).toBe(0);
    expect(balance.credits).toBe(0);
  });

  it('na virada do bolso, cada cobrança sabe de onde saiu', async () => {
    // Um grátis e um pago disputados por duas abas: se o `source` viesse da
    // leitura anterior ao UPDATE, as duas diriam `free` e um estorno devolveria
    // grátis no lugar do crédito comprado.
    await db
      .update(aiCreditBalanceTable)
      .set({ freeRemaining: 1, credits: 1 })
      .where(eq(aiCreditBalanceTable.userId, userId));

    const results = await Promise.all([
      consumeAiMessage(userId),
      consumeAiMessage(userId)
    ]);

    const sources = results
      .filter((r) => r.ok)
      .map((r) => (r.ok ? r.source : null));
    expect(sources).toHaveLength(2);
    expect(sources.sort()).toEqual(['credits', 'free']);

    for (const source of sources) {
      if (source) await refundAiMessage(userId, source);
    }

    const balance = await getAiCreditBalance(userId);
    expect(balance.freeRemaining).toBe(1);
    expect(balance.credits).toBe(1);
  });

  it('extrato não esconde lançamentos gravados no mesmo instante', async () => {
    const at = new Date('2026-07-20T12:00:00.000Z');
    await db.insert(aiCreditLedgerTable).values([
      { userId, delta: 1, reason: 'grant', createdAt: at },
      { userId, delta: -1, reason: 'use', createdAt: at }
    ]);

    const first = await listCreditLedger({ userId, limit: 1 });
    expect(first.items).toHaveLength(1);
    expect(first.nextCursor).not.toBeNull();

    const seen = new Set(first.items.map((i) => i.id));
    let cursor = first.nextCursor;
    while (cursor) {
      const page = await listCreditLedger({ userId, limit: 1, cursor });
      for (const item of page.items) {
        expect(seen.has(item.id)).toBe(false);
        seen.add(item.id);
      }
      cursor = page.nextCursor;
    }

    const all = await db
      .select({ id: aiCreditLedgerTable.id })
      .from(aiCreditLedgerTable)
      .where(eq(aiCreditLedgerTable.userId, userId));
    expect(seen.size).toBe(all.length);
  });
});
