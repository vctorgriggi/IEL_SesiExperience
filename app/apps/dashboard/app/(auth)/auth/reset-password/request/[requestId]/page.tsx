import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ResetPasswordCard } from '@/components/auth/reset-password/reset-password-card';
import { createTitle } from '@/lib/formatters';

export const metadata: Metadata = {
  title: createTitle('Redefinir senha')
};

export default async function ResetPasswordPage({
  params
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  if (!requestId) return notFound();

  return (
    <ResetPasswordCard
      requestId={requestId}
      expires={new Date(Date.now() + 60 * 60 * 1000)}
    />
  );
}
