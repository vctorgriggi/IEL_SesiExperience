'use client';

import { useState } from 'react';
import { resendVerificationEmail } from '@/features/auth/actions/resend-verification-email';

import {
  AuthCardLayout,
  Button,
  Input,
  Label,
  toast,
  type AuthCardLayoutProps
} from '@workspace/ui';

export type VerifyEmailExpiredCardProps = Omit<
  AuthCardLayoutProps,
  'title' | 'description' | 'children' | 'footer'
> & {
  email: string;
};

export function VerifyEmailExpiredCard({
  email: emailFromUrl,
  className,
  ...other
}: VerifyEmailExpiredCardProps) {
  const [emailInput, setEmailInput] = useState('');
  const [isPending, setIsPending] = useState(false);

  const email = emailFromUrl.trim() || emailInput.trim();

  const handleResendEmailVerification = async (): Promise<void> => {
    if (!email) return;
    setIsPending(true);

    try {
      const result = await resendVerificationEmail({ email });
      if (result?.validationErrors || result?.serverError) {
        toast.error('Não foi possível reenviar a verificação');
        return;
      }

      toast.success('Email de verificação reenviado');
    } catch {
      toast.error('Não foi possível reenviar a verificação');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AuthCardLayout
      variant="centered"
      title="Verificação de email expirada"
      description="O link de verificação expirou. Solicite um novo para verificar seu email."
      footer={
        <div className="flex w-full flex-col items-center gap-2">
          {!emailFromUrl.trim() && (
            <div className="w-full space-y-2">
              <Label htmlFor="expired-resend-email">Seu email</Label>
              <Input
                id="expired-resend-email"
                type="email"
                placeholder="email@exemplo.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                autoComplete="email"
              />
            </div>
          )}
          <span className="text-sm pt-1 text-muted-foreground">
            {emailFromUrl.trim()
              ? 'Não recebeu o email?'
              : 'Informe seu email para reenviar o link.'}
          </span>
          <Button
            type="button"
            disabled={isPending || !email}
            loading={isPending}
            onClick={handleResendEmailVerification}
          >
            Reenviar
          </Button>
        </div>
      }
      className={className}
      {...other}
    >
      <div className="animate-auth-fade-in-delay-1 text-center text-sm text-muted-foreground">
        Reenviamos o link para o mesmo email informado no cadastro.
      </div>
    </AuthCardLayout>
  );
}
