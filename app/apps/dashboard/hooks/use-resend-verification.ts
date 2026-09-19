'use client';

import { useCallback, useState } from 'react';
import { resendVerificationEmail } from '@/features/auth/actions/resend-verification-email';

import { toast } from '@workspace/ui';

const RESEND_SUCCESS_MESSAGE = 'Email de verificação reenviado';
const RESEND_ERROR_MESSAGE = 'Não foi possível reenviar a verificação';

type UseResendVerificationParams = {
  email: string;
};

type UseResendVerificationReturn = {
  handleResend: () => void;
  isPending: boolean;
};

export function useResendVerification({
  email
}: UseResendVerificationParams): UseResendVerificationReturn {
  const [isPending, setIsPending] = useState(false);

  const handleResend = useCallback(async () => {
    setIsPending(true);
    try {
      const result = await resendVerificationEmail({ email });
      if (result?.validationErrors || result?.serverError) {
        toast.error(RESEND_ERROR_MESSAGE);
        return;
      }

      toast.success(RESEND_SUCCESS_MESSAGE);
    } catch {
      toast.error(RESEND_ERROR_MESSAGE);
    } finally {
      setIsPending(false);
    }
  }, [email]);

  return {
    handleResend,
    isPending
  };
}
