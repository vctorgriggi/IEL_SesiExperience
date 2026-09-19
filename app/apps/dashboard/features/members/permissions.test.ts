import type { Member } from '@/features/members/types';
import { describe, expect, it } from 'vitest';

import { can, canAccessOrganizationsList } from './permissions';

function member(overrides: Partial<Member> = {}): Member {
  return {
    id: 'm1',
    userId: 'u1',
    role: 'member',
    isOwner: false,
    name: 'Member',
    email: 'member@example.com',
    ...overrides
  };
}

describe('can(membership)', () => {
  it('returns all permissions false when membership is null', () => {
    const permissions = can(null);
    expect(permissions.viewMembers).toBe(false);
    expect(permissions.inviteMembers).toBe(false);
    expect(permissions.removeMembers).toBe(false);
    expect(permissions.updateMemberRoles).toBe(false);
    expect(permissions.viewBilling).toBe(false);
    expect(permissions.updateOrgSettings).toBe(false);
    expect(permissions.viewEvents).toBe(false);
    expect(permissions.checkIn).toBe(false);
    expect(permissions.isOwner).toBe(false);
    expect(permissions.viewRevenue).toBe(false);
    expect(permissions.viewSupport).toBe(false);
  });

  it('grants only member-level permissions when role is member and not owner', () => {
    const m = member({ role: 'member', isOwner: false });
    const permissions = can(m);
    expect(permissions.viewMembers).toBe(true);
    expect(permissions.viewEvents).toBe(true);
    expect(permissions.checkIn).toBe(true);
    expect(permissions.inviteMembers).toBe(false);
    expect(permissions.removeMembers).toBe(false);
    expect(permissions.updateMemberRoles).toBe(false);
    expect(permissions.viewBilling).toBe(false);
    expect(permissions.updateOrgSettings).toBe(false);
    expect(permissions.isOwner).toBe(false);
    expect(permissions.viewRevenue).toBe(false);
    expect(permissions.viewSupport).toBe(false);
  });

  it('grants all admin permissions but isOwner false when role is admin and not owner', () => {
    const m = member({ role: 'admin', isOwner: false });
    const permissions = can(m);
    expect(permissions.viewMembers).toBe(true);
    expect(permissions.inviteMembers).toBe(true);
    expect(permissions.removeMembers).toBe(true);
    expect(permissions.updateMemberRoles).toBe(true);
    expect(permissions.viewBilling).toBe(true);
    expect(permissions.updateOrgSettings).toBe(true);
    expect(permissions.viewEvents).toBe(true);
    expect(permissions.checkIn).toBe(true);
    expect(permissions.isOwner).toBe(false);
    expect(permissions.viewRevenue).toBe(true);
    expect(permissions.viewSupport).toBe(true);
  });

  it('grants all permissions including isOwner when isOwner is true', () => {
    const m = member({ role: 'member', isOwner: true });
    const permissions = can(m);
    expect(permissions.viewMembers).toBe(true);
    expect(permissions.inviteMembers).toBe(true);
    expect(permissions.removeMembers).toBe(true);
    expect(permissions.updateMemberRoles).toBe(true);
    expect(permissions.viewBilling).toBe(true);
    expect(permissions.updateOrgSettings).toBe(true);
    expect(permissions.viewEvents).toBe(true);
    expect(permissions.checkIn).toBe(true);
    expect(permissions.isOwner).toBe(true);
    expect(permissions.viewRevenue).toBe(true);
    expect(permissions.viewSupport).toBe(true);
  });
});

describe('canAccessOrganizationsList', () => {
  it('returns true when no organizations', () => {
    expect(canAccessOrganizationsList([])).toBe(true);
  });

  it('returns false when only member roles', () => {
    expect(
      canAccessOrganizationsList([
        { role: 'member', isOwner: false },
        { role: 'member', isOwner: false }
      ])
    ).toBe(false);
  });

  it('returns true when at least one admin', () => {
    expect(
      canAccessOrganizationsList([
        { role: 'member', isOwner: false },
        { role: 'admin', isOwner: false }
      ])
    ).toBe(true);
  });

  it('returns true when at least one owner', () => {
    expect(
      canAccessOrganizationsList([{ role: 'member', isOwner: true }])
    ).toBe(true);
  });
});
