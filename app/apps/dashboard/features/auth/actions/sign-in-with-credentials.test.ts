import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Provider } from '@workspace/auth/providers.types';

const { mockSignIn, mockGetRedirectAfterSignIn, mockReturnValidationErrors } =
  vi.hoisted(() => ({
    mockSignIn: vi.fn(),
    mockGetRedirectAfterSignIn: vi.fn(),
    mockReturnValidationErrors: vi.fn()
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

class MockCredentialsSignin extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

vi.mock('@/actions/safe-action', () => ({
  actionClient: createMockActionClient()
}));

vi.mock('@workspace/auth', () => ({
  signIn: mockSignIn
}));

vi.mock('@workspace/auth/redirect', () => ({
  getRedirectAfterSignIn: mockGetRedirectAfterSignIn
}));

vi.mock('@workspace/auth/errors', () => ({
  CredentialsSignin: MockCredentialsSignin
}));

vi.mock('next-safe-action', () => ({
  returnValidationErrors: mockReturnValidationErrors
}));

async function importAction() {
  return (await import('./sign-in-with-credentials')).signInWithCredentials;
}

describe('signInWithCredentials action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockGetRedirectAfterSignIn.mockResolvedValue('/acme/home');
    mockReturnValidationErrors.mockImplementation(
      (_schema, payload) => payload
    );
  });

  it('calls auth signIn with provider credentials and redirect options', async () => {
    mockSignIn.mockResolvedValue(undefined);
    const signInWithCredentials = await importAction();

    const input = { email: 'user@acme.com', password: 'Strong123!' };
    await signInWithCredentials(input);

    expect(mockGetRedirectAfterSignIn).toHaveBeenCalledTimes(1);
    expect(mockSignIn).toHaveBeenCalledWith(Provider.Credentials, {
      ...input,
      redirectTo: '/acme/home',
      redirect: true
    });
  });

  it('returns validation errors when credentials are invalid', async () => {
    mockSignIn.mockRejectedValue(
      new MockCredentialsSignin('invalid_credentials')
    );
    const signInWithCredentials = await importAction();

    const result = await signInWithCredentials({
      email: 'user@acme.com',
      password: 'wrong'
    });

    expect(mockReturnValidationErrors).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      data: {
        _errors: ['invalid_credentials']
      }
    });
  });

  it('rethrows unexpected errors from signIn', async () => {
    const unexpectedError = new Error('upstream failure');
    mockSignIn.mockRejectedValue(unexpectedError);
    const signInWithCredentials = await importAction();

    await expect(
      signInWithCredentials({
        email: 'user@acme.com',
        password: 'Strong123!'
      })
    ).rejects.toBe(unexpectedError);
  });
});
