'use client';

import { useState } from 'react';
import Link from 'next/link';

import { routes } from '@workspace/routes';
import {
  AuthCardLayout,
  Button,
  FormErrorAlert,
  Input,
  Label,
  linkClass
} from '@workspace/ui';

import { AUTH_CARD_CLASS } from '~/components/auth/auth-shell';
import { resendVerificationEmail } from '~/features/auth/actions/resend-verification-email';

type VerifyEmailCardProps = {
  email?: string;
  expired?: boolean;
};

export function VerifyEmailCard({ email, expired }: VerifyEmailCardProps) {
  const [address, setAddress] = useState(email ?? '');
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [sending, setSending] = useState(false);

  const resend = async () => {
    setSending(true);
    setErrorMessage(undefined);
    const result = await resendVerificationEmail({ email: address });
    setSending(false);

    if (result?.serverError || result?.validationErrors) {
      setErrorMessage(result.serverError ?? 'Informe um email válido.');
      return;
    }
    setSent(true);
  };

  return (
    <AuthCardLayout
      className={AUTH_CARD_CLASS}
      variant="centered"
      title={expired ? 'Link expirado' : 'Verifique seu email'}
      description={
        expired
          ? 'Esse link de verificação não vale mais. Enviamos outro se você pedir.'
          : 'Abra o link que enviamos para confirmar seu endereço.'
      }
      footer={
        <p className="text-center text-sm text-muted-foreground">
          <Link
            href={routes.aiChat.signIn}
            className={linkClass}
          >
            Voltar para o login
          </Link>
        </p>
      }
    >
      <div className="flex flex-col gap-4">
        {!email && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </div>
        )}

        {errorMessage && <FormErrorAlert message={errorMessage} />}

        {sent ? (
          <p className="text-sm text-muted-foreground">
            Email reenviado. Confira a caixa de entrada e o spam.
          </p>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={sending || !address}
            onClick={resend}
          >
            {sending ? 'Enviando…' : 'Reenviar email'}
          </Button>
        )}
      </div>
    </AuthCardLayout>
  );
}
