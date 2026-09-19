import { describe, it, expect, vi } from 'vitest';
import {
  handleAbacatePayEvent,
  isAbacatePayEventProcessed,
  recordAbacatePayWebhookEvent,
  type AbacatePayWebhookPayload
} from '../providers/abacatepay/webhook';

const makeMockDb = (overrides?: Record<string, unknown>) => ({
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([]),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
  ...overrides
});

function makeMockRepo() {
  return {
    findAbacateBillingByBillingId: vi.fn(),
    updateAbacateBillingStatus: vi.fn().mockResolvedValue(undefined),
    insertSubscription: vi.fn().mockResolvedValue(undefined),
    insertSubscriptionItem: vi.fn().mockResolvedValue(undefined),
    isEventProcessed: vi.fn(),
    recordEvent: vi.fn()
  };
}

describe('handleAbacatePayEvent', () => {
  it('ignores unknown event types', async () => {
    const repo = makeMockRepo();
    await handleAbacatePayEvent(repo as never, { event: 'unknown.event' });
    expect(repo.findAbacateBillingByBillingId).not.toHaveBeenCalled();
  });

  it('returns early when billingId is missing', async () => {
    const repo = makeMockRepo();
    const payload: AbacatePayWebhookPayload = {
      event: 'billing.paid',
      data: { billing: { id: '', status: 'PAID' } }
    };
    await handleAbacatePayEvent(repo as never, payload);
    expect(repo.findAbacateBillingByBillingId).not.toHaveBeenCalled();
  });

  it('returns early when billing status is not PAID', async () => {
    const repo = makeMockRepo();
    const payload: AbacatePayWebhookPayload = {
      event: 'billing.paid',
      data: { billing: { id: 'bl_123', status: 'PENDING' } }
    };
    await handleAbacatePayEvent(repo as never, payload);
    expect(repo.updateAbacateBillingStatus).not.toHaveBeenCalled();
  });

  it('returns early when billing record not found in DB', async () => {
    const repo = makeMockRepo();
    repo.findAbacateBillingByBillingId.mockResolvedValueOnce(undefined);

    const payload: AbacatePayWebhookPayload = {
      event: 'billing.paid',
      data: { billing: { id: 'bl_unknown', status: 'PAID' } }
    };

    await handleAbacatePayEvent(repo as never, payload);
    expect(repo.updateAbacateBillingStatus).not.toHaveBeenCalled();
  });

  it('processes billing.paid and upserts subscription', async () => {
    const repo = makeMockRepo();
    repo.findAbacateBillingByBillingId.mockResolvedValueOnce({
      organizationId: 'org_1',
      planType: 'monthly',
      amount: 4990
    });

    const payload: AbacatePayWebhookPayload = {
      event: 'billing.paid',
      data: { billing: { id: 'bl_123', status: 'PAID' } }
    };

    await handleAbacatePayEvent(repo as never, payload);
    expect(repo.updateAbacateBillingStatus).toHaveBeenCalledWith('bl_123', 'PAID');
    expect(repo.insertSubscription).toHaveBeenCalledTimes(1);
    expect(repo.insertSubscriptionItem).toHaveBeenCalledTimes(1);
  });

  it('processes pix.paid using billingId from pix data', async () => {
    const repo = makeMockRepo();
    repo.findAbacateBillingByBillingId.mockResolvedValueOnce({
      organizationId: 'org_1',
      planType: 'monthly',
      amount: 2990
    });

    const payload: AbacatePayWebhookPayload = {
      event: 'pix.paid',
      data: { pix: { billingId: 'bl_456' } }
    };

    await handleAbacatePayEvent(repo as never, payload);
    expect(repo.updateAbacateBillingStatus).toHaveBeenCalledWith('bl_456', 'PAID');
  });
});

describe('isAbacatePayEventProcessed', () => {
  it('returns false when event is not in DB', async () => {
    const db = makeMockDb();
    db.limit.mockResolvedValueOnce([]);
    const result = await isAbacatePayEventProcessed(db as never, 'evt_new');
    expect(result).toBe(false);
  });

  it('returns true when event exists in DB', async () => {
    const db = makeMockDb();
    db.limit.mockResolvedValueOnce([{ id: 1, eventId: 'evt_existing' }]);
    const result = await isAbacatePayEventProcessed(db as never, 'evt_existing');
    expect(result).toBe(true);
  });
});

describe('recordAbacatePayWebhookEvent', () => {
  it('inserts webhook event record', async () => {
    const db = makeMockDb();
    const onConflictDoNothing = vi.fn().mockResolvedValue(undefined);
    const insertSpy = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing
      })
    });
    db.insert = insertSpy;

    await recordAbacatePayWebhookEvent(db as never, 'evt_123', 'billing.paid');
    expect(insertSpy).toHaveBeenCalled();
    expect(onConflictDoNothing).toHaveBeenCalled();
  });
});
