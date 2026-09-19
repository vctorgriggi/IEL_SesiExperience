import { beforeEach, describe, expect, it, vi } from 'vitest';

import { routes } from '@workspace/routes';

const { mockRedirect, mockHashPassword, mockDb, mockEq } = vi.hoisted(() => ({
  mockRedirect: vi.fn((to: string) => to),
  mockHashPassword: vi.fn(),
  mockDb: {
    select: vi.fn(),
    transaction: vi.fn()
  },
  mockEq: vi.fn((a, b) => ({ a, b }))
}));

function createMockActionClient() {
  return {
    metadata() {
      return this;
    },
    inputSchema() {
      return this;
    },
    action<TInput, TOutput>(
      handler: (args: { parsedInput: TInput }) => Promise<TOutput> | TOutput
    ) {
      return async (input: TInput) => ({
        data: await handler({ parsedInput: input })
      });
    }
  };
}

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

vi.mock('next/navigation', () => ({
  redirect: mockRedirect
}));

vi.mock('@/actions/safe-action', () => ({
  actionClient: createMockActionClient()
}));

vi.mock('@workspace/auth/password', () => ({
  hashPassword: mockHashPassword
}));

vi.mock('@workspace/database', () => ({
  db: mockDb,
  eq: mockEq
}));

vi.mock('@workspace/database/schema', () => ({
  resetPasswordRequestTable: {
    id: 'reset-request-id',
    email: 'reset-request-email',
    expires: 'reset-request-expires'
  },
  userTable: {
    id: 'user-id',
    email: 'user-email',
    password: 'user-password'
  }
}));

async function importAction() {
  return (await import('./reset-password')).resetPassword;
}

describe('resetPassword action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockHashPassword.mockResolvedValue('hashed-password');
  });

  it('throws NotFoundError when reset request does not exist', async () => {
    mockDb.select.mockReturnValueOnce(createSelectChain([]));
    const resetPassword = await importAction();

    await expect(
      resetPassword({
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        password: 'Strong123!',
        confirmPassword: 'Strong123!'
      })
    ).rejects.toMatchObject({ name: 'NotFoundError' });
  });

  it('throws NotFoundError when user account no longer exists', async () => {
    mockDb.select
      .mockReturnValueOnce(
        createSelectChain([{ email: 'missing@acme.com' }])
      )
      .mockReturnValueOnce(createSelectChain([]));
    const resetPassword = await importAction();

    await expect(
      resetPassword({
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        password: 'Strong123!',
        confirmPassword: 'Strong123!'
      })
    ).rejects.toMatchObject({ name: 'NotFoundError' });
  });

  it('expires request, updates password and redirects to success page', async () => {
    mockDb.select
      .mockReturnValueOnce(createSelectChain([{ email: 'user@acme.com' }]))
      .mockReturnValueOnce(createSelectChain([{ id: 'user-1' }]));

    const txUpdateWhere = vi.fn().mockResolvedValue(undefined);
    const txUpdateSet = vi.fn().mockReturnValue({ where: txUpdateWhere });
    const txUpdate = vi.fn().mockReturnValue({ set: txUpdateSet });

    mockDb.transaction.mockImplementation(async (callback) =>
      callback({
        update: txUpdate
      })
    );

    const resetPassword = await importAction();
    await resetPassword({
      requestId: '550e8400-e29b-41d4-a716-446655440000',
      password: 'Strong123!',
      confirmPassword: 'Strong123!'
    });

    expect(mockHashPassword).toHaveBeenCalledWith('Strong123!');
    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    expect(txUpdate).toHaveBeenCalledTimes(2);
    expect(mockRedirect).toHaveBeenCalledWith(
      routes.dashboard.auth.resetPassword.success
    );
  });
});
