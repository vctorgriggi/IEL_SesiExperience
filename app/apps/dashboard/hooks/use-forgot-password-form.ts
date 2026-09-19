'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { sendResetPasswordInstructions } from '@/features/auth/actions/send-reset-password-instructions';
import {
  sendResetPasswordInstructionsSchema,
  type SendResetPasswordInstructionsSchema
} from '@/features/auth/schemas/send-reset-password-instructions-schema';
import { useZodForm } from '@/hooks/use-zod-form';

import { routes } from '@workspace/routes';
import { toast } from '@workspace/ui';

const FORGOT_PASSWORD_ERROR_MESSAGE =
  'Não foi possível solicitar a alteração de senha.';

type UseForgotPasswordFormReturn = {
  methods: ReturnType<
    typeof useZodForm<typeof sendResetPasswordInstructionsSchema>
  >;
  canSubmit: boolean;
  isSubmitting: boolean;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export function useForgotPasswordForm(): UseForgotPasswordFormReturn {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const methods = useZodForm({
    schema: sendResetPasswordInstructionsSchema,
    mode: 'onSubmit',
    defaultValues: {
      email: ''
    }
  });

  const canSubmit = !methods.formState.isSubmitting && !isPending;
  const isSubmitting = methods.formState.isSubmitting || isPending;

  const handleSubmit = methods.handleSubmit(
    async (values: SendResetPasswordInstructionsSchema) => {
      if (!canSubmit) return;
      setIsPending(true);

      try {
        const result = await sendResetPasswordInstructions({
          email: values.email
        });

        if (result?.validationErrors || result?.serverError) {
          toast.error(FORGOT_PASSWORD_ERROR_MESSAGE);
          return;
        }

        router.replace(
          `${routes.dashboard.auth.forgotPassword.success}?email=${values.email}`
        );
      } catch {
        toast.error(FORGOT_PASSWORD_ERROR_MESSAGE);
      } finally {
        setIsPending(false);
      }
    }
  );

  return {
    methods,
    canSubmit,
    isSubmitting,
    handleSubmit
  };
}
