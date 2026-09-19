import Link from 'next/link';

import { routes } from '@workspace/routes';
import {
  AuthCardLayout,
  linkClass,
  type AuthCardLayoutProps
} from '@workspace/ui';

export type ChangeEmailSuccessCardProps = Omit<
  AuthCardLayoutProps,
  'title' | 'description' | 'children' | 'footer'
> & {
  email: string;
};

export function ChangeEmailSuccessCard({
  email,
  className,
  ...other
}: ChangeEmailSuccessCardProps) {
  return (
    <AuthCardLayout
      variant="centered"
      title="Email alterado"
      description={
        <>
          Seu email foi alterado com sucesso para{' '}
          <strong className="text-foreground font-medium">{email}</strong>. Por
          segurança, você foi desconectado e precisa entrar novamente.
        </>
      }
      footer={
        <Link
          href={routes.dashboard.auth.signIn}
          className={linkClass}
        >
          Ir para login
        </Link>
      }
      className={className}
      {...other}
    />
  );
}
