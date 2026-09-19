import Link from 'next/link';

import { routes } from '@workspace/routes';
import {
  AuthCardLayout,
  linkClass,
  type AuthCardLayoutProps
} from '@workspace/ui';

export function ResetPasswordExpiredCard({
  className,
  ...other
}: Omit<AuthCardLayoutProps, 'title' | 'description' | 'children' | 'footer'>) {
  return (
    <AuthCardLayout
      variant="centered"
      title="Link expirado"
      description="Volte e informe o email da sua conta para receber um novo link de redefinição de senha."
      footer={
        <Link
          href={routes.dashboard.auth.forgotPassword.index}
          className={linkClass}
        >
          Tentar novamente
        </Link>
      }
      className={className}
      {...other}
    />
  );
}
