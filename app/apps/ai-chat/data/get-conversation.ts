import 'server-only';

import {
  getConversation as findConversation,
  listMessages
} from '@workspace/ai';
import { dedupedAuth } from '@workspace/auth';

import type { ConversationWithMessages } from '~/types/conversation';

export type { Message, ConversationWithMessages } from '~/types/conversation';

/**
 * Conversa + mensagens para a página. Leitura server-first, direto no banco
 * pelo `@workspace/ai`; a posse é checada lá dentro.
 */
export async function getConversation(
  id: string
): Promise<ConversationWithMessages | null> {
  const session = await dedupedAuth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const conversation = await findConversation(id, userId);
  if (!conversation) return null;

  const messages = await listMessages(conversation.id);

  return {
    id: conversation.id,
    title: conversation.title,
    model: conversation.model,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString()
    }))
  };
}
