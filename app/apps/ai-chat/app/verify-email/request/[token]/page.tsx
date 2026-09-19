import { redirect } from 'next/navigation';

import {
  findIdentifierByVerificationToken,
  findVerificationTokenByToken,
  verifyEmail
} from '@workspace/auth/verification';
import { routes } from '@workspace/routes';

type Props = { params: Promise<{ token: string }> };

export default async function VerifyEmailRequestPage({ params }: Props) {
  const { token } = await params;
  const verificationToken = await findVerificationTokenByToken(token);

  if (verificationToken) {
    await verifyEmail(verificationToken.identifier);
    redirect(routes.aiChat.verifyEmail.success);
  }

  const identifier = await findIdentifierByVerificationToken(token);
  redirect(
    identifier
      ? `${routes.aiChat.verifyEmail.expired}?email=${encodeURIComponent(identifier)}`
      : routes.aiChat.verifyEmail.expired
  );
}
