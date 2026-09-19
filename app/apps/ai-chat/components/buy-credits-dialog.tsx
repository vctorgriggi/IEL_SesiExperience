'use client';

import { useState } from 'react';
import { Loading03Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { AI_CHAT_CREDIT_PACKS } from '@workspace/ai/credit-packs';
import { trackEvent } from '@workspace/analytics';
import { api } from '@workspace/routes';
import { Button, Dialog, toast } from '@workspace/ui';

import { apiPost } from '~/lib/api-client';
import { CreditLedger } from './credit-ledger';

/**
 * Os pacotes vêm de `@workspace/ai`, a mesma fonte que o checkout usa no
 * servidor: preço na tela e preço cobrado não têm como divergir.
 */
const PACKS = Object.entries(AI_CHAT_CREDIT_PACKS).map(([key, pack]) => ({
  key,
  ...pack
}));

type BuyCreditsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  className?: string;
};

function formatPrice(amountCents: number): string {
  return (amountCents / 100).toFixed(2).replace('.', ',');
}

export function BuyCreditsDialog({
  open,
  onOpenChange,
  onSuccess,
  className
}: BuyCreditsDialogProps) {
  const [loadingPack, setLoadingPack] = useState<string | null>(null);

  const handleBuy = async (pack: string) => {
    setLoadingPack(pack);
    trackEvent('ai_chat_credits_checkout_started', { pack });
    try {
      const res = await apiPost<{ checkoutUrl: string; billingId: string }>(
        api.aiChat.creditsCheckout(),
        { pack }
      );
      if (res?.checkoutUrl) {
        window.open(res.checkoutUrl, '_blank', 'noopener,noreferrer');
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error('Não foi possível gerar o link de pagamento.');
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao abrir checkout.'
      );
    } finally {
      setLoadingPack(null);
    }
  };

  return (
    <Dialog
      visible={open}
      onHide={() => onOpenChange(false)}
      header="Comprar mensagens"
      description="Pague com PIX ou cartão. Depois da confirmação, as mensagens entram na hora."
      size="sm"
      className={className}
    >
      <div className="space-y-2">
        {PACKS.map(({ key, name, amountCents }) => (
          <Button
            key={key}
            type="button"
            variant="outline"
            className="relative w-full justify-between py-4"
            onClick={() => handleBuy(key)}
            disabled={loadingPack !== null}
          >
            <span className="font-medium">{name}</span>
            <span className="text-muted-foreground">
              R$ {formatPrice(amountCents)}
            </span>
            {loadingPack === key ? (
              <HugeiconsIcon
                icon={Loading03Icon}
                size={18}
                className="animate-spin"
              />
            ) : null}
          </Button>
        ))}
      </div>

      <div className="mt-6 border-t pt-4">
        <h3 className="mb-1 text-sm font-medium text-foreground">Extrato</h3>
        <CreditLedger open={open} />
      </div>
    </Dialog>
  );
}
