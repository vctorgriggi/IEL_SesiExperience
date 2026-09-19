import Link from 'next/link';

import { routes } from '@workspace/routes';
import { AuthCardLayout, linkClass } from '@workspace/ui';

import { AUTH_CARD_CLASS, AuthShell } from '~/components/auth/auth-shell';

export const metadata = { title: 'Link expirado' };

export default function ResetPasswordExpiredPage() {
  return (
    <AuthShell>
      <AuthCardLayout
        className={AUTH_CARD_CLASS}
        variant="centered"
        title="Link expirado"
        description="Esse link de redefinição não vale mais."
        footer={
          <p className="text-center text-sm text-muted-foreground">
            <Link
              href={routes.aiChat.forgotPassword.index}
              className={linkClass}
            >
              Pedir um novo link
            </Link>
          </p>
        }
      >
        <p className="text-sm text-muted-foreground">
          Por segurança, cada link vale por poucas horas e só pode ser usado uma
          vez.
        </p>
      </AuthCardLayout>
    </AuthShell>
  );
}
