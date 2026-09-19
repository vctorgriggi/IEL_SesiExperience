'use client';

import { useState } from 'react';
import { submitTotpCode } from '@/features/auth/actions/submit-totp-code';
import { authErrorLabels } from '@/features/auth/constants/auth-error-labels';
import {
  submitTotpCodeSchema,
  type SubmitTotpCodeSchema
} from '@/features/auth/schemas/submit-totp-code-schema';
import { useZodForm } from '@/hooks/use-zod-form';
import { Controller } from 'react-hook-form';

import { AuthErrorCode } from '@workspace/auth/errors';
import { Button, InputOTP } from '@workspace/ui';

import { TotpErrorAlert } from './totp-error-alert';

export type TotpCodeFormProps = {
  token: string;
  expiry: string;
};

export function TotpCodeForm({ token, expiry }: TotpCodeFormProps) {
  const [errorCode, setErrorCode] = useState<AuthErrorCode | undefined>();

  const form = useZodForm({
    schema: submitTotpCodeSchema,
    mode: 'onSubmit',
    defaultValues: { token, expiry, totpCode: '' }
  });
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = form;

  async function onSubmit(values: SubmitTotpCodeSchema) {
    setErrorCode(undefined);
    try {
      const result = await submitTotpCode(values);
      const code = result?.validationErrors?._errors?.[0];
      if (code) {
        setErrorCode(
          code in authErrorLabels
            ? (code as AuthErrorCode)
            : AuthErrorCode.UnknownError
        );
        return;
      }
      if (result?.serverError) {
        setErrorCode(AuthErrorCode.UnknownError);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorCode(
        message in authErrorLabels
          ? (message as AuthErrorCode)
          : AuthErrorCode.UnknownError
      );
    }
  }

  return (
    <form
      className="animate-auth-fade-in-delay-1 flex flex-col gap-5"
      onSubmit={handleSubmit(onSubmit)}
    >
      <input
        type="hidden"
        aria-hidden
        {...register('token')}
      />
      <input
        type="hidden"
        aria-hidden
        {...register('expiry')}
      />
      <Controller
        control={control}
        name="totpCode"
        render={({ field }) => (
          <div className="flex w-full flex-col items-center space-y-2">
            <InputOTP
              value={field.value}
              onChange={field.onChange}
              length={6}
              integerOnly
              autoFocus
            />
            {errors.totpCode?.message && (
              <p className="text-sm text-destructive">
                {errors.totpCode.message}
              </p>
            )}
          </div>
        )}
      />
      {errorCode && <TotpErrorAlert errorCode={errorCode} />}
      <Button
        type="submit"
        size="small"
        className="flex w-full justify-center items-center"
        disabled={isSubmitting}
        loading={isSubmitting}
      >
        Enviar
      </Button>
    </form>
  );
}
