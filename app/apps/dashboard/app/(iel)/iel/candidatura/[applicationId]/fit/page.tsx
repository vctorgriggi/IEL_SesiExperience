import { FitQuestionnaireScreen } from '@/components/iel-demo/candidate/fit-questionnaire-screen';

type PageProps = {
  params: Promise<{ applicationId: string }>;
};

export default async function IelCandidateFitPage({ params }: PageProps) {
  const { applicationId } = await params;
  return <FitQuestionnaireScreen applicationId={applicationId} />;
}
