'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { sendResetPasswordInstructionsSchema } from '@workspace/auth/auth-schemas';
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
import { sendResetPasswordInstructions } from '~/features/auth/actions/send-reset-password-instructions';
import { useZodForm } from '~/hooks/use-zod-form';

export function ForgotPasswordCard() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const form = useZodForm({
    schema: sendResetPasswordInstructionsSchema,
    mode: 'onSubmit',
    defaultValues: { email: '' }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(undefined);
    const result = await sendResetPasswordInstructions(values);

    if (result?.serverError) {
      setErrorMessage(result.serverError);
      return;
    }

    router.replace(
      `${routes.aiChat.forgotPassword.success}?email=${encodeURIComponent(values.email)}`
    );
  });

  return (
    <AuthCardLayout
      className={AUTH_CARD_CLASS}
      variant="centered"
      title="Esqueceu a senha?"
      description="Enviamos um link para você criar uma nova."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Lembrou?{' '}
          <Link
            href={routes.aiChat.signIn}
            className={linkClass}
          >
            Entrar
          </Link>
        </p>
      }
    >
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            autoFocus
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        {errorMessage && <FormErrorAlert message={errorMessage} />}

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Enviando…' : 'Enviar link'}
        </Button>
      </form>
    </AuthCardLayout>
  );
}
