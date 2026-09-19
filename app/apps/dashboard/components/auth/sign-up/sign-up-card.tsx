'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FormErrorAlert } from '@/components/auth/error/form-error-alert';
import { PasswordFormMessage } from '@/components/auth/error/password-form-message';
import { signUp } from '@/features/auth/actions/sign-up';
import {
  signUpFormSchema,
  type SignUpFormSchema
} from '@/features/auth/schemas/sign-up-schema';
import { applyServerValidationErrors } from '@/features/auth/utils/form-utils';
import { useZodForm } from '@/hooks/use-zod-form';
import { firstValidationError } from '@/lib/get-error-message';
import { LockIcon, Mail01Icon, UserIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Controller } from 'react-hook-form';

import { routes } from '@workspace/routes';
import {
  AuthCardLayout,
  Button,
  Divider,
  Input,
  InputPassword,
  Label,
  linkClass
} from '@workspace/ui';

import { SocialSignInButtons } from '../sign-in/social-sign-in-buttons';

const DEFAULT_REDIRECT_TO = routes.dashboard.index;

const DEFAULT_ERROR_MESSAGE =
  'Ocorreu um erro ao criar a conta. Tente novamente.';

const SIGN_UP_FIELD_NAMES: (keyof SignUpFormSchema)[] = [
  'name',
  'email',
  'password',
  'confirmPassword'
];

type SignUpCardProps = {
  className?: string;
  redirectTo?: string;
  defaultEmail?: string;
  hasGitHub?: boolean;
};

export function SignUpCard({
  className,
  redirectTo = DEFAULT_REDIRECT_TO,
  defaultEmail,
  hasGitHub = false
}: SignUpCardProps) {
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const methods = useZodForm({
    schema: signUpFormSchema,
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      email: defaultEmail ?? '',
      password: '',
      confirmPassword: ''
    }
  });

  const isSubmitting = methods.formState.isSubmitting;
  const password = methods.watch('password');

  async function onSubmit(values: SignUpFormSchema) {
    setErrorMessage(undefined);
    const result = await signUp({
      name: values.name,
      email: values.email,
      password: values.password
    });

    if (result?.validationErrors) {
      applyServerValidationErrors(
        result.validationErrors,
        methods.setError,
        SIGN_UP_FIELD_NAMES
      );
      setErrorMessage(
        firstValidationError(result.validationErrors) ?? DEFAULT_ERROR_MESSAGE
      );
      return;
    }

    if (result?.serverError) {
      setErrorMessage(DEFAULT_ERROR_MESSAGE);
    }
  }

  return (
    <AuthCardLayout
      variant="centered"
      title="Criar conta"
      description="Escolha uma das opções abaixo"
      footer={
        <>
          <span className="pr-2">Já tem uma conta?</span>
          <Link
            href={
              redirectTo
                ? `${routes.dashboard.auth.signIn}?callbackUrl=${encodeURIComponent(redirectTo)}`
                : routes.dashboard.auth.signIn
            }
            className={linkClass}
          >
            Entrar
          </Link>
        </>
      }
      className={className}
    >
      <div className="pb-2">
        <div className="animate-auth-fade-in-delay-1">
          <SocialSignInButtons
            redirectTo={redirectTo}
            intent="signup"
            hasGitHub={hasGitHub}
            disabled={isSubmitting}
          />
        </div>

        <Divider className="animate-auth-fade-in-delay-1 my-6" />

        <form
          className="animate-auth-fade-in-delay-2 space-y-4"
          onSubmit={methods.handleSubmit(onSubmit)}
        >
          <Controller
            control={methods.control}
            name="name"
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  {...field}
                  type="text"
                  maxLength={64}
                  autoComplete="name"
                  disabled={isSubmitting}
                  leftIcon={
                    <HugeiconsIcon
                      icon={UserIcon}
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

          <Controller
            control={methods.control}
            name="email"
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  {...field}
                  type="email"
                  maxLength={255}
                  autoComplete="username"
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

          <Controller
            control={methods.control}
            name="password"
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label>Senha</Label>
                <InputPassword
                  {...field}
                  maxLength={72}
                  autoCapitalize="off"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  leftIcon={
                    <HugeiconsIcon
                      icon={LockIcon}
                      size={20}
                    />
                  }
                />
                {fieldState.isDirty && (
                  <PasswordFormMessage
                    password={password}
                    error={fieldState.error?.message}
                    formMessageId="password-message"
                  />
                )}
              </div>
            )}
          />

          <Controller
            control={methods.control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label>Confirmar senha</Label>
                <InputPassword
                  {...field}
                  maxLength={72}
                  autoCapitalize="off"
                  autoComplete="new-password"
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

          {errorMessage && <FormErrorAlert message={errorMessage} />}

          <Button
            type="submit"
            className="mt-1 w-full"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            Criar conta
          </Button>
        </form>
      </div>
    </AuthCardLayout>
  );
}
