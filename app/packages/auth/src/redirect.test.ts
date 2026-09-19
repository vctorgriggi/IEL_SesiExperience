import { beforeEach, describe, expect, it, vi } from 'vitest';

import { routes } from '@workspace/routes';

const {
  mockHasBasePath,
  mockRemoveBasePath,
  mockGetStore,
  mockCookies,
  mockSymmetricEncrypt,
  mockKeys
} = vi.hoisted(() => ({
  mockHasBasePath: vi.fn(),
  mockRemoveBasePath: vi.fn(),
  mockGetStore: vi.fn(),
  mockCookies: vi.fn(),
  mockSymmetricEncrypt: vi.fn((value: string) => `enc:${value}`),
  mockKeys: vi.fn(() => ({ AUTH_SECRET: 'test-secret' }))
}));

vi.mock('next/dist/client/has-base-path', () => ({
  hasBasePath: mockHasBasePath
}));

vi.mock('next/dist/client/remove-base-path', () => ({
  removeBasePath: mockRemoveBasePath
}));

vi.mock('next/dist/server/app-render/work-unit-async-storage.external', () => ({
  workUnitAsyncStorage: {
    getStore: mockGetStore
  }
}));

vi.mock('next/headers', () => ({
  cookies: mockCookies
}));

vi.mock('./encryption', () => ({
  symmetricEncrypt: mockSymmetricEncrypt
}));

vi.mock('../keys', () => ({
  keys: mockKeys
}));

async function importRedirect() {
  return import('./redirect');
}

describe('redirect helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockHasBasePath.mockReturnValue(false);
    mockRemoveBasePath.mockImplementation((value: string) => value);
    mockGetStore.mockReturnValue(null);
    mockCookies.mockResolvedValue({
      get: vi.fn(() => undefined)
    });
  });

  it('getRequestStoragePathname returns null when request store is unavailable', async () => {
    const { getRequestStoragePathname } = await importRedirect();
    expect(getRequestStoragePathname()).toBeNull();
  });

  it('getRequestStoragePathname returns pathname + search', async () => {
    mockGetStore.mockReturnValue({
      type: 'request',
      url: { pathname: '/acme/home', search: '?tab=events' }
    });

    const { getRequestStoragePathname } = await importRedirect();
    expect(getRequestStoragePathname()).toBe('/acme/home?tab=events');
  });

  it('getRequestStoragePathname removes basePath when needed', async () => {
    mockGetStore.mockReturnValue({
      type: 'request',
      url: { pathname: '/base/acme/home', search: '' }
    });
    mockHasBasePath.mockReturnValue(true);
    mockRemoveBasePath.mockReturnValue('/acme/home');

    const { getRequestStoragePathname } = await importRedirect();
    expect(getRequestStoragePathname()).toBe('/acme/home');
    expect(mockRemoveBasePath).toHaveBeenCalledWith('/base/acme/home');
  });

  it('getRedirectToSignIn includes callbackUrl for non-organization routes', async () => {
    mockGetStore.mockReturnValue({
      type: 'request',
      url: { pathname: '/acme/home', search: '?tab=events' }
    });

    const { getRedirectToSignIn } = await importRedirect();
    const redirectTo = getRedirectToSignIn();

    expect(redirectTo).toBe(
      `${routes.dashboard.auth.signIn}?callbackUrl=${encodeURIComponent('/acme/home?tab=events')}`
    );
  });

  it('getRedirectToSignIn maps /organizations to root callback', async () => {
    mockGetStore.mockReturnValue({
      type: 'request',
      url: { pathname: '/organizations', search: '' }
    });

    const { getRedirectToSignIn } = await importRedirect();
    expect(getRedirectToSignIn()).toBe(
      `${routes.dashboard.auth.signIn}?callbackUrl=${encodeURIComponent('/')}`
    );
  });

  it('getRedirectAfterSignIn prioritizes callback cookie over organization slug', async () => {
    mockCookies.mockResolvedValue({
      get: vi.fn((key: string) => {
        if (key.includes('callback-url')) {
          return { value: '/from-callback' };
        }
        if (key === 'organizationSlug') {
          return { value: 'acme' };
        }
        return undefined;
      })
    });

    const { getRedirectAfterSignIn } = await importRedirect();
    await expect(getRedirectAfterSignIn()).resolves.toBe('/from-callback');
  });

  it('getRedirectAfterSignIn falls back to organization slug', async () => {
    mockCookies.mockResolvedValue({
      get: vi.fn((key: string) =>
        key === 'organizationSlug' ? { value: 'acme' } : undefined
      )
    });

    const { getRedirectAfterSignIn } = await importRedirect();
    await expect(getRedirectAfterSignIn()).resolves.toBe(
      routes.dashboard.org('acme').home
    );
  });

  it('getRedirectAfterSignIn falls back to root when cookies are missing', async () => {
    const { getRedirectAfterSignIn } = await importRedirect();
    await expect(getRedirectAfterSignIn()).resolves.toBe('/');
  });

  it('getRedirectToTotp includes encrypted token and expiry', async () => {
    const { getRedirectToTotp } = await importRedirect();
    const redirectTo = getRedirectToTotp('user-1');

    expect(mockSymmetricEncrypt).toHaveBeenCalledTimes(2);
    expect(mockSymmetricEncrypt).toHaveBeenCalledWith('user-1', 'test-secret');
    expect(redirectTo).toContain(routes.dashboard.auth.totp);
    expect(redirectTo).toContain('token=enc%3Auser-1');
    expect(redirectTo).toContain('expiry=enc%3A');
  });
});
