import 'server-only';

import { aiDemoQuotaTable, db, eq, sql } from '@workspace/database';

export type DemoQuotaKind = 'messages' | 'uploads';

export type DemoQuotaResult = {
  ok: boolean;
  used: number;
  limit: number;
  remaining: number;
};

function envLimit(name: string, fallback: number) {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export const AI_CHAT_DEMO_MESSAGES = envLimit('AI_CHAT_DEMO_MESSAGES', 3);
export const AI_CHAT_DEMO_UPLOADS = envLimit('AI_CHAT_DEMO_UPLOADS', 3);

export function demoQuotaLimit(kind: DemoQuotaKind) {
  return kind === 'messages' ? AI_CHAT_DEMO_MESSAGES : AI_CHAT_DEMO_UPLOADS;
}

const column = {
  messages: aiDemoQuotaTable.messagesUsed,
  uploads: aiDemoQuotaTable.uploadsUsed
} as const;

/**
 * Cota vitalícia por IP da versão demo. O incremento é um upsert condicional:
 * a linha só é atualizada enquanto o consumo estiver abaixo do teto, então
 * requisições simultâneas do mesmo IP não furam o limite.
 */
export async function consumeDemoQuota(ip: string, kind: DemoQuotaKind) {
  const limit = demoQuotaLimit(kind);
  const used = column[kind];

  if (limit <= 0) return { ok: false, used: 0, limit, remaining: 0 };

  const [row] = await db
    .insert(aiDemoQuotaTable)
    .values({
      ip,
      messagesUsed: kind === 'messages' ? 1 : 0,
      uploadsUsed: kind === 'uploads' ? 1 : 0
    })
    .onConflictDoUpdate({
      target: aiDemoQuotaTable.ip,
      set: {
        [kind === 'messages' ? 'messagesUsed' : 'uploadsUsed']: sql`${used} + 1`
      },
      setWhere: sql`${used} < ${limit}`
    })
    .returning({
      messagesUsed: aiDemoQuotaTable.messagesUsed,
      uploadsUsed: aiDemoQuotaTable.uploadsUsed
    });

  if (!row) {
    return { ok: false, used: limit, limit, remaining: 0 };
  }

  const total = kind === 'messages' ? row.messagesUsed : row.uploadsUsed;
  return {
    ok: true,
    used: total,
    limit,
    remaining: Math.max(0, limit - total)
  };
}

/** Devolve o consumo quando a operação cobrada falhou. */
export async function releaseDemoQuota(ip: string, kind: DemoQuotaKind) {
  const used = column[kind];

  await db
    .update(aiDemoQuotaTable)
    .set({
      [kind === 'messages' ? 'messagesUsed' : 'uploadsUsed']:
        sql`GREATEST(${used} - 1, 0)`
    })
    .where(eq(aiDemoQuotaTable.ip, ip));
}

export async function getDemoQuota(ip: string): Promise<{
  messages: DemoQuotaResult;
  uploads: DemoQuotaResult;
}> {
  const [row] = await db
    .select({
      messagesUsed: aiDemoQuotaTable.messagesUsed,
      uploadsUsed: aiDemoQuotaTable.uploadsUsed
    })
    .from(aiDemoQuotaTable)
    .where(eq(aiDemoQuotaTable.ip, ip))
    .limit(1);

  const build = (kind: DemoQuotaKind, value: number): DemoQuotaResult => {
    const limit = demoQuotaLimit(kind);
    return {
      ok: value < limit,
      used: value,
      limit,
      remaining: Math.max(0, limit - value)
    };
  };

  return {
    messages: build('messages', row?.messagesUsed ?? 0),
    uploads: build('uploads', row?.uploadsUsed ?? 0)
  };
}
