'use client';

import { useRouter } from 'next/navigation';
import { changePassword } from '@/features/account/actions';
import {
  changePasswordSchema,
  type ChangePasswordFormData
} from '@/features/account/schemas/change-password-schema';
import { useZodForm } from '@/hooks/use-zod-form';
import { firstValidationError, getErrorMessage } from '@/lib/get-error-message';
import { LockIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useAction } from 'next-safe-action/hooks';

import { Button, InputPassword, Label, toast } from '@workspace/ui';

import { MfaSection } from '../mfa/mfa-section';

const CHANGE_PASSWORD_FALLBACK = 'Erro ao alterar senha';

type SecurityFormProps = {
  userId?: string;
  initialHasTotp?: boolean;
};

export function SecurityForm({
  userId,
  initialHasTotp = false
}: SecurityFormProps = {}) {
  const router = useRouter();
  const form = useZodForm({
    schema: changePasswordSchema,
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const { execute, isExecuting, result } = useAction(changePassword, {
    onSuccess: () => {
      toast.success('Senha alterada com sucesso');
      form.reset();
      router.refresh();
    },
    onError: ({ error }) => {
      const message =
        error.serverError ?? firstValidationError(error.validationErrors);
      toast.error(getErrorMessage(message, CHANGE_PASSWORD_FALLBACK));
    }
  });

  const serverError =
    result?.serverError ?? firstValidationError(result?.validationErrors);
  const errorMessage = serverError
    ? getErrorMessage(serverError, CHANGE_PASSWORD_FALLBACK)
    : undefined;

  const onSubmit = (data: ChangePasswordFormData) => {
    execute({
      currentPassword: data.currentPassword || undefined,
      newPassword: data.newPassword
    });
  };

  return (
    <div className="space-y-4">
      {/* Alterar senha */}
      <section>
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div>
            <h2 className="text-md font-medium text-foreground">
              Alterar senha
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Use uma senha forte com pelo menos 8 caracteres.
            </p>
          </div>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-3 w-full"
          >
            <div className="w-full">
              <Label
                className="pb-2"
                htmlFor="security-current-password"
              >
                Senha atual
              </Label>
              <InputPassword
                className="w-full"
                id="security-current-password"
                placeholder="Deixe em branco se não tiver senha"
                autoComplete="current-password"
                leftIcon={
                  <HugeiconsIcon
                    icon={LockIcon}
                    size={20}
                  />
                }
                {...form.register('currentPassword')}
              />
            </div>
            <div className="w-full">
              <Label
                className="pb-2"
                htmlFor="security-new-password"
              >
                Nova senha
              </Label>
              <InputPassword
                id="security-new-password"
                placeholder="Nova senha"
                autoComplete="new-password"
                leftIcon={
                  <HugeiconsIcon
                    icon={LockIcon}
                    size={20}
                  />
                }
                {...form.register('newPassword')}
              />
              {form.formState.errors.newPassword?.message && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="w-full">
              <Label
                className="pb-2"
                htmlFor="security-confirm-password"
              >
                Confirmar nova senha
              </Label>
              <InputPassword
                id="security-confirm-password"
                placeholder="Repita a senha"
                autoComplete="new-password"
                leftIcon={
                  <HugeiconsIcon
                    icon={LockIcon}
                    size={20}
                  />
                }
                {...form.register('confirmPassword')}
              />
              {form.formState.errors.confirmPassword?.message && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            {errorMessage && (
              <p className="text-sm text-destructive">{errorMessage}</p>
            )}
            <Button
              type="submit"
              loading={isExecuting}
            >
              Alterar senha
            </Button>
          </form>
        </div>
      </section>

      {/* MFA */}
      {userId && (
        <section>
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div>
              <h2 className="text-sm font-medium text-foreground">
                Autenticação em duas etapas
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Proteja sua conta com um código extra no login.
              </p>
            </div>
            <MfaSection
              userId={userId}
              initialHasTotp={initialHasTotp}
            />
          </div>
        </section>
      )}
    </div>
  );
}
