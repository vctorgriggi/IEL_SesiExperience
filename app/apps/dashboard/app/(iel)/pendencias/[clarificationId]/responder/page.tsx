import type { Metadata } from 'next';
import { RecipientExperienceScreen } from '@/components/iel-demo/clarifications/recipient-experience-screen';

export const metadata: Metadata = { title: 'Responder à pergunta' };

type PageProps = {
  params: Promise<{ clarificationId: string }>;
};

export default async function IelRecipientExperiencePage({
  params
}: PageProps) {
  const { clarificationId } = await params;
  return <RecipientExperienceScreen clarificationId={clarificationId} />;
}
