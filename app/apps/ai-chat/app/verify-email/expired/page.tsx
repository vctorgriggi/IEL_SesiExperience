import { AuthShell } from '~/components/auth/auth-shell';
import { VerifyEmailCard } from '~/components/auth/verify-email-card';

export const metadata = { title: 'Link expirado' };

type Props = { searchParams: Promise<{ email?: string }> };

export default async function VerifyEmailExpiredPage({ searchParams }: Props) {
  const { email } = await searchParams;

  return (
    <AuthShell>
      <VerifyEmailCard
        email={email}
        expired
      />
    </AuthShell>
  );
}
