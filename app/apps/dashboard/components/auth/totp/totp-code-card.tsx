'use client';

import Link from 'next/link';
import { ArrowLeft01Icon, LockIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { routes } from '@workspace/routes';
import {
  AuthCardLayout,
  linkClass,
  type AuthCardLayoutProps
} from '@workspace/ui';

import { TotpCodeForm } from './totp-code-form';

export type TotpCodeCardProps = Omit<
  AuthCardLayoutProps,
  'title' | 'description' | 'children' | 'footer'
> & {
  token: string;
  expiry: string;
};

export function TotpCodeCard({
  token,
  expiry,
  className,
  ...other
}: TotpCodeCardProps) {
  return (
    <AuthCardLayout
      variant="centered"
      title="Código do autenticador"
      description="Digite o código de 6 dígitos do seu app autenticador."
      footer={
        <>
          <Link
            href={routes.dashboard.auth.signIn}
            className={linkClass}
          >
            <span className="inline-flex items-center gap-1">
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={14}
                className="shrink-0"
              />
              Voltar
            </span>
          </Link>
          <Link
            href={`${routes.dashboard.auth.recoveryCode}?token=${encodeURIComponent(token)}&expiry=${encodeURIComponent(expiry)}`}
            className={linkClass}
          >
            <span className="inline-flex items-center gap-1">
              <HugeiconsIcon
                icon={LockIcon}
                size={14}
                className="shrink-0"
              />
              Perdi o acesso
            </span>
          </Link>
        </>
      }
      className={className}
      {...other}
    >
      <div className="px-1 pb-6">
        <TotpCodeForm
          token={token}
          expiry={expiry}
        />
      </div>
    </AuthCardLayout>
  );
}
