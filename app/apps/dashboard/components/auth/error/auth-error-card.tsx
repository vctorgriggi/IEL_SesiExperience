import Link from 'next/link';
import { AlertCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { routes } from '@workspace/routes';
import {
  Alert,
  AlertDescription,
  AuthCardLayout,
  type AuthCardLayoutProps
} from '@workspace/ui';

export type AuthErrorCardProps = Omit<
  AuthCardLayoutProps,
  'title' | 'description' | 'children' | 'footer'
> & {
  errorMessage: string;
};

export function AuthErrorCard({
  errorMessage,
  ...layoutProps
}: AuthErrorCardProps) {
  return (
    <AuthCardLayout
      title="Erro de autenticação"
      description="Ocorreu um erro ao fazer login. Volte à tela de entrada e tente novamente."
      footer={
        <Link
          href={routes.dashboard.auth.signIn}
          className="text-muted-foreground underline"
        >
          Voltar ao login
        </Link>
      }
      {...layoutProps}
    >
      <Alert variant="destructive">
        <HugeiconsIcon
          icon={AlertCircleIcon}
          size={18}
          className="shrink-0"
        />
        <AlertDescription className="inline">{errorMessage}</AlertDescription>
      </Alert>
    </AuthCardLayout>
  );
}
