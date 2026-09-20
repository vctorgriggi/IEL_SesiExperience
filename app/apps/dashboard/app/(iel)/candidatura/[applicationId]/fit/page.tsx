import type { Metadata } from 'next';
import { FitQuestionnaireScreen } from '@/components/iel-demo/candidate/fit-questionnaire-screen';
import { analistaLogada } from '@/features/iel-demo/acesso/sessao';

export const metadata: Metadata = { title: 'Questionário da vaga' };

type PageProps = {
  params: Promise<{ applicationId: string }>;
};

export default async function IelCandidateFitPage({ params }: PageProps) {
  const { applicationId } = await params;
  const equipe = await analistaLogada();
  return (
    <FitQuestionnaireScreen
      applicationId={applicationId}
      equipeLogada={equipe}
    />
  );
}
