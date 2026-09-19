function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Único lugar que decide o que é um pagamento confirmado do AbacatePay.
 * Quem consome webhook (assinatura de organização, crédito de IA) pergunta
 * aqui, para os dois não divergirem no dia em que o provedor mudar o payload.
 *
 * Aceita `unknown` porque na borda do webhook o corpo ainda não é confiável.
 * Retorna `null` para qualquer evento que não seja `billing.paid` com status
 * `PAID`, ou `pix.paid`.
 */
export function extractPaidBillingId(payload: unknown): string | null {
  if (!isObject(payload)) return null;

  const eventType = typeof payload.event === 'string' ? payload.event : '';
  if (eventType !== 'billing.paid' && eventType !== 'pix.paid') return null;

  const data = isObject(payload.data) ? payload.data : undefined;
  const billing = data && isObject(data.billing) ? data.billing : undefined;
  const pix = data && isObject(data.pix) ? data.pix : undefined;

  const billingId =
    (billing && typeof billing.id === 'string' ? billing.id : undefined) ??
    (pix && typeof pix.billingId === 'string' ? pix.billingId : undefined);

  const statusOk =
    (billing !== undefined && billing.status === 'PAID') ||
    eventType === 'pix.paid';

  if (!billingId || !statusOk) return null;
  return billingId;
}
