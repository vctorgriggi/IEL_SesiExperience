'use client';

import { useBillingPortal } from '@/features/billing/use-billing';
import { File01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Button, toast } from '@workspace/ui';

type BillingPortalButtonProps = {
  slug: string;
};

export function BillingPortalButton({ slug }: BillingPortalButtonProps) {
  const portal = useBillingPortal(slug);

  const handlePortal = async () => {
    try {
      await portal.mutateAsync();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao abrir portal');
    }
  };

  return (
    <Button
      outlined
      onClick={handlePortal}
      loading={portal.isPending}
      className="min-w-[var(--width-button-action)]"
    >
      <HugeiconsIcon
        icon={File01Icon}
        size={18}
        className="mr-2 shrink-0"
      />
      Gerenciar assinatura
    </Button>
  );
}
