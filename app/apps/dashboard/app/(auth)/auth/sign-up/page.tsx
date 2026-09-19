import { type Metadata } from 'next';
import Link from 'next/link';
import { SignUpCard } from '@/components/auth/sign-up/sign-up-card';
import { createTitle } from '@/lib/formatters';

import { toSameOriginRedirect } from '@workspace/auth/redirect-url';
import { routes } from '@workspace/routes';

export const metadata: Metadata = {
  title: createTitle('Criar conta')
};

type Props = {
  searchParams: Promise<{ callbackUrl?: string; email?: string }>;
};

export default async function SignUpPage({ searchParams }: Props) {
  const { callbackUrl, email } = await searchParams;
  const sanitized = toSameOriginRedirect(callbackUrl, { fallback: '' });
  const redirectTo = sanitized || undefined;
  const defaultEmail =
    typeof email === 'string' && email.trim().length > 0
      ? email.trim()
      : undefined;

  return (
    <>
      <SignUpCard
        redirectTo={redirectTo}
        defaultEmail={defaultEmail}
      />
      <div className="animate-auth-fade-in-delay-3 px-2 text-center text-xs text-muted-foreground">
        Ao criar conta, você concorda com nossos{' '}
        <Link
          prefetch={false}
          href={routes.marketing.termsOfUse}
          className="font-medium text-primary underline underline-offset-2 transition-colors hover:text-primary/90"
        >
          Termos de Uso
        </Link>{' '}
        e{' '}
        <Link
          prefetch={false}
          href={routes.marketing.privacyPolicy}
          className="font-medium text-primary underline underline-offset-2 transition-colors hover:text-primary/90"
        >
          Política de Privacidade
        </Link>
        .
      </div>
    </>
  );
}
