'use client';

import Link from 'next/link';
import { useForgotPasswordForm } from '@/hooks/use-forgot-password-form';
import { Mail01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Controller, FormProvider } from 'react-hook-form';

import { routes } from '@workspace/routes';
import {
  AuthCardLayout,
  Button,
  Input,
  Label,
  linkClass,
  type AuthCardLayoutProps
} from '@workspace/ui';

const styles = {
  content: 'pb-2'
} as const;

type ForgotPasswordCardProps = Omit<
  AuthCardLayoutProps,
  'title' | 'description' | 'children' | 'footer'
>;

export function ForgotPasswordCard({
  className,
  ...other
}: ForgotPasswordCardProps) {
  const { methods, canSubmit, isSubmitting, handleSubmit } =
    useForgotPasswordForm();

  return (
    <AuthCardLayout
      variant="centered"
      title="Esqueceu sua senha?"
      description="Enviaremos um link com instruções para redefinir sua senha."
      footer={
        <>
          <span>Lembrou a senha?</span>
          <Link
            href={routes.dashboard.auth.signIn}
            className={linkClass}
          >
            Entrar
          </Link>
        </>
      }
      className={className}
      {...other}
    >
      <div className={styles.content}>
        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit}
            className="animate-auth-fade-in-delay-1 flex flex-col gap-5"
          >
            <Controller
              control={methods.control}
              name="email"
              render={({ field, fieldState }) => (
                <div className="flex flex-col space-y-2">
                  <Label>Email</Label>
                  <Input
                    {...field}
                    type="email"
                    maxLength={255}
                    autoCapitalize="off"
                    autoComplete="username"
                    leftIcon={
                      <HugeiconsIcon
                        icon={Mail01Icon}
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
            <Button
              type="submit"
              size="small"
              className="flex w-full items-center justify-center"
              disabled={!canSubmit}
              loading={isSubmitting}
            >
              Enviar instruções
            </Button>
          </form>
        </FormProvider>
      </div>
    </AuthCardLayout>
  );
}
