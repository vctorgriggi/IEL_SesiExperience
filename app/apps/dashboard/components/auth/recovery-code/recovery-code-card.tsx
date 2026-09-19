'use client';

import Link from 'next/link';
import { useRecoveryCodeForm } from '@/hooks/use-recovery-code-form';
import {
  AlertCircleIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Controller, FormProvider } from 'react-hook-form';

import { AuthErrorCode } from '@workspace/auth/errors';
import { routes } from '@workspace/routes';
import {
  Alert,
  AlertDescription,
  AuthCardLayout,
  Button,
  Input,
  linkClass,
  type AuthCardLayoutProps
} from '@workspace/ui';

export type RecoveryCodeCardProps = Omit<
  AuthCardLayoutProps,
  'title' | 'description' | 'children' | 'footer'
> & {
  token: string;
  expiry: string;
};

export function RecoveryCodeCard({
  token,
  expiry,
  className,
  ...other
}: RecoveryCodeCardProps) {
  const {
    methods,
    canSubmit,
    isSubmitting,
    errorCode,
    errorMessage,
    handleSubmit
  } = useRecoveryCodeForm({ token, expiry });

  return (
    <AuthCardLayout
      variant="centered"
      title="Código de recuperação"
      description="Cada código de recuperação pode ser usado uma vez para acessar sem o autenticador."
      footer={
        <Link
          href={`${routes.dashboard.auth.totp}?token=${encodeURIComponent(token)}&expiry=${encodeURIComponent(expiry)}`}
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
      }
      className={className}
      {...other}
    >
      <div className="px-1 pb-6">
        <FormProvider {...methods}>
          <form
            className="animate-auth-fade-in-delay-1 flex flex-col gap-5"
            onSubmit={handleSubmit}
          >
            <input
              type="hidden"
              className="hidden"
              disabled={isSubmitting}
              {...methods.register('token')}
            />
            <Controller
              control={methods.control}
              name="recoveryCode"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Input
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    disabled={isSubmitting}
                    placeholder="XXXXX-XXXXX"
                    maxLength={11}
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
              <Alert variant="destructive">
                <HugeiconsIcon
                  icon={AlertCircleIcon}
                  size={18}
                  className="shrink-0"
                />
                <AlertDescription className="inline">
                  {errorMessage}
                  {errorCode === AuthErrorCode.RequestExpired && (
                    <Link
                      href={routes.dashboard.auth.signIn}
                      className="ml-1 inline-flex items-center gap-1 font-medium text-primary underline underline-offset-2 hover:text-primary/90"
                    >
                      Entrar novamente
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={12}
                        className="shrink-0"
                      />
                    </Link>
                  )}
                </AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full flex justify-center items-center"
              disabled={!canSubmit}
              loading={isSubmitting}
            >
              Enviar
            </Button>
          </form>
        </FormProvider>
      </div>
    </AuthCardLayout>
  );
}
