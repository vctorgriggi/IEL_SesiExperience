'use client';

import { useBillingPortal, useCheckout } from '@/features/billing/use-billing';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  toast
} from '@workspace/ui';

type BillingCardProps = {
  slug: string;
  /** Passado pelo RSC (page/layout). */
  hasActiveSubscription: boolean;
};

export function BillingCard({ slug, hasActiveSubscription }: BillingCardProps) {
  const checkoutMutation = useCheckout(slug);
  const portalMutation = useBillingPortal(slug);

  const handleCheckout = async (billingInterval: 'monthly' | 'yearly') => {
    try {
      await checkoutMutation.mutateAsync({
        productId: 'pro',
        billingInterval
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao criar checkout'
      );
    }
  };

  const handlePortal = async () => {
    try {
      await portalMutation.mutateAsync();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao abrir portal');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plano atual</CardTitle>
        <CardDescription>
          {hasActiveSubscription
            ? 'Você tem uma assinatura ativa.'
            : 'Assine um plano para desbloquear todos os recursos.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasActiveSubscription ? (
          <Button
            onClick={handlePortal}
            disabled={portalMutation.isPending}
            loading={portalMutation.isPending}
          >
            Gerenciar assinatura
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={() => handleCheckout('monthly')}
              disabled={checkoutMutation.isPending}
              loading={checkoutMutation.isPending}
            >
              Assinar Pro (mensal)
            </Button>
            <Button
              outlined
              onClick={() => handleCheckout('yearly')}
              disabled={checkoutMutation.isPending}
              loading={checkoutMutation.isPending}
            >
              Assinar Pro (anual)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
