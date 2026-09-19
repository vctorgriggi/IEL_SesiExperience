import Link from 'next/link';

import { routes } from '@workspace/routes';
import {
  AuthCardLayout,
  linkClass,
  type AuthCardLayoutProps
} from '@workspace/ui';

export function ResetPasswordSuccessCard({
  className,
  ...other
}: Omit<AuthCardLayoutProps, 'title' | 'description' | 'children' | 'footer'>) {
  return (
    <AuthCardLayout
      variant="centered"
      title="Senha atualizada"
      description="Sua senha foi alterada com sucesso. Use a nova senha para entrar."
      footer={
        <Link
          href={routes.dashboard.auth.signIn}
          className={linkClass}
        >
          Voltar ao login
        </Link>
      }
      className={className}
      {...other}
    >
      {null}
    </AuthCardLayout>
  );
}
