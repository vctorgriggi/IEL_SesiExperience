import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetOrganizationSlug,
  mockGetAuthContext,
  mockGetMembersForOrganization
} = vi.hoisted(() => ({
  mockGetOrganizationSlug: vi.fn(),
  mockGetAuthContext: vi.fn(),
  mockGetMembersForOrganization: vi.fn()
}));

vi.mock('server-only', () => ({}));

vi.mock('react', () => ({
  cache: <T extends (...args: never[]) => unknown>(fn: T) => fn
}));

vi.mock(
  '@/features/organizations/routing/get-organization-slug-server',
  () => ({
    getOrganizationSlug: mockGetOrganizationSlug
  })
);

vi.mock('@workspace/auth/context', () => ({
  getAuthContext: mockGetAuthContext
}));

vi.mock('@/features/members/data/get-members-for-organization', () => ({
  getMembersForOrganization: mockGetMembersForOrganization
}));

async function importGetCurrentMembership() {
  return import('./get-current-membership');
}

describe('getCurrentMembership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns null when slug is null', async () => {
    mockGetOrganizationSlug.mockResolvedValue(null);

    const { getCurrentMembership } = await importGetCurrentMembership();

    await expect(getCurrentMembership()).resolves.toBeNull();
    expect(mockGetOrganizationSlug).toHaveBeenCalledTimes(1);
    expect(mockGetAuthContext).not.toHaveBeenCalled();
    expect(mockGetMembersForOrganization).not.toHaveBeenCalled();
  });

  it('returns null when slug is undefined', async () => {
    mockGetOrganizationSlug.mockResolvedValue(undefined);

    const { getCurrentMembership } = await importGetCurrentMembership();

    await expect(getCurrentMembership()).resolves.toBeNull();
    expect(mockGetAuthContext).not.toHaveBeenCalled();
    expect(mockGetMembersForOrganization).not.toHaveBeenCalled();
  });

  it('returns null when session has no user', async () => {
    mockGetOrganizationSlug.mockResolvedValue('acme');
    mockGetAuthContext.mockResolvedValue({ session: null });
    mockGetMembersForOrganization.mockResolvedValue([]);

    const { getCurrentMembership } = await importGetCurrentMembership();

    await expect(getCurrentMembership()).resolves.toBeNull();
    expect(mockGetAuthContext).toHaveBeenCalledTimes(1);
    expect(mockGetMembersForOrganization).toHaveBeenCalledWith('acme');
  });

  it('returns null when session user has no id', async () => {
    mockGetOrganizationSlug.mockResolvedValue('acme');
    mockGetAuthContext.mockResolvedValue({
      session: { user: { name: 'Jane' } }
    });
    mockGetMembersForOrganization.mockResolvedValue([
      {
        id: 'mem-1',
        userId: 'user-1',
        role: 'member',
        isOwner: false,
        name: 'Jane',
        email: 'jane@acme.com'
      }
    ]);

    const { getCurrentMembership } = await importGetCurrentMembership();

    await expect(getCurrentMembership()).resolves.toBeNull();
    expect(mockGetMembersForOrganization).toHaveBeenCalledWith('acme');
  });

  it('returns null when user is not in members list', async () => {
    mockGetOrganizationSlug.mockResolvedValue('acme');
    mockGetAuthContext.mockResolvedValue({
      session: { user: { id: 'user-other' } }
    });
    mockGetMembersForOrganization.mockResolvedValue([
      {
        id: 'mem-1',
        userId: 'user-1',
        role: 'admin',
        isOwner: false,
        name: 'Alice',
        email: 'alice@acme.com'
      }
    ]);

    const { getCurrentMembership } = await importGetCurrentMembership();

    await expect(getCurrentMembership()).resolves.toBeNull();
    expect(mockGetMembersForOrganization).toHaveBeenCalledWith('acme');
  });

  it('returns the member when user is in members list', async () => {
    const currentMember = {
      id: 'mem-current',
      userId: 'user-current',
      role: 'admin',
      isOwner: false,
      name: 'Current User',
      email: 'current@acme.com'
    };
    mockGetOrganizationSlug.mockResolvedValue('acme');
    mockGetAuthContext.mockResolvedValue({
      session: { user: { id: 'user-current' } }
    });
    mockGetMembersForOrganization.mockResolvedValue([
      {
        id: 'mem-1',
        userId: 'user-1',
        role: 'member',
        isOwner: false,
        name: 'Alice',
        email: 'alice@acme.com'
      },
      currentMember,
      {
        id: 'mem-3',
        userId: 'user-3',
        role: 'member',
        isOwner: false,
        name: 'Bob',
        email: 'bob@acme.com'
      }
    ]);

    const { getCurrentMembership } = await importGetCurrentMembership();

    await expect(getCurrentMembership()).resolves.toEqual(currentMember);
    expect(mockGetAuthContext).toHaveBeenCalledTimes(1);
    expect(mockGetMembersForOrganization).toHaveBeenCalledWith('acme');
  });

  it('returns the owner member when current user is owner', async () => {
    const ownerMember = {
      id: 'mem-owner',
      userId: 'user-owner',
      role: 'admin',
      isOwner: true,
      name: 'Owner',
      email: 'owner@acme.com'
    };
    mockGetOrganizationSlug.mockResolvedValue('acme');
    mockGetAuthContext.mockResolvedValue({
      session: { user: { id: 'user-owner' } }
    });
    mockGetMembersForOrganization.mockResolvedValue([ownerMember]);

    const { getCurrentMembership } = await importGetCurrentMembership();

    await expect(getCurrentMembership()).resolves.toEqual(ownerMember);
  });

  it('is wrapped with cache (same result when called twice with same mocks)', async () => {
    const member = {
      id: 'mem-1',
      userId: 'user-1',
      role: 'member',
      isOwner: false,
      name: 'Alice',
      email: 'alice@acme.com'
    };
    mockGetOrganizationSlug.mockResolvedValue('acme');
    mockGetAuthContext.mockResolvedValue({
      session: { user: { id: 'user-1' } }
    });
    mockGetMembersForOrganization.mockResolvedValue([member]);

    const { getCurrentMembership } = await importGetCurrentMembership();

    const first = await getCurrentMembership();
    const second = await getCurrentMembership();

    expect(first).toEqual(member);
    expect(second).toEqual(member);
  });
});
