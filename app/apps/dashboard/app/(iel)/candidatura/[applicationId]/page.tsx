import type { Metadata } from 'next';
import { MinhaCandidaturaScreen } from '@/components/iel-demo/candidate/minha-candidatura-screen';

export const metadata: Metadata = { title: 'Minha candidatura' };

type PageProps = {
  params: Promise<{ applicationId: string }>;
};

/**
 * A casa do candidato no produto.
 *
 * O questionário (`/fit`) e a conversa (`/conversa`) são tarefas; esta é a
 * página para onde ele volta para saber em que pé está. Mesmo endereço por
 * candidatura, sem vaga nem empresa no caminho (R5).
 */
export default async function IelCandidateApplicationPage({
  params
}: PageProps) {
  const { applicationId } = await params;
  return <MinhaCandidaturaScreen applicationId={applicationId} />;
}
