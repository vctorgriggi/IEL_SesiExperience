import { type Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createTitle } from '@/lib/formatters';

import {
  findIdentifierByVerificationToken,
  findVerificationTokenByToken,
  verifyEmail
} from '@workspace/auth/verification';
import { routes } from '@workspace/routes';

export const metadata: Metadata = {
  title: createTitle('Verificacao de email')
};

export default async function EmailVerificationRequestPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token) redirect(routes.dashboard.auth.verifyEmail.expired);

  const found = await findVerificationTokenByToken(token);
  if (!found) {
    const identifier = await findIdentifierByVerificationToken(token);
    const expiredUrl =
      identifier != null
        ? `${routes.dashboard.auth.verifyEmail.expired}?email=${encodeURIComponent(identifier)}`
        : routes.dashboard.auth.verifyEmail.expired;
    redirect(expiredUrl);
  }

  await verifyEmail(found.identifier);
  redirect(routes.dashboard.auth.verifyEmail.success);
}
