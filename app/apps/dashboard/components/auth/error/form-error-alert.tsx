'use client';

import { AlertCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

export type FormErrorAlertProps = {
  message: string;
};

export function FormErrorAlert({ message }: FormErrorAlertProps) {
  return (
    <div
      role="alert"
      className="mt-4 flex items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground"
    >
      <HugeiconsIcon
        icon={AlertCircleIcon}
        size={18}
        className="shrink-0"
      />
      <span>{message}</span>
    </div>
  );
}
