import Link from 'next/link';

import { routes } from '@workspace/routes';
import { AuthCardLayout, linkClass } from '@workspace/ui';

import { AUTH_CARD_CLASS, AuthShell } from '~/components/auth/auth-shell';

export const metadata = { title: 'Email verificado' };

export default function VerifyEmailSuccessPage() {
  return (
    <AuthShell>
      <AuthCardLayout
        className={AUTH_CARD_CLASS}
        variant="centered"
        title="Email verificado"
        description="Sua conta está pronta."
        footer={
          <p className="text-center text-sm text-muted-foreground">
            <Link
              href={routes.aiChat.signIn}
              className={linkClass}
            >
              Entrar
            </Link>
          </p>
        }
      />
    </AuthShell>
  );
}
