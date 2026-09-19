import { type Metadata } from 'next';
import { VerifyEmailCard } from '@/components/auth/verify-email/verify-email-card';
import { type AuthPageProps } from '@/features/auth/types';
import { createTitle } from '@/lib/formatters';
import { createSearchParamsCache, parseAsString } from 'nuqs/server';

const searchParamsCache = createSearchParamsCache({
  email: parseAsString.withDefault('')
});

export const metadata: Metadata = {
  title: createTitle('Verificar email')
};

export default async function VerifyEmailPage({ searchParams }: AuthPageProps) {
  const { email } = await searchParamsCache.parse(searchParams);
  return <VerifyEmailCard email={email} />;
}
