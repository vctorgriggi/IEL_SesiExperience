'use client';

import { useResendVerification } from '@/hooks/use-resend-verification';

import {
  AuthCardLayout,
  Button,
  type AuthCardLayoutProps
} from '@workspace/ui';

export type VerifyEmailCardProps = Omit<
  AuthCardLayoutProps,
  'title' | 'description' | 'children' | 'footer'
> & {
  email: string;
};

export function VerifyEmailCard({
  email,
  className,
  ...other
}: VerifyEmailCardProps) {
  const { handleResend, isPending } = useResendVerification({ email });

  return (
    <AuthCardLayout
      variant="centered"
      title="Verifique seu email"
      description="Enviamos um email com um link de verificação. Clique no link para ativar sua conta."
      footer={
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm pt-1 text-muted-foreground">
            Não recebeu o email?
          </span>
          <Button
            type="button"
            disabled={isPending}
            loading={isPending}
            onClick={handleResend}
          >
            Reenviar
          </Button>
        </div>
      }
      className={className}
      {...other}
    >
      <div className="animate-auth-fade-in-delay-1 px-1 pb-6">
        <p className="text-center text-sm text-muted-foreground">
          Verifique sua caixa de entrada e o link no email.
        </p>
      </div>
    </AuthCardLayout>
  );
}
