import Link from 'next/link';

import { routes } from '@workspace/routes';
import {
  AuthCardLayout,
  linkClass,
  type AuthCardLayoutProps
} from '@workspace/ui';

export function VerifyEmailSuccessCard({
  className,
  ...other
}: Omit<AuthCardLayoutProps, 'title' | 'description' | 'children' | 'footer'>) {
  return (
    <AuthCardLayout
      variant="centered"
      title="Email verificado"
      description="Seu email foi verificado com sucesso. Você já pode entrar na sua conta."
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
    />
  );
}
