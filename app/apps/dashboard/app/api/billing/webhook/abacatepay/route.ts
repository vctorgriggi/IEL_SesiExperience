import {
  BillingError,
  processAbacatePayWebhook,
  verifyAndParseAbacatePayWebhook
} from '@workspace/billing';
import { db } from '@workspace/database';

import { settleAiCreditFromAbacatePay } from '@workspace/ai';

/** Header AbacatePay envia com a assinatura HMAC-SHA256 (hex). Conferir em docs.abacatepay.com se diferente. */
const SIGNATURE_HEADER = 'x-signature';

export async function POST(request: Request): Promise<Response> {
  const secret =
    process.env.BILLING_ABACATEPAY_WEBHOOK_SECRET ??
    process.env.ABACATEPAY_WEBHOOK_SECRET ??
    '';

  if (!secret) {
    return Response.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return Response.json({ error: 'Invalid body' }, { status: 400 });
  }

  const signature = request.headers.get(SIGNATURE_HEADER) ?? '';
  if (!signature) {
    return Response.json(
      { error: 'Missing signature header' },
      { status: 401 }
    );
  }

  try {
    const event = await verifyAndParseAbacatePayWebhook(
      rawBody,
      signature,
      secret
    );
    // Créditos de IA primeiro (idempotente por billingId) para não serem
    // ignorados caso o processamento de billing da organização falhe e o
    // provedor reenvie o evento (dedup por event.id).
    await settleAiCreditFromAbacatePay(event.data);
    await processAbacatePayWebhook(db, event);
    return Response.json(
      { received: true },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    if (err instanceof BillingError) {
      const status =
        err.code === 'webhook_signature_invalid' ||
        err.code === 'webhook_secret_missing'
          ? 401
          : 400;
      return Response.json({ error: err.message }, { status });
    }
    console.error('[AbacatePay webhook]', err);
    return Response.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
