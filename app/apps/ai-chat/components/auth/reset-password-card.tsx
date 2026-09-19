'use client';

import { useState } from 'react';

import { resetPasswordSchema } from '@workspace/auth/auth-schemas';
import {
  AuthCardLayout,
  Button,
  FormErrorAlert,
  InputPassword,
  Label,
  PasswordFormMessage
} from '@workspace/ui';

import { AUTH_CARD_CLASS } from '~/components/auth/auth-shell';
import { resetPassword } from '~/features/auth/actions/reset-password';
import { useZodForm } from '~/hooks/use-zod-form';

export function ResetPasswordCard({ requestId }: { requestId: string }) {
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const form = useZodForm({
    schema: resetPasswordSchema,
    mode: 'onSubmit',
    defaultValues: { requestId, password: '', confirmPassword: '' }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(undefined);
    const result = await resetPassword(values);
    if (result?.serverError) setErrorMessage(result.serverError);
  });

  const password = form.watch('password');

  return (
    <AuthCardLayout
      className={AUTH_CARD_CLASS}
      variant="centered"
      title="Criar nova senha"
      description="Escolha uma senha que você ainda não usou aqui."
    >
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Nova senha</Label>
          <InputPassword
            id="password"
            maxLength={72}
            autoComplete="new-password"
            autoFocus
            {...form.register('password')}
          />
          <PasswordFormMessage
            password={password}
            error={form.formState.errors.password?.message}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword">Repita a senha</Label>
          <InputPassword
            id="confirmPassword"
            maxLength={72}
            autoComplete="new-password"
            {...form.register('confirmPassword')}
          />
          {form.formState.errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {form.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>

        {errorMessage && <FormErrorAlert message={errorMessage} />}

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Salvando…' : 'Salvar senha'}
        </Button>
      </form>
    </AuthCardLayout>
  );
}
