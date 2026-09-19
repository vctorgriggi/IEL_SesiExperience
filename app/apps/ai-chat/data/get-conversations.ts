import 'server-only';

import { listConversations } from '@workspace/ai';
import { dedupedAuth } from '@workspace/auth';

import {
  CONVERSATIONS_PAGE_SIZE,
  type ConversationPage
} from '~/types/conversation';

export type { Conversation, ConversationPage } from '~/types/conversation';

const EMPTY_PAGE: ConversationPage = { items: [], nextCursor: null };

/**
 * Primeira página da sidebar. Leitura server-first: o RSC vai direto no banco
 * pelo `@workspace/ai`, sem passar pela API do dashboard.
 */
export async function getConversations(): Promise<ConversationPage> {
  const session = await dedupedAuth();
  const userId = session?.user?.id;
  if (!userId) return EMPTY_PAGE;

  const page = await listConversations({
    userId,
    limit: CONVERSATIONS_PAGE_SIZE
  });

  return {
    items: page.items.map((c) => ({
      id: c.id,
      title: c.title,
      model: c.model,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString()
    })),
    nextCursor: page.nextCursor
  };
}
