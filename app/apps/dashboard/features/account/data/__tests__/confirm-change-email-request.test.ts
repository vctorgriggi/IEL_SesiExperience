import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDb, mockEq, mockAnd, mockGte } = vi.hoisted(() => ({
  mockDb: {
    select: vi.fn(),
    transaction: vi.fn()
  },
  mockEq: vi.fn((column, value) => ({ type: 'eq', column, value })),
  mockAnd: vi.fn((...conditions) => ({ type: 'and', conditions })),
  mockGte: vi.fn((column, value) => ({ type: 'gte', column, value }))
}));

vi.mock('server-only', () => ({}));

vi.mock('@workspace/database', () => ({
  and: mockAnd,
  db: mockDb,
  eq: mockEq,
  gte: mockGte
}));

vi.mock('@workspace/database/schema', () => ({
  changeEmailRequestTable: {
    email: 'change-email-request-email',
    expires: 'change-email-request-expires',
    id: 'change-email-request-id',
    userId: 'change-email-request-user-id',
    valid: 'change-email-request-valid'
  },
  userTable: {
    email: 'user-email',
    emailVerified: 'user-email-verified',
    id: 'user-id'
  }
}));

function createSelectChain<T>(result: T) {
  const limit = vi.fn().mockResolvedValue(result);
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit
      })
    })
  };
}

async function importConfirmChangeEmailRequest() {
  const mod = await import('../confirm-change-email-request');
  return mod.confirmChangeEmailRequest;
}

describe('confirmChangeEmailRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns null when the request is missing or expired', async () => {
    mockDb.select.mockReturnValue(createSelectChain([]));

    const confirmChangeEmailRequest = await importConfirmChangeEmailRequest();

    await expect(
      confirmChangeEmailRequest('missing-request')
    ).resolves.toBeNull();
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  it('updates the user email and removes the processed request', async () => {
    mockDb.select.mockReturnValue(
      createSelectChain([
        {
          id: 'request-1',
          userId: 'user-1',
          email: 'novo@email.com'
        }
      ])
    );

    const txUserWhere = vi.fn().mockResolvedValue(undefined);
    const txUserSet = vi.fn().mockReturnValue({ where: txUserWhere });
    const txUserUpdate = vi.fn().mockReturnValue({ set: txUserSet });

    const txDeleteWhere = vi.fn().mockResolvedValue(undefined);
    const txDelete = vi.fn().mockReturnValue({ where: txDeleteWhere });

    mockDb.transaction.mockImplementation(async (callback) =>
      callback({
        delete: txDelete,
        update: txUserUpdate
      })
    );

    const confirmChangeEmailRequest = await importConfirmChangeEmailRequest();

    await expect(confirmChangeEmailRequest('request-1')).resolves.toEqual({
      email: 'novo@email.com'
    });
    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    expect(txUserUpdate).toHaveBeenCalledTimes(1);
    expect(txDelete).toHaveBeenCalledTimes(1);
  });
});
