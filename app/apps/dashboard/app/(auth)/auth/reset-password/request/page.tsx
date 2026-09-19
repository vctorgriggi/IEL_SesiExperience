import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ResetPasswordCard } from '@/components/auth/reset-password/reset-password-card';
import { createTitle } from '@/lib/formatters';

import { routes } from '@workspace/routes';

export const metadata: Metadata = {
  title: createTitle('Redefinir senha')
};

export default async function ResetPasswordRequestPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const token = params.token;

  if (error || !token) {
    redirect(routes.dashboard.auth.resetPassword.expired);
  }

  return (
    <ResetPasswordCard
      requestId={token}
      expires={new Date(Date.now() + 60 * 60 * 1000)}
    />
  );
}
