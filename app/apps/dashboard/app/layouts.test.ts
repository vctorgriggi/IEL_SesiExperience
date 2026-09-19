import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { routes } from '@workspace/routes';

const {
  mockRedirect,
  mockDedupedAuth,
  mockGetRequestStoragePathname,
  mockGetAuthContext,
  mockGetUserOrganizations,
  mockGetOrganizationsByUserId,
  mockGetActivePlanByOrganizationId,
  mockGetCurrentMembership,
  mockHeaders
} = vi.hoisted(() => ({
  mockRedirect: vi.fn((target) => target),
  mockDedupedAuth: vi.fn(),
  mockGetRequestStoragePathname: vi.fn(),
  mockGetAuthContext: vi.fn(),
  mockGetUserOrganizations: vi.fn(),
  mockGetOrganizationsByUserId: vi.fn(),
  mockGetActivePlanByOrganizationId: vi.fn(),
  mockGetCurrentMembership: vi.fn(),
  mockHeaders: vi.fn()
}));

vi.mock('server-only', () => ({}));

vi.mock('next/navigation', () => ({
  redirect: mockRedirect
}));

vi.mock('next/headers', () => ({
  headers: mockHeaders
}));

vi.mock('@/lib/formatters', () => ({
  createTitle: vi.fn((title: string) => title)
}));

vi.mock('@workspace/auth', () => ({
  dedupedAuth: mockDedupedAuth
}));

vi.mock('@workspace/auth/redirect', () => ({
  getRequestStoragePathname: mockGetRequestStoragePathname
}));

vi.mock('@workspace/auth/context', () => ({
  getAuthContext: mockGetAuthContext
}));

vi.mock('@/features/organizations/data/get-user-organizations', () => ({
  getUserOrganizations: mockGetUserOrganizations
}));

vi.mock('@/features/organizations/data/get-organizations-by-user-id', () => ({
  getOrganizationsByUserId: mockGetOrganizationsByUserId
}));

vi.mock('@/features/billing/data/get-active-plan', () => ({
  getActivePlanByOrganizationId: mockGetActivePlanByOrganizationId
}));

vi.mock('@/features/members/data/get-current-membership', () => ({
  getCurrentMembership: mockGetCurrentMembership
}));

vi.mock('@workspace/ui', () => ({
  ThemeToggle: () => null
}));

vi.mock('@/components/layout/auth-logo', () => ({
  AuthLogo: () => null
}));

vi.mock('@/components/layout/protected-layout-client', () => ({
  ProtectedLayoutClient: 'protected-layout-client'
}));

async function importAuthLayout() {
  return (await import('./(auth)/layout')).default;
}

async function importProtectedLayout() {
  return (await import('./(protected)/layout')).default;
}

describe('dashboard layouts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.stubGlobal('React', React);

    mockDedupedAuth.mockResolvedValue(null);
    mockGetRequestStoragePathname.mockReturnValue('/auth/sign-in');
    mockGetAuthContext.mockResolvedValue({
      session: {
        user: {
          id: 'user-1'
        }
      }
    });
    mockGetUserOrganizations.mockResolvedValue([
      {
        id: 'org-1',
        name: 'Acme',
        slug: 'acme'
      }
    ]);
    mockGetOrganizationsByUserId.mockResolvedValue([
      {
        id: 'org-1',
        name: 'Acme',
        slug: 'acme'
      }
    ]);
    mockGetActivePlanByOrganizationId.mockResolvedValue(null);
    mockGetCurrentMembership.mockResolvedValue(null);
    mockHeaders.mockResolvedValue({
      get: vi.fn(() => null)
    });
  });

  describe('AuthLayout', () => {
    it('redirects authenticated users away from regular auth pages', async () => {
      mockDedupedAuth.mockResolvedValue({
        user: {
          id: 'user-1'
        }
      });
      mockGetRequestStoragePathname.mockReturnValue('/auth/sign-in');

      const AuthLayout = await importAuthLayout();

      await expect(AuthLayout({ children: 'conteudo' })).resolves.toBe(
        routes.dashboard.org('acme').home
      );
      expect(mockRedirect).toHaveBeenCalledWith(routes.dashboard.org('acme').home);
    });

    it('keeps authenticated users on change-email routes', async () => {
      mockDedupedAuth.mockResolvedValue({
        user: {
          id: 'user-1'
        }
      });
      mockGetRequestStoragePathname.mockReturnValue(
        '/auth/change-email/request/request-1'
      );

      const AuthLayout = await importAuthLayout();
      const result = await AuthLayout({ children: 'conteudo' });

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        props: expect.objectContaining({
          children: expect.anything()
        }),
        type: 'main'
      });
    });
  });

  describe('ProtectedLayout', () => {
    it('passes current organization slug (from path) to the client layout', async () => {
      mockHeaders.mockResolvedValue({
        get: vi.fn((key: string) =>
          key === 'x-pathname' ? '/cookie-org/home' : null
        )
      });

      const ProtectedLayout = await importProtectedLayout();
      const result = await ProtectedLayout({ children: 'conteudo' });

      expect(mockGetAuthContext).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        props: expect.objectContaining({
          currentOrgSlug: 'cookie-org',
          hideSidebar: false,
          organizations: [
            {
              id: 'org-1',
              name: 'Acme',
              slug: 'acme'
            }
          ]
        }),
        type: 'protected-layout-client'
      });
    });

    it('hides the sidebar on organizations index when no organization is selected', async () => {
      mockHeaders.mockResolvedValue({
        get: vi.fn((key: string) => {
          if (key === 'x-pathname') {
            return '/organizations';
          }

          return null;
        })
      });

      const ProtectedLayout = await importProtectedLayout();
      const result = await ProtectedLayout({ children: 'conteudo' });

      expect(result).toMatchObject({
        props: expect.objectContaining({
          currentOrgSlug: null,
          hideSidebar: true
        }),
        type: 'protected-layout-client'
      });
    });
  });
});
