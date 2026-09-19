import 'server-only';

import {
  aiConversationTable,
  aiMessageTable,
  asc,
  db,
  desc,
  eq,
  sql,
  type AiMessageRole
} from '@workspace/database';

import { getOwnedConversationId } from './conversations';

export type ChatMessage = {
  id: string;
  role: AiMessageRole;
  content: string;
  createdAt: Date;
};

const messageColumns = {
  id: aiMessageTable.id,
  role: aiMessageTable.role,
  content: aiMessageTable.content,
  createdAt: aiMessageTable.createdAt
};

export async function listMessages(
  conversationId: string
): Promise<ChatMessage[]> {
  return db
    .select(messageColumns)
    .from(aiMessageTable)
    .where(eq(aiMessageTable.conversationId, conversationId))
    .orderBy(asc(aiMessageTable.createdAt));
}

async function touchConversation(conversationId: string): Promise<void> {
  await db
    .update(aiConversationTable)
    .set({ updatedAt: sql`now()` })
    .where(eq(aiConversationTable.id, conversationId));
}

export async function appendMessage(input: {
  conversationId: string;
  userId: string;
  role: AiMessageRole;
  content: string;
}): Promise<ChatMessage | null> {
  const ownedId = await getOwnedConversationId(
    input.conversationId,
    input.userId
  );
  if (!ownedId) return null;

  const [message] = await db
    .insert(aiMessageTable)
    .values({
      conversationId: ownedId,
      role: input.role,
      content: input.content
    })
    .returning(messageColumns);

  await touchConversation(ownedId);

  return message ?? null;
}

/**
 * Com `replaceLast`, sobrescreve a última resposta em vez de inserir: é o que
 * impede o "regenerar" de acumular respostas duplicadas na conversa.
 */
export async function upsertAssistantMessage(input: {
  conversationId: string;
  userId: string;
  content: string;
  replaceLast?: boolean;
}): Promise<ChatMessage | null> {
  const ownedId = await getOwnedConversationId(
    input.conversationId,
    input.userId
  );
  if (!ownedId) return null;

  if (input.replaceLast) {
    // Só a resposta do turno atual pode ser sobrescrita: a última mensagem da
    // conversa. Buscar a última `assistant` da conversa inteira destruiria a
    // resposta do turno anterior quando a geração atual não gravou nada.
    const [last] = await db
      .select({ id: aiMessageTable.id, role: aiMessageTable.role })
      .from(aiMessageTable)
      .where(eq(aiMessageTable.conversationId, ownedId))
      .orderBy(desc(aiMessageTable.createdAt), desc(aiMessageTable.id))
      .limit(1);

    if (last?.role === 'assistant') {
      const [updated] = await db
        .update(aiMessageTable)
        .set({ content: input.content })
        .where(eq(aiMessageTable.id, last.id))
        .returning(messageColumns);

      await touchConversation(ownedId);
      return updated ?? null;
    }
  }

  return appendMessage({
    conversationId: ownedId,
    userId: input.userId,
    role: 'assistant',
    content: input.content
  });
}
