import 'server-only';

import { validate as uuidValidate } from 'uuid';

import {
  aiConversationTable,
  and,
  db,
  desc,
  eq,
  ilike,
  lt,
  or
} from '@workspace/database';

export type Conversation = {
  id: string;
  title: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ConversationPage = {
  items: Conversation[];
  nextCursor: string | null;
};

export const CONVERSATIONS_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 100;

const conversationColumns = {
  id: aiConversationTable.id,
  title: aiConversationTable.title,
  model: aiConversationTable.model,
  createdAt: aiConversationTable.createdAt,
  updatedAt: aiConversationTable.updatedAt
};

/**
 * Cursor `updatedAt|id`. O id entra junto porque conversas podem compartilhar
 * o mesmo `updatedAt`, e comparar só a data pularia linhas.
 */
export function parseCursor(
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

export function clampLimit(value: number | null | undefined): number {
  if (!value || !Number.isFinite(value) || value < 1) {
    return CONVERSATIONS_PAGE_SIZE;
  }
  return Math.min(Math.floor(value), MAX_PAGE_SIZE);
}

export function buildCursor(conversation: Conversation): string {
  return `${conversation.updatedAt.toISOString()}|${conversation.id}`;
}

export async function listConversations(input: {
  userId: string;
  limit?: number;
  cursor?: string | null;
  query?: string | null;
}): Promise<ConversationPage> {
  const limit = clampLimit(input.limit);
  const cursor = parseCursor(input.cursor);
  const query = input.query?.trim() ?? '';

  const rows = await db
    .select(conversationColumns)
    .from(aiConversationTable)
    .where(
      and(
        eq(aiConversationTable.userId, input.userId),
        query ? ilike(aiConversationTable.title, `%${query}%`) : undefined,
        // Comparação de tupla escrita com os operadores do drizzle: no template
        // `sql` cru o driver recebe o Date sem o mapper da coluna e estoura.
        cursor
          ? or(
              lt(aiConversationTable.updatedAt, cursor.at),
              and(
                eq(aiConversationTable.updatedAt, cursor.at),
                lt(aiConversationTable.id, cursor.id)
              )
            )
          : undefined
      )
    )
    .orderBy(desc(aiConversationTable.updatedAt), desc(aiConversationTable.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items.at(-1);

  return {
    items,
    nextCursor: hasMore && last ? buildCursor(last) : null
  };
}

export async function getOwnedConversationId(
  id: string,
  userId: string
): Promise<string | null> {
  if (!uuidValidate(id)) return null;

  const [row] = await db
    .select({ id: aiConversationTable.id })
    .from(aiConversationTable)
    .where(
      and(
        eq(aiConversationTable.id, id),
        eq(aiConversationTable.userId, userId)
      )
    )
    .limit(1);

  return row?.id ?? null;
}

export async function getConversation(
  id: string,
  userId: string
): Promise<Conversation | null> {
  if (!uuidValidate(id)) return null;

  const [row] = await db
    .select(conversationColumns)
    .from(aiConversationTable)
    .where(
      and(
        eq(aiConversationTable.id, id),
        eq(aiConversationTable.userId, userId)
      )
    )
    .limit(1);

  return row ?? null;
}

export async function createConversation(input: {
  userId: string;
  title: string;
  model: string;
}): Promise<Conversation | null> {
  const [row] = await db
    .insert(aiConversationTable)
    .values({
      userId: input.userId,
      title: input.title,
      model: input.model
    })
    .returning(conversationColumns);

  return row ?? null;
}

/** `false` quando a conversa não existe ou não é do usuário. */
export async function updateConversation(input: {
  id: string;
  userId: string;
  title?: string;
  model?: string;
}): Promise<boolean> {
  const ownedId = await getOwnedConversationId(input.id, input.userId);
  if (!ownedId) return false;

  const patch = {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.model !== undefined ? { model: input.model } : {})
  };
  if (Object.keys(patch).length === 0) return true;

  await db
    .update(aiConversationTable)
    .set(patch)
    .where(eq(aiConversationTable.id, ownedId));

  return true;
}

export async function deleteConversation(
  id: string,
  userId: string
): Promise<boolean> {
  const ownedId = await getOwnedConversationId(id, userId);
  if (!ownedId) return false;

  await db
    .delete(aiConversationTable)
    .where(eq(aiConversationTable.id, ownedId));

  return true;
}
