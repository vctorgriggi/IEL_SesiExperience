import 'server-only';

import { validate as uuidValidate } from 'uuid';

import { extractPaidBillingId } from '@workspace/billing';
import {
  aiCreditBalanceTable,
  aiCreditLedgerTable,
  aiCreditPurchaseTable,
  and,
  db,
  desc,
  eq,
  lt,
  or,
  sql,
  type AiCreditReason,
  type DatabaseType,
  type TransactionType
} from '@workspace/database';

import { AI_CHAT_FREE_MESSAGES } from './credit-packs';

type Executor = DatabaseType | TransactionType;

export type AiCreditBalance = { freeRemaining: number; credits: number };

export type AiCreditSource = 'free' | 'credits';

export type ConsumeResult =
  | { ok: true; source: AiCreditSource; balance: AiCreditBalance }
  | { ok: false; balance: AiCreditBalance };

const EMPTY_BALANCE: AiCreditBalance = { freeRemaining: 0, credits: 0 };

async function readBalance(
  executor: Executor,
  userId: string
): Promise<AiCreditBalance> {
  const [row] = await executor
    .select({
      freeRemaining: aiCreditBalanceTable.freeRemaining,
      credits: aiCreditBalanceTable.credits
    })
    .from(aiCreditBalanceTable)
    .where(eq(aiCreditBalanceTable.userId, userId))
    .limit(1);

  return row ?? EMPTY_BALANCE;
}

/** Idempotente: na primeira criação concede a cota gratuita e registra no ledger. */
export async function ensureBalanceRow(
  executor: Executor,
  userId: string
): Promise<AiCreditBalance> {
  const inserted = await executor
    .insert(aiCreditBalanceTable)
    .values({ userId, freeRemaining: AI_CHAT_FREE_MESSAGES, credits: 0 })
    .onConflictDoNothing({ target: aiCreditBalanceTable.userId })
    .returning({
      freeRemaining: aiCreditBalanceTable.freeRemaining,
      credits: aiCreditBalanceTable.credits
    });

  if (inserted.length > 0) {
    if (AI_CHAT_FREE_MESSAGES > 0) {
      await executor.insert(aiCreditLedgerTable).values({
        userId,
        delta: AI_CHAT_FREE_MESSAGES,
        reason: 'grant'
      });
    }
    return inserted[0]!;
  }

  return readBalance(executor, userId);
}

export async function getAiCreditBalance(
  userId: string
): Promise<AiCreditBalance> {
  return ensureBalanceRow(db, userId);
}

/**
 * Gasta a cota gratuita primeiro, depois os créditos comprados. O decremento é
 * um UPDATE condicional: duas abas enviando ao mesmo tempo não furam o saldo.
 */
export async function consumeAiMessage(userId: string): Promise<ConsumeResult> {
  return db.transaction(async (tx) => {
    await ensureBalanceRow(tx, userId);

    // A leitura trava a linha até o fim da transação. Sem o lock, o `CASE` do
    // UPDATE é reavaliado sobre a linha já alterada por outra aba e o `source`
    // aponta para o bolso errado: o estorno devolveria grátis no lugar de pago.
    const [before] = await tx
      .select({
        freeRemaining: aiCreditBalanceTable.freeRemaining,
        credits: aiCreditBalanceTable.credits
      })
      .from(aiCreditBalanceTable)
      .where(eq(aiCreditBalanceTable.userId, userId))
      .limit(1)
      .for('update');

    const source: AiCreditSource =
      (before?.freeRemaining ?? 0) > 0 ? 'free' : 'credits';

    const updated = await tx
      .update(aiCreditBalanceTable)
      .set({
        freeRemaining: sql`CASE WHEN ${aiCreditBalanceTable.freeRemaining} > 0 THEN ${aiCreditBalanceTable.freeRemaining} - 1 ELSE ${aiCreditBalanceTable.freeRemaining} END`,
        credits: sql`CASE WHEN ${aiCreditBalanceTable.freeRemaining} <= 0 AND ${aiCreditBalanceTable.credits} > 0 THEN ${aiCreditBalanceTable.credits} - 1 ELSE ${aiCreditBalanceTable.credits} END`
      })
      .where(
        and(
          eq(aiCreditBalanceTable.userId, userId),
          sql`(${aiCreditBalanceTable.freeRemaining} > 0 OR ${aiCreditBalanceTable.credits} > 0)`
        )
      )
      .returning({
        freeRemaining: aiCreditBalanceTable.freeRemaining,
        credits: aiCreditBalanceTable.credits
      });

    if (updated.length === 0) {
      return { ok: false, balance: await readBalance(tx, userId) };
    }

    await tx
      .insert(aiCreditLedgerTable)
      .values({ userId, delta: -1, reason: 'use' });

    return { ok: true, source, balance: updated[0]! };
  });
}

/** Devolve uma mensagem cobrada cuja geração falhou, no bolso de onde saiu. */
export async function refundAiMessage(
  userId: string,
  source: AiCreditSource
): Promise<AiCreditBalance> {
  return db.transaction(async (tx) => {
    await ensureBalanceRow(tx, userId);

    const [updated] = await tx
      .update(aiCreditBalanceTable)
      .set(
        source === 'free'
          ? { freeRemaining: sql`${aiCreditBalanceTable.freeRemaining} + 1` }
          : { credits: sql`${aiCreditBalanceTable.credits} + 1` }
      )
      .where(eq(aiCreditBalanceTable.userId, userId))
      .returning({
        freeRemaining: aiCreditBalanceTable.freeRemaining,
        credits: aiCreditBalanceTable.credits
      });

    await tx
      .insert(aiCreditLedgerTable)
      .values({ userId, delta: 1, reason: 'refund' });

    return updated ?? EMPTY_BALANCE;
  });
}

export type CreditLedgerEntry = {
  id: string;
  delta: number;
  reason: AiCreditReason;
  refId: string | null;
  createdAt: Date;
};

export type CreditLedgerPage = {
  items: CreditLedgerEntry[];
  nextCursor: string | null;
};

export const CREDIT_LEDGER_PAGE_SIZE = 20;
const MAX_LEDGER_PAGE_SIZE = 100;

export function parseLedgerCursor(
  value: string | null | undefined
): { at: Date; id: string } | null {
  if (!value) return null;
  const separator = value.lastIndexOf('|');
  if (separator < 1) return null;

  const at = new Date(value.slice(0, separator));
  const id = value.slice(separator + 1);
  if (Number.isNaN(at.getTime()) || !uuidValidate(id)) return null;

  return { at, id };
}

/** Extrato do usuário, do mais recente pro mais antigo. */
export async function listCreditLedger(input: {
  userId: string;
  limit?: number;
  cursor?: string | null;
}): Promise<CreditLedgerPage> {
  const requested = input.limit ?? CREDIT_LEDGER_PAGE_SIZE;
  const limit = Math.min(
    Math.max(Math.floor(requested) || CREDIT_LEDGER_PAGE_SIZE, 1),
    MAX_LEDGER_PAGE_SIZE
  );

  // `createdAt` é o timestamp da transação, então lançamentos gravados juntos
  // empatam. Sem o id no cursor, o par que cai na virada da página some.
  const cursor = parseLedgerCursor(input.cursor);

  const rows = await db
    .select({
      id: aiCreditLedgerTable.id,
      delta: aiCreditLedgerTable.delta,
      reason: aiCreditLedgerTable.reason,
      refId: aiCreditLedgerTable.refId,
      createdAt: aiCreditLedgerTable.createdAt
    })
    .from(aiCreditLedgerTable)
    .where(
      and(
        eq(aiCreditLedgerTable.userId, input.userId),
        cursor
          ? or(
              lt(aiCreditLedgerTable.createdAt, cursor.at),
              and(
                eq(aiCreditLedgerTable.createdAt, cursor.at),
                lt(aiCreditLedgerTable.id, cursor.id)
              )
            )
          : undefined
      )
    )
    .orderBy(desc(aiCreditLedgerTable.createdAt), desc(aiCreditLedgerTable.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items.at(-1);

  return {
    items,
    nextCursor:
      hasMore && last ? `${last.createdAt.toISOString()}|${last.id}` : null
  };
}

/** O crédito só entra quando o webhook confirmar o pagamento. */
export async function recordAiCreditPurchase(input: {
  billingId: string;
  userId: string;
  credits: number;
  amountCents: number;
}): Promise<void> {
  await db
    .insert(aiCreditPurchaseTable)
    .values({
      billingId: input.billingId,
      userId: input.userId,
      credits: input.credits,
      amountCents: input.amountCents,
      status: 'pending'
    })
    .onConflictDoNothing({ target: aiCreditPurchaseTable.billingId });
}

/**
 * A transição `pending -> paid` acontece uma única vez, então webhook repetido
 * não credita duas vezes. Retorna `true` quando creditou nesta chamada.
 */
export async function settleAiCreditPurchase(
  billingId: string
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const settled = await tx
      .update(aiCreditPurchaseTable)
      .set({ status: 'paid' })
      .where(
        and(
          eq(aiCreditPurchaseTable.billingId, billingId),
          eq(aiCreditPurchaseTable.status, 'pending')
        )
      )
      .returning({
        userId: aiCreditPurchaseTable.userId,
        credits: aiCreditPurchaseTable.credits
      });

    if (settled.length === 0) return false;

    const { userId, credits } = settled[0]!;

    await ensureBalanceRow(tx, userId);
    await tx
      .update(aiCreditBalanceTable)
      .set({ credits: sql`${aiCreditBalanceTable.credits} + ${credits}` })
      .where(eq(aiCreditBalanceTable.userId, userId));
    await tx.insert(aiCreditLedgerTable).values({
      userId,
      delta: credits,
      reason: 'purchase',
      refId: billingId
    });

    return true;
  });
}

/**
 * Ignora silenciosamente qualquer evento que não seja pagamento confirmado,
 * inclusive billings que não sejam compra de crédito: eles não têm linha em
 * `ai_credit_purchase`.
 */
export async function settleAiCreditFromAbacatePay(
  payload: unknown
): Promise<boolean> {
  const billingId = extractPaidBillingId(payload);
  if (!billingId) return false;
  return settleAiCreditPurchase(billingId);
}
