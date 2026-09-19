'use client';

import { UNAUTHORIZED_SESSION_MESSAGE } from '@/features/auth/constants/unauthorized';
import { firstValidationError } from '@/lib/get-error-message';

export type RunSafeActionOptions = {
  onUnauthorized?: () => void | Promise<void>;
};

export async function runSafeAction<TData>(
  promise: Promise<unknown>,
  options?: RunSafeActionOptions
): Promise<TData | undefined> {
  const result = (await promise) as {
    data?: TData;
    serverError?: string;
    validationErrors?: unknown;
  };

  if (result?.serverError) {
    if (
      result.serverError === UNAUTHORIZED_SESSION_MESSAGE &&
      options?.onUnauthorized
    ) {
      await options.onUnauthorized();
    }
    throw new Error(result.serverError);
  }

  const validationError = firstValidationError(result?.validationErrors);
  if (validationError) {
    throw new Error(validationError);
  }

  return result.data;
}
