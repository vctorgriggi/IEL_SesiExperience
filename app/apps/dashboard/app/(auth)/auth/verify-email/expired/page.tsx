import type { Metadata } from 'next';
import { VerifyEmailExpiredCard } from '@/components/auth/verify-email/verify-email-expired-card';
import type { AuthPageProps } from '@/features/auth/types';
import { createTitle } from '@/lib/formatters';
import { createSearchParamsCache, parseAsString } from 'nuqs/server';

const searchParamsCache = createSearchParamsCache({
  email: parseAsString.withDefault('')
});

export const metadata: Metadata = {
  title: createTitle('Verificacao de email expirada')
};

export default async function VerifyEmailExpiredPage({
  searchParams
}: AuthPageProps) {
  const { email } = await searchParamsCache.parse(searchParams);
  return <VerifyEmailExpiredCard email={email} />;
}
