import { notFound } from 'next/navigation';

import { AI_CHAT_DEMO_UPLOADS, listKnowledgeDocuments } from '@workspace/ai';
import { dedupedAuth } from '@workspace/auth';

import { AppShell } from '~/components/app-shell';
import { KnowledgeManager } from '~/components/knowledge/knowledge-manager';
import { getConversations } from '~/data/get-conversations';
import { getDefaultChatModel } from '~/lib/available-models';
import { canEditKnowledge, canOpenKnowledge } from '~/lib/knowledge-access';

export const metadata = { title: 'Base de conhecimento' };

export default async function KnowledgePage() {
  const session = await dedupedAuth();
  if (!session?.user?.id) notFound();

  const [documents, page] = await Promise.all([
    listKnowledgeDocuments(),
    getConversations()
  ]);

  return (
    <AppShell
      title="Base de conhecimento"
      conversations={page.items}
      nextCursor={page.nextCursor}
      defaultModel={getDefaultChatModel()}
      canOpenKnowledge={canOpenKnowledge(session.user.email)}
      user={session.user}
    >
      <KnowledgeManager
        documents={documents}
        canDelete={canEditKnowledge(session.user.email)}
        uploadLimit={AI_CHAT_DEMO_UPLOADS}
      />
    </AppShell>
  );
}
