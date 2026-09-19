'use client';

import { useZodForm } from '@/hooks/use-zod-form';
import { AlertCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Controller } from 'react-hook-form';

import { totpCodeSchema } from '@workspace/auth/schemas';
import { Alert, AlertDescription, Button, InputOTP } from '@workspace/ui';

export type MfaSetupStepProps = {
  qrDataUrl: string;
  error: string | null;
  onSubmit: (values: { totpCode: string }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
};

export function MfaSetupStep({
  qrDataUrl,
  error,
  onSubmit,
  onCancel,
  loading = false
}: MfaSetupStepProps) {
  const form = useZodForm({
    schema: totpCodeSchema,
    mode: 'onSubmit',
    defaultValues: { totpCode: '' }
  });
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = form;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-foreground">
          Escanear QR Code
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Use um app como Google Authenticator ou Authy para escanear o código.
        </p>
      </div>
      <div className="flex justify-center">
        <img
          src={qrDataUrl}
          alt="QR Code"
          className="rounded border"
        />
      </div>
      <form
        onSubmit={handleSubmit((values) => onSubmit(values))}
        className="space-y-4"
      >
        <Controller
          control={control}
          name="totpCode"
          render={({ field }) => (
            <div className="flex flex-col items-center space-y-2">
              <InputOTP
                value={field.value}
                onChange={field.onChange}
                length={6}
                integerOnly
              />
              {errors.totpCode?.message && (
                <p className="text-sm text-destructive">
                  {errors.totpCode.message}
                </p>
              )}
            </div>
          )}
        />
        {error && (
          <Alert variant="warning">
            <HugeiconsIcon
              icon={AlertCircleIcon}
              size={16}
            />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            loading={loading || isSubmitting}
          >
            Verificar e ativar
          </Button>
          <Button
            type="button"
            outlined
            severity="secondary"
            onClick={onCancel}
            disabled={loading || isSubmitting}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
