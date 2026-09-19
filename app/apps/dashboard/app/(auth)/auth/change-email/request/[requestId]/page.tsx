import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChangeEmailSuccessCard } from '@/components/auth/change-email/change-email-success-card';
import { confirmChangeEmailRequest } from '@/features/account/data/confirm-change-email-request';
import { createTitle } from '@/lib/formatters';
import { validate as uuidValidate } from 'uuid';

export const metadata: Metadata = {
  title: createTitle('Alterar email')
};

export default async function ChangeEmailPage({
  params
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;

  if (!requestId || !uuidValidate(requestId)) {
    return notFound();
  }

  const result = await confirmChangeEmailRequest(requestId);
  if (!result) return notFound();

  return <ChangeEmailSuccessCard email={result.email} />;
}
