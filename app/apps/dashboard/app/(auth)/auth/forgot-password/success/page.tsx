import { type Metadata } from 'next';
import { ForgotPasswordSuccessCard } from '@/components/auth/forgot-password/forgot-password-success-card';
import { type AuthPageProps } from '@/features/auth/types';
import { createTitle } from '@/lib/formatters';
import { createSearchParamsCache, parseAsString } from 'nuqs/server';

const searchParamsCache = createSearchParamsCache({
  email: parseAsString.withDefault('')
});

export const metadata: Metadata = {
  title: createTitle('Reset link sent')
};

export default async function ForgotPasswordSuccessPage({
  searchParams
}: AuthPageProps) {
  const { email } = await searchParamsCache.parse(searchParams);
  return <ForgotPasswordSuccessCard email={email} />;
}
