import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { dedupedAuth } from '@workspace/auth';

import { ChatShell } from '~/components/chat-shell';
import { getConversation } from '~/data/get-conversation';
import { getConversations } from '~/data/get-conversations';
import { getKnowledgeTopics } from '~/data/get-knowledge-topics';
import {
  getAvailableModels,
  getDefaultChatModel
} from '~/lib/available-models';
import { canOpenKnowledge } from '~/lib/knowledge-access';

interface Props {
  params: Promise<{ id: string }>;
}

const BASE_TITLE = 'Chat com IA – Arki Eventos';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const conversation = await getConversation(id);
  const title = conversation?.title
    ? `${conversation.title} | ${BASE_TITLE}`
    : BASE_TITLE;
  return { title };
}

export default async function ConversationPage({ params }: Props) {
  const { id } = await params;

  const [session, page, conversation, knowledgeTopics] = await Promise.all([
    dedupedAuth(),
    getConversations(),
    getConversation(id),
    getKnowledgeTopics()
  ]);

  if (!conversation) notFound();

  return (
    <ChatShell
      key={conversation.id}
      conversations={page.items}
      nextCursor={page.nextCursor}
      initialConversation={conversation}
      availableModels={getAvailableModels()}
      defaultModel={getDefaultChatModel()}
      knowledgeTopics={knowledgeTopics}
      canOpenKnowledge={canOpenKnowledge(session?.user?.email)}
      user={session?.user ?? null}
    />
  );
}
