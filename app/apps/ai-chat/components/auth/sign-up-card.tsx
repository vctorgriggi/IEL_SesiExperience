'use client';

import { useState } from 'react';
import Link from 'next/link';

import { signUpFormSchema } from '@workspace/auth/auth-schemas';
import { routes } from '@workspace/routes';
import {
  AuthCardLayout,
  Button,
  FormErrorAlert,
  Input,
  InputPassword,
  Label,
  linkClass,
  PasswordFormMessage
} from '@workspace/ui';

import { AUTH_CARD_CLASS } from '~/components/auth/auth-shell';
import { signUp } from '~/features/auth/actions/sign-up';
import { useZodForm } from '~/hooks/use-zod-form';

export function SignUpCard() {
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const form = useZodForm({
    schema: signUpFormSchema,
    mode: 'onSubmit',
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(undefined);
    const result = await signUp(values);

    if (result?.validationErrors?.email?._errors?.[0]) {
      form.setError('email', {
        message: result.validationErrors.email._errors[0]
      });
      return;
    }
    if (result?.serverError) setErrorMessage(result.serverError);
  });

  const password = form.watch('password');

  return (
    <AuthCardLayout
      className={AUTH_CARD_CLASS}
      variant="centered"
      title="Criar conta"
      description="Leva menos de um minuto."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{' '}
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
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            autoComplete="name"
            autoFocus
            {...form.register('name')}
          />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Senha</Label>
          <InputPassword
            id="password"
            maxLength={72}
            autoComplete="new-password"
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
          {form.formState.isSubmitting ? 'Criando…' : 'Criar conta'}
        </Button>
      </form>
    </AuthCardLayout>
  );
}
