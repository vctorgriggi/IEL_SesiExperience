import { beforeEach, describe, expect, it, vi } from 'vitest';

import { routes } from '@workspace/routes';

import { AuthCookies } from './cookies';
import { OAuthProvider, Provider } from './providers.types';

const AuthErrorCode = {
  UnverifiedEmail: 'unverified_email',
  IllegalOAuthProvider: 'illegal_oauth_provider',
  AlreadyLinked: 'already_linked',
  RequiresExplicitLinking: 'requires_explicit_linking'
} as const;

const {
  mockCookieGet,
  mockCookieSet,
  mockCookies,
  mockDb,
  mockEq,
  mockAnd,
  mockCreateSession,
  mockGetRedirectToTotp,
  mockGenerateSessionToken,
  mockGetSessionExpiryFromNow,
  __pushSelect,
  __clearSelect
} = vi.hoisted(() => {
  const selectQueue: unknown[][] = [];

  const mockDb = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => (selectQueue.shift() ?? []) as unknown[])
        }))
      }))
    }))
  };

  return {
    mockCookieGet: vi.fn(),
    mockCookieSet: vi.fn(),
    mockCookies: vi.fn(),
    mockDb,
    mockEq: vi.fn((a, b) => ({ a, b })),
    mockAnd: vi.fn((...args) => args),
    mockCreateSession: vi.fn(),
    mockGetRedirectToTotp: vi.fn(
      (userId: string) => `/auth/totp?token=${userId}`
    ),
    mockGenerateSessionToken: vi.fn(() => 'session-token-1'),
    mockGetSessionExpiryFromNow: vi.fn(
      () => new Date('2030-01-01T00:00:00.000Z')
    ),
    __pushSelect: (rows: unknown[]) => selectQueue.push(rows),
    __clearSelect: () => {
      selectQueue.length = 0;
    }
  };
});

vi.mock('next/headers', () => ({
  cookies: mockCookies
}));

vi.mock('@workspace/database', () => ({
  db: mockDb,
  eq: mockEq,
  and: mockAnd
}));

vi.mock('@workspace/database/schema', () => ({
  accountTable: {
    provider: 'account-provider',
    providerAccountId: 'account-provider-account-id',
    userId: 'account-user-id'
  },
  authenticatorAppTable: {
    userId: 'auth-app-user-id'
  },
  sessionTable: {
    expires: 'session-expires',
    sessionToken: 'session-token'
  },
  userTable: {
    id: 'user-id',
    email: 'user-email'
  }
}));

vi.mock('./adapter', () => ({
  adapter: {
    createSession: mockCreateSession
  }
}));

vi.mock('./errors', () => ({
  AuthErrorCode
}));

vi.mock('./redirect', () => ({
  getRedirectToTotp: mockGetRedirectToTotp
}));

vi.mock('./session', () => ({
  generateSessionToken: mockGenerateSessionToken,
  getSessionExpiryFromNow: mockGetSessionExpiryFromNow
}));

async function importCallbacks() {
  return (await import('./callbacks')).callbacks;
}

describe('auth callbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    __clearSelect();
    mockCookies.mockResolvedValue({
      get: mockCookieGet,
      set: mockCookieSet
    });
    mockCookieGet.mockReturnValue(undefined);
    mockCreateSession.mockResolvedValue({ sessionToken: 'created-session-1' });
  });

  it('signIn returns false when account is missing', async () => {
    const callbacks = await importCallbacks();
    await expect(
      callbacks.signIn({ user: {}, account: null, profile: null } as never)
    ).resolves.toBe(false);
  });

  it('signIn with credentials returns false when user id is missing', async () => {
    const callbacks = await importCallbacks();
    await expect(
      callbacks.signIn({
        user: {},
        account: { type: 'credentials', provider: Provider.Credentials },
        profile: null
      } as never)
    ).resolves.toBe(false);
  });

  it('signIn with credentials redirects to TOTP when authenticator app is enabled', async () => {
    __pushSelect([{}]);
    const callbacks = await importCallbacks();

    await expect(
      callbacks.signIn({
        user: { id: 'user-1' },
        account: { type: 'credentials', provider: Provider.Credentials },
        profile: null
      } as never)
    ).resolves.toBe('/auth/totp?token=user-1');
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  it('signIn with credentials creates session and sets cookie when TOTP is disabled', async () => {
    __pushSelect([]);
    const callbacks = await importCallbacks();

    await expect(
      callbacks.signIn({
        user: { id: 'user-1' },
        account: { type: 'credentials', provider: Provider.Credentials },
        profile: null
      } as never)
    ).resolves.toBe(true);

    expect(mockCreateSession).toHaveBeenCalledWith({
      sessionToken: 'session-token-1',
      userId: 'user-1',
      expires: new Date('2030-01-01T00:00:00.000Z')
    });
    expect(mockCookieSet).toHaveBeenCalledWith({
      name: AuthCookies.SessionToken,
      value: 'session-token-1',
      expires: new Date('2030-01-01T00:00:00.000Z')
    });
  });

  it('signIn with credentials returns false when adapter fails to create session', async () => {
    __pushSelect([]);
    mockCreateSession.mockResolvedValue(null);
    const callbacks = await importCallbacks();

    await expect(
      callbacks.signIn({
        user: { id: 'user-1' },
        account: { type: 'credentials', provider: Provider.Credentials },
        profile: null
      } as never)
    ).resolves.toBe(false);
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it('signIn blocks unsupported OAuth providers', async () => {
    const callbacks = await importCallbacks();

    await expect(
      callbacks.signIn({
        user: { id: 'user-1' },
        account: {
          type: 'oauth',
          provider: 'github',
          providerAccountId: 'oauth-1'
        },
        profile: { email: 'user@acme.com', email_verified: true, name: 'User' }
      } as never)
    ).resolves.toBe(
      `${routes.dashboard.auth.error}?error=${AuthErrorCode.IllegalOAuthProvider}`
    );
  });

  it('signIn blocks unverified Google accounts', async () => {
    const callbacks = await importCallbacks();

    await expect(
      callbacks.signIn({
        user: { id: 'user-1' },
        account: {
          type: 'oauth',
          provider: OAuthProvider.Google,
          providerAccountId: 'oauth-1'
        },
        profile: {
          email: 'user@acme.com',
          email_verified: false,
          name: 'User'
        }
      } as never)
    ).resolves.toBe(
      `${routes.dashboard.auth.error}?error=${AuthErrorCode.UnverifiedEmail}`
    );
  });

  it('signIn returns already_linked when signed-in user tries linking an already-linked OAuth account', async () => {
    __pushSelect([{ userId: 'linked-user-1' }]);
    __pushSelect([{ expires: new Date('2030-01-01T00:00:00.000Z') }]);
    mockCookieGet.mockImplementation((key: string) =>
      key === AuthCookies.SessionToken ? { value: 'active-session' } : undefined
    );
    const callbacks = await importCallbacks();

    await expect(
      callbacks.signIn({
        user: { id: 'user-1' },
        account: {
          type: 'oauth',
          provider: OAuthProvider.Google,
          providerAccountId: 'oauth-1'
        },
        profile: { email: 'user@acme.com', email_verified: true, name: 'User' }
      } as never)
    ).resolves.toBe(
      `${routes.dashboard.index}?error=${AuthErrorCode.AlreadyLinked}`
    );
  });

  it('signIn requires explicit linking when OAuth email already exists in another account', async () => {
    __pushSelect([]);
    __pushSelect([{ id: 'existing-user-1' }]);
    const callbacks = await importCallbacks();

    await expect(
      callbacks.signIn({
        user: { id: 'new-user-1' },
        account: {
          type: 'oauth',
          provider: OAuthProvider.Google,
          providerAccountId: 'oauth-1'
        },
        profile: {
          email: 'existing@acme.com',
          email_verified: true,
          name: 'Existing User'
        }
      } as never)
    ).resolves.toBe(
      `${routes.dashboard.auth.error}?error=${AuthErrorCode.RequiresExplicitLinking}`
    );
  });

  it('signIn allows OAuth sign-in and trims long names', async () => {
    __pushSelect([]);
    __pushSelect([]);
    const callbacks = await importCallbacks();
    const longName = 'A'.repeat(80);
    const user = { id: 'user-1', name: longName };
    const profile = {
      email: 'new@acme.com',
      email_verified: true,
      name: longName
    };

    await expect(
      callbacks.signIn({
        user,
        account: {
          type: 'oauth',
          provider: OAuthProvider.Google,
          providerAccountId: 'oauth-1'
        },
        profile
      } as never)
    ).resolves.toBe(true);

    expect(user.name).toHaveLength(64);
    expect(profile.name).toHaveLength(64);
  });

  it('jwt stores access token and session id for credentials sign-in', async () => {
    const callbacks = await importCallbacks();

    const token = await callbacks.jwt({
      token: {},
      trigger: 'signIn',
      account: { access_token: 'access-1', type: 'credentials' },
      user: { id: 'user-1' }
    } as never);

    expect(token).toMatchObject({
      accessToken: 'access-1',
      sessionId: 'created-session-1'
    });
  });

  it('session callback injects authenticated user id', async () => {
    const callbacks = await importCallbacks();
    const session = await callbacks.session({
      trigger: 'signIn',
      session: { user: { name: 'User', email: 'user@acme.com' } },
      user: { id: 'user-1' }
    } as never);

    expect(session.user.id).toBe('user-1');
  });
});
