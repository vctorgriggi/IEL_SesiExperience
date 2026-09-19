import { redirect } from 'next/navigation';

import { dedupedAuth } from '@workspace/auth';
import { routes } from '@workspace/routes';

import { AuthShell } from '~/components/auth/auth-shell';
import { SignUpCard } from '~/components/auth/sign-up-card';

export const metadata = { title: 'Criar conta' };

export default async function SignUpPage() {
  const session = await dedupedAuth();
  if (session?.user?.id) redirect(routes.aiChat.index);

  return (
    <AuthShell>
      <SignUpCard />
    </AuthShell>
  );
}
