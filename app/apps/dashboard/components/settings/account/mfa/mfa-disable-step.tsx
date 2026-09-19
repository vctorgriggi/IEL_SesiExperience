'use client';

import { useZodForm } from '@/hooks/use-zod-form';
import {
  AlertCircleIcon,
  Cancel01Icon,
  Shield01Icon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Controller } from 'react-hook-form';

import { totpCodeSchema } from '@workspace/auth/schemas';
import { Alert, AlertDescription, Button, InputOTP } from '@workspace/ui';

export type MfaDisableStepProps = {
  error: string | null;
  onSubmit: (values: { totpCode: string }) => Promise<void>;
  loading?: boolean;
};

export function MfaDisableStep({
  error,
  onSubmit,
  loading = false
}: MfaDisableStepProps) {
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
      <div className="flex items-center gap-2">
        <HugeiconsIcon
          icon={Shield01Icon}
          size={20}
          className="text-green-600"
        />
        <h3 className="text-sm font-medium text-foreground">2FA ativado</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Seu autenticador está configurado.
      </p>
      <form
        onSubmit={handleSubmit((values) => onSubmit(values))}
        className="space-y-4"
      >
        <Controller
          control={control}
          name="totpCode"
          render={({ field }) => (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-2">
                Digite o código
              </p>
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
          <Alert
            variant="warning"
            className="flex gap-2"
          >
            <HugeiconsIcon
              icon={AlertCircleIcon}
              size={16}
            />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button
          type="submit"
          outlined
          severity="secondary"
          className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
          disabled={isSubmitting}
          loading={loading || isSubmitting}
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            size={16}
            className="mr-2"
          />
          Desativar 2FA
        </Button>
      </form>
    </div>
  );
}
