import { describe, expect, it } from 'vitest';

import { extractPaidBillingId } from '../providers/abacatepay/paid-event';

describe('extractPaidBillingId', () => {
  it('extrai o billingId de billing.paid com status PAID', () => {
    expect(
      extractPaidBillingId({
        event: 'billing.paid',
        data: { billing: { id: 'bill_123', status: 'PAID' } }
      })
    ).toBe('bill_123');
  });

  it('aceita pix.paid pelo billingId do pix, sem exigir status', () => {
    expect(
      extractPaidBillingId({
        event: 'pix.paid',
        data: { pix: { billingId: 'bill_pix' } }
      })
    ).toBe('bill_pix');
  });

  it('ignora billing.paid com status diferente de PAID', () => {
    expect(
      extractPaidBillingId({
        event: 'billing.paid',
        data: { billing: { id: 'bill_123', status: 'PENDING' } }
      })
    ).toBeNull();
  });

  it('ignora eventos que não são de pagamento', () => {
    expect(
      extractPaidBillingId({
        event: 'billing.created',
        data: { billing: { id: 'bill_123', status: 'PAID' } }
      })
    ).toBeNull();
  });

  it('é tolerante a payload malformado', () => {
    expect(extractPaidBillingId(null)).toBeNull();
    expect(extractPaidBillingId(undefined)).toBeNull();
    expect(extractPaidBillingId('nope')).toBeNull();
    expect(extractPaidBillingId({ event: 'billing.paid' })).toBeNull();
    expect(
      extractPaidBillingId({
        event: 'billing.paid',
        data: { billing: { status: 'PAID' } }
      })
    ).toBeNull();
  });
});
