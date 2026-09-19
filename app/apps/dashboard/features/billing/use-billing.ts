'use client';

import { firstValidationError } from '@/lib/get-error-message';
import { useAction } from 'next-safe-action/hooks';

import { toast } from '@workspace/ui';

import { createBillingPortalSession, createCheckoutSession } from './actions';
import type { CheckoutInput } from './schemas/checkout-schema';

export function useCheckout(_organizationSlug: string) {
  const { executeAsync, isExecuting } = useAction(createCheckoutSession, {
    onError: ({ error }) => {
      const message =
        error.serverError ??
        firstValidationError(error.validationErrors) ??
        'Erro ao processar';
      toast.error(message);
    }
  });

  return {
    mutateAsync: async (payload: CheckoutInput) => {
      const result = await executeAsync(payload);
      if (result?.serverError) throw new Error(result.serverError);
      if (result?.validationErrors) {
        throw new Error(firstValidationError(result.validationErrors));
      }
      const data = result?.data;
      if (data?.url) window.location.href = data.url;
      return data;
    },
    isPending: isExecuting
  };
}

export function useBillingPortal(_organizationSlug: string) {
  const { executeAsync, isExecuting } = useAction(createBillingPortalSession, {
    onError: ({ error }) => {
      const message =
        error.serverError ??
        firstValidationError(error.validationErrors) ??
        'Erro ao abrir portal';
      toast.error(message);
    }
  });

  return {
    mutateAsync: async () => {
      const result = await executeAsync(undefined);
      if (result?.serverError) throw new Error(result.serverError);
      if (result?.validationErrors) {
        throw new Error(firstValidationError(result.validationErrors));
      }
      const data = result?.data;
      if (data?.url) window.location.href = data.url;
      return data;
    },
    isPending: isExecuting
  };
}
