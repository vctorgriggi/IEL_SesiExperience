import { redirect } from 'next/navigation';

import { dedupedAuth } from '@workspace/auth';

import { AuthShell } from '~/components/auth/auth-shell';
import { SignInForm } from './sign-in-form';

export const metadata = { title: 'Entrar' };

type Props = { searchParams: Promise<{ callbackUrl?: string }> };

export default async function SignInPage({ searchParams }: Props) {
  const session = await dedupedAuth();
  if (session?.user?.id) redirect('/chat');

  const { callbackUrl } = await searchParams;
  const target = callbackUrl?.startsWith('/') ? callbackUrl : '/chat';

  return (
    <AuthShell>
      <SignInForm callbackUrl={target} />
    </AuthShell>
  );
}
