import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDb, mockEq, mockAnd, mockGte, mockKeys } = vi.hoisted(() => ({
  mockDb: {
    insert: vi.fn(),
    select: vi.fn(),
    transaction: vi.fn()
  },
  mockEq: vi.fn((column, value) => ({ column, value, op: 'eq' })),
  mockAnd: vi.fn((...conditions) => ({ conditions, op: 'and' })),
  mockGte: vi.fn((column, value) => ({ column, value, op: 'gte' })),
  mockKeys: vi.fn(() => ({ AUTH_SECRET: 'test-secret' }))
}));

vi.mock('@workspace/database', () => ({
  db: mockDb,
  eq: mockEq,
  and: mockAnd,
  gte: mockGte
}));

vi.mock('@workspace/database/schema', () => ({
  verificationTokenTable: {
    identifier: 'verification-identifier',
    token: 'verification-token',
    expires: 'verification-expires'
  },
  changeEmailRequestTable: {
    email: 'change-email-request-email'
  },
  resetPasswordRequestTable: {
    email: 'reset-password-request-email'
  },
  userTable: {
    email: 'user-email',
    emailVerified: 'user-email-verified'
  }
}));

vi.mock('../keys', () => ({
  keys: mockKeys
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

async function importVerification() {
  return import('./verification');
}

describe('verification helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined)
    });
  });

  it('createOtpTokens persists a hashed token and returns otp + hash', async () => {
    const randomSpy = vi
      .spyOn(globalThis.crypto, 'getRandomValues')
      .mockImplementation((array) => {
        if (array instanceof Uint8Array) {
          array[0] = 1;
          array[1] = 2;
          array[2] = 3;
        }
        return array;
      });
    const valuesSpy = vi.fn().mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values: valuesSpy });

    const { createOtpTokens } = await importVerification();
    const result = await createOtpTokens('user@acme.com');

    expect(result.otp).toBe('010203');
    expect(result.hashedOtp).toHaveLength(64);
    expect(valuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'user@acme.com',
        token: result.hashedOtp,
        expires: expect.any(Date)
      })
    );
    randomSpy.mockRestore();
  });

  it('findVerificationTokenFromOtp returns token row when found', async () => {
    const row = {
      identifier: 'user@acme.com',
      expires: new Date('2030-01-01T00:00:00.000Z')
    };
    mockDb.select.mockReturnValue(createSelectChain([row]));

    const { findVerificationTokenFromOtp } = await importVerification();
    await expect(findVerificationTokenFromOtp('abc123')).resolves.toEqual(row);
  });

  it('findVerificationTokenByToken returns undefined when token is expired or missing', async () => {
    mockDb.select.mockReturnValue(createSelectChain([]));

    const { findVerificationTokenByToken } = await importVerification();
    await expect(
      findVerificationTokenByToken('missing')
    ).resolves.toBeUndefined();
  });

  it('findIdentifierByVerificationToken returns identifier when token exists', async () => {
    mockDb.select.mockReturnValue(
      createSelectChain([{ identifier: 'user@acme.com' }])
    );

    const { findIdentifierByVerificationToken } = await importVerification();
    await expect(findIdentifierByVerificationToken('token-1')).resolves.toBe(
      'user@acme.com'
    );
  });

  it('verifyEmail expires tokens, removes pending requests and marks user as verified', async () => {
    const txUpdateWhere = vi.fn().mockResolvedValue(undefined);
    const txUpdateSet = vi.fn().mockReturnValue({ where: txUpdateWhere });
    const txUpdate = vi.fn().mockReturnValue({ set: txUpdateSet });

    const txDeleteWhere = vi.fn().mockResolvedValue(undefined);
    const txDelete = vi.fn().mockReturnValue({ where: txDeleteWhere });

    mockDb.transaction.mockImplementation(async (callback) =>
      callback({
        update: txUpdate,
        delete: txDelete
      })
    );

    const { verifyEmail } = await importVerification();
    await verifyEmail('user@acme.com');

    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    expect(txUpdate).toHaveBeenCalledTimes(2);
    expect(txDelete).toHaveBeenCalledTimes(2);
  });
});
