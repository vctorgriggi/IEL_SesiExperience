import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { db, eq, userTable } from '@workspace/database';

import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations
} from './conversations';

const enabled = process.env.RUN_AI_INTEGRATION_TESTS === '1';

describe.skipIf(!enabled)('conversas (integração)', () => {
  let userId: string;
  let otherUserId: string;

  beforeAll(async () => {
    const inserted = await db
      .insert(userTable)
      .values([
        { name: 'Dono', email: `ai-conv-${Date.now()}@test.local` },
        { name: 'Intruso', email: `ai-conv-other-${Date.now()}@test.local` }
      ])
      .returning({ id: userTable.id });
    userId = inserted[0]!.id;
    otherUserId = inserted[1]!.id;

    for (let i = 0; i < 5; i += 1) {
      await createConversation({
        userId,
        title: `Conversa ${i}`,
        model: 'gpt-4o-mini'
      });
    }
  });

  afterAll(async () => {
    for (const id of [userId, otherUserId]) {
      if (id) await db.delete(userTable).where(eq(userTable.id, id));
    }
  });

  it('pagina por cursor sem repetir nem perder conversa', async () => {
    const seen = new Set<string>();
    let cursor: string | null = null;
    let pages = 0;

    do {
      const page = await listConversations({ userId, limit: 2, cursor });
      for (const item of page.items) {
        expect(seen.has(item.id)).toBe(false);
        seen.add(item.id);
      }
      cursor = page.nextCursor;
      pages += 1;
      expect(pages).toBeLessThan(10);
    } while (cursor);

    expect(seen.size).toBe(5);
  });

  it('cursor forjado não derruba a consulta', async () => {
    const page = await listConversations({
      userId,
      limit: 2,
      cursor: "2026-07-20T00:00:00.000Z|1' OR '1'='1"
    });

    expect(page.items).toHaveLength(2);
  });

  it('busca por título filtra no servidor', async () => {
    const page = await listConversations({ userId, query: 'Conversa 3' });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]!.title).toBe('Conversa 3');
  });

  it('não entrega conversa de outro usuário', async () => {
    const mine = await createConversation({
      userId,
      title: 'Privada',
      model: 'gpt-4o-mini'
    });
    expect(mine).not.toBeNull();
    const id = mine!.id;

    expect(await getConversation(id, otherUserId)).toBeNull();
    expect(await deleteConversation(id, otherUserId)).toBe(false);
    expect(await getConversation(id, userId)).not.toBeNull();
  });
});
