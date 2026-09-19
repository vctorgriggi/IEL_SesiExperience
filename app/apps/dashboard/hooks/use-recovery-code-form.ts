'use client';

import { useState, type FormEvent } from 'react';
import { submitRecoveryCode } from '@/features/auth/actions/submit-recovery-code';
import { authErrorLabels } from '@/features/auth/constants/auth-error-labels';
import { useZodForm } from '@/hooks/use-zod-form';

import { AuthErrorCode } from '@workspace/auth/errors';
import {
  submitRecoveryCodeSchema,
  type SubmitRecoveryCodeSchema
} from '@workspace/auth/schemas';

type UseRecoveryCodeFormParams = {
  token: string;
  expiry: string;
};

type UseRecoveryCodeFormReturn = {
  methods: ReturnType<typeof useZodForm<typeof submitRecoveryCodeSchema>>;
  canSubmit: boolean;
  isSubmitting: boolean;
  errorCode: AuthErrorCode | undefined;
  errorMessage: string | undefined;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export function useRecoveryCodeForm({
  token,
  expiry
}: UseRecoveryCodeFormParams): UseRecoveryCodeFormReturn {
  const [errorCode, setErrorCode] = useState<AuthErrorCode>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isPending, setIsPending] = useState(false);

  const methods = useZodForm({
    schema: submitRecoveryCodeSchema,
    mode: 'onSubmit',
    defaultValues: {
      token,
      expiry,
      recoveryCode: ''
    }
  });

  const canSubmit = !isPending && !methods.formState.isSubmitting;
  const isSubmitting = methods.formState.isSubmitting || isPending;

  const handleSubmit = methods.handleSubmit(
    async (values: SubmitRecoveryCodeSchema) => {
      if (!canSubmit) return;
      setErrorCode(undefined);
      setErrorMessage(undefined);
      setIsPending(true);

      try {
        const result = await submitRecoveryCode(values);

        const code = result?.validationErrors?._errors?.[0];
        if (code) {
          const authCode =
            code in authErrorLabels
              ? (code as AuthErrorCode)
              : AuthErrorCode.UnknownError;
          setErrorCode(authCode);
          setErrorMessage(authErrorLabels[authCode]);
        } else if (result?.serverError) {
          setErrorCode(AuthErrorCode.UnknownError);
          setErrorMessage(authErrorLabels[AuthErrorCode.UnknownError]);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const authCode =
          message in authErrorLabels
            ? (message as AuthErrorCode)
            : AuthErrorCode.UnknownError;
        setErrorCode(authCode);
        setErrorMessage(authErrorLabels[authCode]);
      } finally {
        setIsPending(false);
      }
    }
  );

  return {
    methods,
    canSubmit,
    isSubmitting,
    errorCode,
    errorMessage,
    handleSubmit
  };
}
