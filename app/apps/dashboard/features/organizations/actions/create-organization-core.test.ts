import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Role } from '@workspace/database';

import { createOrganizationForUser } from './create-organization-core';

const {
  mockCanAccessOrganizationsList,
  mockGetOrganizationsByUserId,
  mockDbTransaction,
  mockOrganizationInsertValues,
  mockOrganizationInsertReturning,
  mockMembershipInsertValues,
  mockTxInsert
} = vi.hoisted(() => ({
  mockCanAccessOrganizationsList: vi.fn(),
  mockGetOrganizationsByUserId: vi.fn(),
  mockDbTransaction: vi.fn(),
  mockOrganizationInsertValues: vi.fn(),
  mockOrganizationInsertReturning: vi.fn(),
  mockMembershipInsertValues: vi.fn(),
  mockTxInsert: vi.fn()
}));

vi.mock('server-only', () => ({}));

vi.mock('@/features/members/permissions', () => ({
  canAccessOrganizationsList: mockCanAccessOrganizationsList
}));

vi.mock('../data/get-organizations-by-user-id', () => ({
  getOrganizationsByUserId: mockGetOrganizationsByUserId
}));

vi.mock('@workspace/database', () => ({
  db: {
    transaction: mockDbTransaction
  },
  membershipTable: {
    organizationId: 'membership-organization-id',
    userId: 'membership-user-id',
    role: 'membership-role',
    isOwner: 'membership-owner'
  },
  organizationTable: {
    id: 'organization-id',
    name: 'organization-name',
    slug: 'organization-slug'
  },
  Role: {
    ADMIN: 'admin',
    MEMBER: 'member'
  }
}));

describe('createOrganizationForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetOrganizationsByUserId.mockResolvedValue([]);
    mockCanAccessOrganizationsList.mockReturnValue(true);

    mockOrganizationInsertReturning.mockResolvedValue([
      {
        id: 'org-1',
        name: 'Acme',
        slug: 'acme'
      }
    ]);
    mockOrganizationInsertValues.mockReturnValue({
      returning: mockOrganizationInsertReturning
    });

    mockMembershipInsertValues.mockResolvedValue(undefined);

    mockTxInsert.mockImplementation(
      (table: { id?: string; organizationId?: string }) => {
        if (table.id === 'organization-id') {
          return { values: mockOrganizationInsertValues };
        }

        if (table.organizationId === 'membership-organization-id') {
          return { values: mockMembershipInsertValues };
        }

        throw new Error(`Unexpected table: ${table}`);
      }
    );

    mockDbTransaction.mockImplementation(async (callback) =>
      callback({ insert: mockTxInsert })
    );
  });

  it('throws when user has no permission to create organizations', async () => {
    mockCanAccessOrganizationsList.mockReturnValue(false);

    await expect(
      createOrganizationForUser({
        userId: 'user-1',
        name: 'Acme',
        slug: 'acme'
      })
    ).rejects.toThrow('Você não tem permissão para criar organizações.');

    expect(mockDbTransaction).not.toHaveBeenCalled();
  });

  it('creates organization and owner membership with normalized values', async () => {
    const result = await createOrganizationForUser({
      userId: 'user-1',
      name: '  Acme Inc  ',
      slug: '  ACME  '
    });

    expect(mockGetOrganizationsByUserId).toHaveBeenCalledWith('user-1');
    expect(mockCanAccessOrganizationsList).toHaveBeenCalledWith([]);
    expect(mockOrganizationInsertValues).toHaveBeenCalledWith({
      name: 'Acme Inc',
      slug: 'acme'
    });
    expect(mockMembershipInsertValues).toHaveBeenCalledWith({
      organizationId: 'org-1',
      userId: 'user-1',
      role: Role.ADMIN,
      isOwner: true
    });
    expect(result).toEqual({
      id: 'org-1',
      name: 'Acme',
      slug: 'acme'
    });
  });

  it('throws when organization insert returns empty result', async () => {
    mockOrganizationInsertReturning.mockResolvedValue([]);

    await expect(
      createOrganizationForUser({
        userId: 'user-1',
        name: 'Acme',
        slug: 'acme'
      })
    ).rejects.toThrow('Falha ao criar organização');
  });

  it('maps unique slug violation to friendly error', async () => {
    mockDbTransaction.mockRejectedValue({
      code: '23505',
      constraint: 'IX_organization_slug_unique'
    });

    await expect(
      createOrganizationForUser({
        userId: 'user-1',
        name: 'Acme',
        slug: 'acme'
      })
    ).rejects.toThrow('Slug já em uso. Escolha outro.');
  });

  it('rethrows unexpected database errors', async () => {
    const dbError = new Error('database timeout');
    mockDbTransaction.mockRejectedValue(dbError);

    await expect(
      createOrganizationForUser({
        userId: 'user-1',
        name: 'Acme',
        slug: 'acme'
      })
    ).rejects.toBe(dbError);
  });
});
