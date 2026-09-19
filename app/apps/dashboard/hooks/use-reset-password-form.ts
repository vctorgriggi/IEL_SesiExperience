'use client';

import { useState, type FormEvent } from 'react';
import { resetPassword } from '@/features/auth/actions/reset-password';
import {
  resetPasswordSchema,
  type ResetPasswordSchema
} from '@/features/auth/schemas/reset-password-schema';
import { useZodForm } from '@/hooks/use-zod-form';

const RESET_PASSWORD_ERROR_MESSAGE = 'Não foi possível redefinir a senha.';

type UseResetPasswordFormParams = {
  requestId: string;
};

type UseResetPasswordFormReturn = {
  methods: ReturnType<typeof useZodForm<typeof resetPasswordSchema>>;
  password: string;
  canSubmit: boolean;
  isSubmitting: boolean;
  errorMessage: string | undefined;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export function useResetPasswordForm({
  requestId
}: UseResetPasswordFormParams): UseResetPasswordFormReturn {
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isPending, setIsPending] = useState(false);

  const methods = useZodForm({
    schema: resetPasswordSchema,
    mode: 'onSubmit',
    defaultValues: {
      requestId,
      password: '',
      confirmPassword: ''
    }
  });

  const password = methods.watch('password');
  const canSubmit = !methods.formState.isSubmitting && !isPending;
  const isSubmitting = methods.formState.isSubmitting || isPending;

  const handleSubmit = methods.handleSubmit(
    async (values: ResetPasswordSchema) => {
      if (!canSubmit) return;
      setErrorMessage(undefined);
      setIsPending(true);

      try {
        const result = await resetPassword(values);
        if (result?.validationErrors || result?.serverError) {
          setErrorMessage(RESET_PASSWORD_ERROR_MESSAGE);
        }
      } catch {
        setErrorMessage(RESET_PASSWORD_ERROR_MESSAGE);
      } finally {
        setIsPending(false);
      }
    }
  );

  return {
    methods,
    password,
    canSubmit,
    isSubmitting,
    errorMessage,
    handleSubmit
  };
}
