'use client';

import { PasswordFormMessage } from '@/components/auth/error/password-form-message';
import { useResetPasswordForm } from '@/hooks/use-reset-password-form';
import { AlertCircleIcon, LockIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Controller, FormProvider } from 'react-hook-form';

import {
  AuthCardLayout,
  Button,
  InputPassword,
  Label,
  type AuthCardLayoutProps
} from '@workspace/ui';

export type ResetPasswordCardProps = Omit<
  AuthCardLayoutProps,
  'title' | 'description' | 'children' | 'footer'
> & {
  requestId: string;
  expires: Date;
};

export function ResetPasswordCard({
  requestId,
  expires: _expires,
  className,
  ...other
}: ResetPasswordCardProps) {
  const {
    methods,
    password,
    canSubmit,
    isSubmitting,
    errorMessage,
    handleSubmit
  } = useResetPasswordForm({ requestId });

  return (
    <FormProvider {...methods}>
      <AuthCardLayout
        variant="centered"
        title="Redefinir senha"
        description={
          <span suppressHydrationWarning>
            Use o formulário abaixo para alterar sua senha.
          </span>
        }
        className={className}
        {...other}
      >
        <div className="pb-2">
          <form
            onSubmit={handleSubmit}
            className="animate-auth-fade-in-delay-1 flex flex-col gap-5"
          >
            <input
              type="hidden"
              className="hidden"
              disabled={isSubmitting}
              {...methods.register('requestId')}
            />
            <Controller
              control={methods.control}
              name="password"
              render={({ field }) => (
                <div className="flex flex-col space-y-2">
                  <Label>Senha</Label>
                  <InputPassword
                    {...field}
                    maxLength={72}
                    autoCapitalize="off"
                    autoComplete="new-password"
                    leftIcon={
                      <HugeiconsIcon
                        icon={LockIcon}
                        size={20}
                      />
                    }
                    disabled={isSubmitting}
                  />
                  <PasswordFormMessage
                    password={password}
                    error={methods.formState.errors.password?.message}
                    formMessageId="password-message"
                  />
                </div>
              )}
            />
            <Controller
              control={methods.control}
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <div className="flex flex-col space-y-2">
                  <Label>Confirmar senha</Label>
                  <InputPassword
                    {...field}
                    maxLength={72}
                    autoCapitalize="off"
                    autoComplete="new-password"
                    leftIcon={
                      <HugeiconsIcon
                        icon={LockIcon}
                        size={20}
                      />
                    }
                    disabled={isSubmitting}
                  />
                  {fieldState.error?.message && (
                    <p className="text-sm text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />
            {errorMessage && (
              <div
                role="alert"
                className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground"
              >
                <HugeiconsIcon
                  icon={AlertCircleIcon}
                  size={18}
                  className="shrink-0"
                />
                <span>{errorMessage}</span>
              </div>
            )}
            <Button
              type="submit"
              size="small"
              className="flex w-full items-center justify-center"
              disabled={!canSubmit}
              loading={isSubmitting}
            >
              Alterar senha
            </Button>
          </form>
        </div>
      </AuthCardLayout>
    </FormProvider>
  );
}
