import { type Metadata } from 'next';
import { redirect } from 'next/navigation';
import { type AuthPageProps } from '@/features/auth/types';
import { createTitle } from '@/lib/formatters';
import { createSearchParamsCache, parseAsString } from 'nuqs/server';

import { routes } from '@workspace/routes';

const searchParamsCache = createSearchParamsCache({
  error: parseAsString.withDefault('')
});

export const metadata: Metadata = {
  title: createTitle('Erro de autenticacao')
};

export default async function AuthErrorPage({ searchParams }: AuthPageProps) {
  const { error } = await searchParamsCache.parse(searchParams);
  const destination = error
    ? `${routes.dashboard.auth.signIn}?error=${encodeURIComponent(error)}`
    : routes.dashboard.auth.signIn;
  redirect(destination);
}
