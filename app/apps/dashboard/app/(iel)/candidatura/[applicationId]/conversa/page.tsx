import type { Metadata } from 'next';
import { ConversaCandidato } from '@/components/iel-demo/chat/conversa-candidato';

export const metadata: Metadata = { title: 'Questionário da vaga' };

type PageProps = {
  params: Promise<{ applicationId: string }>;
};

/**
 * O questionário do candidato em forma de conversa guiada (C2).
 *
 * Mesmo link por candidatura, sem vaga nem empresa no caminho (R5): o que a
 * pessoa vê da vaga sai de `getCandidateJobView`.
 */
export default async function IelCandidateConversationPage({
  params
}: PageProps) {
  const { applicationId } = await params;
  return <ConversaCandidato applicationId={applicationId} />;
}
