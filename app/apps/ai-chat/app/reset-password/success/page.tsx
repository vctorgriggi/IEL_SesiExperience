import Link from 'next/link';

import { routes } from '@workspace/routes';
import { AuthCardLayout, linkClass } from '@workspace/ui';

import { AUTH_CARD_CLASS, AuthShell } from '~/components/auth/auth-shell';

export const metadata = { title: 'Senha alterada' };

export default function ResetPasswordSuccessPage() {
  return (
    <AuthShell>
      <AuthCardLayout
        className={AUTH_CARD_CLASS}
        variant="centered"
        title="Senha alterada"
        description="Já dá para entrar com a senha nova."
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
