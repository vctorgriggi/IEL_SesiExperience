import { type Metadata } from 'next';
import { SignInCard } from '@/components/auth/sign-in/sign-in-card';
import { resolveAuthErrorMessage } from '@/features/auth/constants/auth-error-labels';
import { createTitle } from '@/lib/formatters';

import { toSameOriginRedirect } from '@workspace/auth/redirect-url';

export const metadata: Metadata = {
  title: createTitle('Entrar')
};

type Props = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function SignInPage({ searchParams }: Props) {
  const { callbackUrl, error } = await searchParams;
  // Aceita caminho do dashboard ou URL de outro app do produto (o chat com
  // IA manda o usuário pra cá quando ele chega deslogado). Destino externo
  // vira `/auth/continue?to=…`, já que o next-auth só redireciona same-origin.
  const redirectTo = callbackUrl
    ? toSameOriginRedirect(callbackUrl, { fallback: '' }) || undefined
    : undefined;
  const initialErrorMessage =
    typeof error === 'string' && error.trim().length > 0
      ? resolveAuthErrorMessage(error.trim())
      : undefined;

  return (
    <SignInCard
      redirectTo={redirectTo}
      initialErrorMessage={initialErrorMessage}
    />
  );
}
