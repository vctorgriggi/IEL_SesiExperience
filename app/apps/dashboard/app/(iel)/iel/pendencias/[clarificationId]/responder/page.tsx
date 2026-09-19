import { RecipientExperienceScreen } from '@/components/iel-demo/clarifications/recipient-experience-screen';

type PageProps = {
  params: Promise<{ clarificationId: string }>;
};

export default async function IelRecipientExperiencePage({
  params
}: PageProps) {
  const { clarificationId } = await params;
  return <RecipientExperienceScreen clarificationId={clarificationId} />;
}
