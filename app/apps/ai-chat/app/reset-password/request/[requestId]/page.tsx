import { redirect } from 'next/navigation';

import { routes } from '@workspace/routes';

import { AuthShell } from '~/components/auth/auth-shell';
import { ResetPasswordCard } from '~/components/auth/reset-password-card';

export const metadata = { title: 'Nova senha' };

type Props = { params: Promise<{ requestId: string }> };

export default async function ResetPasswordRequestPage({ params }: Props) {
  const { requestId } = await params;
  if (!requestId) redirect(routes.aiChat.resetPassword.expired);

  return (
    <AuthShell>
      <ResetPasswordCard requestId={requestId} />
    </AuthShell>
  );
}
