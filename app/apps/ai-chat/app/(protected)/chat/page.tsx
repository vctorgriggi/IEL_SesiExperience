import { dedupedAuth } from '@workspace/auth';

import { ChatShell } from '~/components/chat-shell';
import { getConversations } from '~/data/get-conversations';
import { getKnowledgeTopics } from '~/data/get-knowledge-topics';
import {
  getAvailableModels,
  getDefaultChatModel
} from '~/lib/available-models';
import { canOpenKnowledge } from '~/lib/knowledge-access';

export const metadata = { title: 'Chat com IA – Arki Eventos' };

export default async function ChatPage() {
  const [session, page, knowledgeTopics] = await Promise.all([
    dedupedAuth(),
    getConversations(),
    getKnowledgeTopics()
  ]);

  return (
    <ChatShell
      conversations={page.items}
      nextCursor={page.nextCursor}
      initialConversation={null}
      availableModels={getAvailableModels()}
      defaultModel={getDefaultChatModel()}
      knowledgeTopics={knowledgeTopics}
      canOpenKnowledge={canOpenKnowledge(session?.user?.email)}
      user={session?.user ?? null}
    />
  );
}
