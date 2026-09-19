import { beforeEach, describe, expect, it, vi } from 'vitest';

import { routes } from '@workspace/routes';

const {
  mockRedirect,
  mockReturnValidationErrors,
  mockHashPassword,
  mockCreateOtpTokens,
  mockSendVerifyEmailAddressEmail,
  mockDb,
  mockEq
} = vi.hoisted(() => ({
  mockRedirect: vi.fn((to: string) => to),
  mockReturnValidationErrors: vi.fn(),
  mockHashPassword: vi.fn(),
  mockCreateOtpTokens: vi.fn(),
  mockSendVerifyEmailAddressEmail: vi.fn(),
  mockDb: {
    select: vi.fn(),
    insert: vi.fn()
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

vi.mock('next-safe-action', () => ({
  returnValidationErrors: mockReturnValidationErrors
}));

vi.mock('@workspace/auth/password', () => ({
  hashPassword: mockHashPassword
}));

vi.mock('@workspace/auth/verification', () => ({
  createOtpTokens: mockCreateOtpTokens
}));

vi.mock('@workspace/email/send-verify-email-address-email', () => ({
  sendVerifyEmailAddressEmail: mockSendVerifyEmailAddressEmail
}));

vi.mock('@workspace/database', () => ({
  db: mockDb,
  eq: mockEq
}));

vi.mock('@workspace/database/schema', () => ({
  userTable: {
    id: 'user-id',
    email: 'user-email'
  }
}));

async function importAction() {
  return (await import('./sign-up')).signUp;
}

describe('signUp action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockReturnValidationErrors.mockImplementation((_schema, payload) => payload);
    mockDb.select.mockReturnValue(createSelectChain([]));
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined)
    });
    mockHashPassword.mockResolvedValue('hashed-password');
    mockCreateOtpTokens.mockResolvedValue({
      otp: 'ABC123',
      hashedOtp: 'hashed-otp-token'
    });
    mockSendVerifyEmailAddressEmail.mockResolvedValue(undefined);
  });

  it('returns validation error when email already exists', async () => {
    mockDb.select.mockReturnValue(createSelectChain([{ id: 'user-1' }]));
    const signUp = await importAction();

    const result = await signUp({
      name: 'User',
      email: 'user@acme.com',
      password: 'Strong123!'
    });

    expect(mockReturnValidationErrors).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      data: {
        email: { _errors: ['Este e-mail já está em uso.'] }
      }
    });
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it('creates user with normalized data, sends verification email and redirects', async () => {
    const insertValues = vi.fn().mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values: insertValues });
    const signUp = await importAction();

    await signUp({
      name: '  User Name  ',
      email: '  USER@ACME.COM ',
      password: 'Strong123!'
    });

    expect(mockHashPassword).toHaveBeenCalledWith('Strong123!');
    expect(insertValues).toHaveBeenCalledWith({
      name: 'User Name',
      email: 'user@acme.com',
      password: 'hashed-password',
      locale: 'pt-BR',
      completedOnboarding: false
    });
    expect(mockCreateOtpTokens).toHaveBeenCalledWith('user@acme.com');
    expect(mockSendVerifyEmailAddressEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: 'user@acme.com',
        otp: 'ABC123',
        verificationLink:
          routes.dashboard.auth.verifyEmail.request.byToken('hashed-otp-token')
      })
    );
    expect(mockRedirect).toHaveBeenCalledWith(
      `${routes.dashboard.auth.verifyEmail.index}?email=${encodeURIComponent('  USER@ACME.COM ')}`
    );
  });

  it('continues redirect flow when email sending fails', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mockSendVerifyEmailAddressEmail.mockRejectedValue(new Error('mail failed'));

    const signUp = await importAction();
    await signUp({
      name: 'User',
      email: 'user@acme.com',
      password: 'Strong123!'
    });

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(mockRedirect).toHaveBeenCalledWith(
      `${routes.dashboard.auth.verifyEmail.index}?email=${encodeURIComponent('user@acme.com')}`
    );
    consoleErrorSpy.mockRestore();
  });
});
