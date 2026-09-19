import type { Metadata } from 'next';
import { TotpCodeCard } from '@/components/auth/totp/totp-code-card';
import { createTitle } from '@/lib/formatters';

export const metadata: Metadata = {
  title: createTitle('Confirm via authenticator app')
};

type TotpPageProps = {
  searchParams: Promise<{ token?: string; expiry?: string }>;
};

function fromParam(value: string | string[] | undefined): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value[0]) return value[0];
  return '';
}

export default async function TotpPage({ searchParams }: TotpPageProps) {
  const resolved = await searchParams;
  const token = fromParam(resolved.token);
  const expiry = fromParam(resolved.expiry);

  return (
    <TotpCodeCard
      token={token}
      expiry={expiry}
    />
  );
}
