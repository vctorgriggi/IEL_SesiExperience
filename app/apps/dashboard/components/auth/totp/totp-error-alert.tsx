'use client';

import { authErrorLabels } from '@/features/auth/constants/auth-error-labels';
import { AlertCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { AuthErrorCode } from '@workspace/auth/errors';
import { Alert, AlertDescription } from '@workspace/ui';

export type TotpErrorAlertProps = {
  errorCode: AuthErrorCode;
};

export function TotpErrorAlert({ errorCode }: TotpErrorAlertProps) {
  const message = authErrorLabels[errorCode];
  return (
    <Alert className="flex gap-2 items-center bg-amber-100 border-amber-300 text-amber-800">
      <HugeiconsIcon
        icon={AlertCircleIcon}
        size={18}
        className="shrink-0"
      />
      <AlertDescription className="flex items-center align-middle">
        <span>{message}</span>
      </AlertDescription>
    </Alert>
  );
}
