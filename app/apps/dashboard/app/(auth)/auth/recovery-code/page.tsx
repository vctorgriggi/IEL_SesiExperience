import type { Metadata } from 'next';
import { RecoveryCodeCard } from '@/components/auth/recovery-code/recovery-code-card';
import { createTitle } from '@/lib/formatters';

export const metadata: Metadata = {
  title: createTitle('Recovery code')
};

type RecoveryCodePageProps = {
  searchParams: Promise<{ token?: string; expiry?: string }>;
};

export default async function RecoveryCodePage({
  searchParams
}: RecoveryCodePageProps) {
  const { token = '', expiry = '' } = await searchParams;

  return (
    <RecoveryCodeCard
      token={token}
      expiry={expiry}
    />
  );
}
