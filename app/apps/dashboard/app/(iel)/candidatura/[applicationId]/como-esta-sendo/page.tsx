import type { Metadata } from 'next';
import { CheckInScreen } from '@/components/iel-demo/candidate/check-in-screen';

export const metadata: Metadata = { title: 'Como está sendo?' };

type PageProps = {
  params: Promise<{ applicationId: string }>;
};

/**
 * A pergunta do IEL a quem foi contratado, aos 30, 60 e 90 dias.
 *
 * Mesmo endereço da candidatura, sem vaga nem empresa no caminho (R5), e o
 * mesmo link nas três vezes: a pessoa guarda um só.
 */
export default async function IelCandidateCheckInPage({ params }: PageProps) {
  const { applicationId } = await params;
  return <CheckInScreen applicationId={applicationId} />;
}
