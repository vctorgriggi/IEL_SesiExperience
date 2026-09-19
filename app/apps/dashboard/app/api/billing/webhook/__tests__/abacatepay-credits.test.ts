import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockVerifyAndParse,
  mockProcessWebhook,
  mockSettleAiCredit,
  callOrder
} = vi.hoisted(() => {
  const callOrder: string[] = [];
  return {
    callOrder,
    mockVerifyAndParse: vi.fn(),
    mockProcessWebhook: vi.fn(async () => {
      callOrder.push('billing');
    }),
    mockSettleAiCredit: vi.fn(async () => {
      callOrder.push('credits');
      return true;
    })
  };
});

class FakeBillingError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
  }
}

vi.mock('@workspace/billing', () => ({
  verifyAndParseAbacatePayWebhook: mockVerifyAndParse,
  processAbacatePayWebhook: mockProcessWebhook,
  BillingError: FakeBillingError
}));

vi.mock('@workspace/ai', () => ({
  settleAiCreditFromAbacatePay: mockSettleAiCredit
}));

vi.mock('@workspace/database', () => ({ db: {} }));

const EVENT = {
  id: 'evt_1',
  data: { event: 'billing.paid', data: { billing: { id: 'b1' } } }
};

function request(body = '{}', signature: string | null = 'assinatura') {
  return new Request('http://localhost/api/billing/webhook/abacatepay', {
    method: 'POST',
    headers: signature ? { 'x-signature': signature } : {},
    body
  });
}

describe('POST /api/billing/webhook/abacatepay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callOrder.length = 0;
    process.env.BILLING_ABACATEPAY_WEBHOOK_SECRET = 'segredo';
    mockVerifyAndParse.mockResolvedValue(EVENT);
  });

  it('recusa requisição sem assinatura, sem processar nada', async () => {
    const { POST } = await import('../abacatepay/route');

    const res = await POST(request('{}', null));

    expect(res.status).toBe(401);
    expect(mockSettleAiCredit).not.toHaveBeenCalled();
    expect(mockProcessWebhook).not.toHaveBeenCalled();
  });

  it('devolve 401 quando a assinatura é inválida', async () => {
    mockVerifyAndParse.mockRejectedValue(
      new FakeBillingError('assinatura inválida', 'webhook_signature_invalid')
    );
    const { POST } = await import('../abacatepay/route');

    const res = await POST(request());

    expect(res.status).toBe(401);
    expect(mockSettleAiCredit).not.toHaveBeenCalled();
    expect(mockProcessWebhook).not.toHaveBeenCalled();
  });

  it('credita a IA antes do billing da organização', async () => {
    const { POST } = await import('../abacatepay/route');

    const res = await POST(request());

    expect(res.status).toBe(200);
    // O handler de organização deduplica por event.id: se ele rodasse
    // primeiro e falhasse, o reenvio do provedor nunca creditaria a IA.
    expect(callOrder).toEqual(['credits', 'billing']);
  });

  it('repassa o payload do evento para o crédito', async () => {
    const { POST } = await import('../abacatepay/route');

    await POST(request());

    expect(mockSettleAiCredit).toHaveBeenCalledWith(EVENT.data);
  });

  it('devolve 500 sem vazar detalhe quando o processamento quebra', async () => {
    mockProcessWebhook.mockRejectedValue(new Error('coluna x não existe'));
    const { POST } = await import('../abacatepay/route');

    const res = await POST(request());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).not.toContain('coluna x');
  });
});
