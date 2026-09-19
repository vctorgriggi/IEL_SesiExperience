import { AuthShell } from '~/components/auth/auth-shell';
import { VerifyEmailCard } from '~/components/auth/verify-email-card';

export const metadata = { title: 'Verifique seu email' };

type Props = { searchParams: Promise<{ email?: string }> };

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { email } = await searchParams;

  return (
    <AuthShell>
      <VerifyEmailCard email={email} />
    </AuthShell>
  );
}
