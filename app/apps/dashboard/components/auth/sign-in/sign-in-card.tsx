'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signInWithCredentials } from '@/features/auth/actions/sign-in-with-credentials';
import { resolveAuthErrorMessage } from '@/features/auth/constants/auth-error-labels';
import { passThroughCredentialsSchema } from '@/features/auth/schemas/pass-through-credentials-schema';
import { useZodForm } from '@/hooks/use-zod-form';
import { LockIcon, Mail01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Controller } from 'react-hook-form';

import { AuthErrorCode } from '@workspace/auth/errors';
import { routes } from '@workspace/routes';
import {
  AuthCardLayout,
  Button,
  cn,
  Divider,
  Input,
  InputPassword,
  Label,
  linkClass
} from '@workspace/ui';

import { FormErrorAlert } from '../error/form-error-alert';
import { SocialSignInButtons } from './social-sign-in-buttons';

type SignInCardProps = {
  redirectTo?: string;
  initialErrorMessage?: string;
};

export function SignInCard({
  redirectTo = routes.dashboard.index,
  initialErrorMessage
}: SignInCardProps) {
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    initialErrorMessage
  );
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | undefined>();

  useEffect(() => {
    setErrorMessage(initialErrorMessage);
  }, [initialErrorMessage]);

  const form = useZodForm({
    schema: passThroughCredentialsSchema,
    mode: 'onSubmit',
    defaultValues: { email: '', password: '' }
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: { email: string; password: string }) {
    setErrorMessage(undefined);
    setUnverifiedEmail(undefined);

    const result = await signInWithCredentials(values);

    const code: string | undefined =
      result?.validationErrors?._errors?.[0] ??
      (result?.serverError ? AuthErrorCode.UnknownError : undefined);

    if (!code) return;

    setErrorMessage(resolveAuthErrorMessage(code));

    if (code === AuthErrorCode.UnverifiedEmail) {
      setUnverifiedEmail(values.email);
    }
  }

  function LinkFooter() {
    return (
      <>
        <p className="pr-2">Não tem uma conta? </p>
        <Link
          href={
            redirectTo
              ? `${routes.dashboard.auth.signUp}?callbackUrl=${encodeURIComponent(redirectTo)}`
              : routes.dashboard.auth.signUp
          }
          className={linkClass}
        >
          Criar conta
        </Link>
      </>
    );
  }

  return (
    <AuthCardLayout
      variant="centered"
      title="Bem vindo de volta"
      description="Faça login para continuar."
      footer={<LinkFooter />}
    >
      <div className="pb-2">
        <div className="animate-auth-fade-in-delay-1">
          <SocialSignInButtons
            redirectTo={redirectTo}
            intent="signin"
          />
        </div>

        <Divider className="animate-auth-fade-in-delay-1 my-4" />

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="animate-auth-fade-in-delay-2"
        >
          <div className="space-y-4">
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    {...field}
                    type="email"
                    autoCapitalize="off"
                    autoComplete="username"
                    autoFocus
                    disabled={isSubmitting}
                    leftIcon={
                      <HugeiconsIcon
                        icon={Mail01Icon}
                        size={20}
                      />
                    }
                  />
                  {fieldState.error?.message && (
                    <p className="text-sm text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Senha</Label>
                <Link
                  href={routes.dashboard.auth.forgotPassword.index}
                  className={cn('text-sm', linkClass)}
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <Controller
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <InputPassword
                      {...field}
                      maxLength={72}
                      autoCapitalize="off"
                      autoComplete="current-password"
                      disabled={isSubmitting}
                      leftIcon={
                        <HugeiconsIcon
                          icon={LockIcon}
                          size={20}
                        />
                      }
                    />
                    {fieldState.error?.message && (
                      <p className="text-sm text-destructive">
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>
          </div>

          {errorMessage && <FormErrorAlert message={errorMessage} />}

          {unverifiedEmail && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link
                href={`${routes.dashboard.auth.verifyEmail.index}?email=${encodeURIComponent(unverifiedEmail)}`}
                className={linkClass}
              >
                Verificar email
              </Link>
            </p>
          )}
          <div className="mt-5">
            <Button
              size="small"
              className="flex w-full items-center justify-center"
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Entrar
            </Button>
          </div>
        </form>
      </div>
    </AuthCardLayout>
  );
}
