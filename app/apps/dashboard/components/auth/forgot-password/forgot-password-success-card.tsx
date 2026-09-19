import Link from 'next/link';
import { InformationCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { routes } from '@workspace/routes';
import {
  AlertDescription,
  AuthCardLayout,
  linkClass,
  type AuthCardLayoutProps
} from '@workspace/ui';

export type ForgotPasswordSuccessCardProps = Omit<
  AuthCardLayoutProps,
  'title' | 'description' | 'children' | 'footer'
> & {
  email?: string;
};

export function ForgotPasswordSuccessCard({
  className,
  ...other
}: ForgotPasswordSuccessCardProps) {
  return (
    <AuthCardLayout
      variant="centered"
      title="Instruções enviadas"
      description="Se o endereço estiver cadastrado, você receberá um email com o link e as instruções em breve."
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
      <div className="animate-auth-fade-in-delay-1 px-1 pb-6">
        <div
          role="alert"
          className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-muted-foreground"
        >
          <HugeiconsIcon
            icon={InformationCircleIcon}
            size={20}
            className="shrink-0 text-foreground"
          />
          <AlertDescription className="m-0 text-sm">
            Se não receber o email em breve, confira a pasta de spam ou entre em
            contato com o suporte.
          </AlertDescription>
        </div>
      </div>
    </AuthCardLayout>
  );
}
