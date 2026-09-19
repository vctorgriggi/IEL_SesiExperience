import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Role } from '@workspace/database/schema';

const {
  mockDb,
  mockEq,
  mockAnd,
  mockSendInvitationEmail,
  mockInvitationStatus,
  mockRouteUrls,
  pushSelectRows,
  clearSelectQueue
} = vi.hoisted(() => {
  const selectQueue: unknown[][] = [];

  const mockDb = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => (selectQueue.shift() ?? []) as unknown[])
        }))
      }))
    })),
    transaction: vi.fn(),
    update: vi.fn()
  };

  return {
    mockDb,
    mockEq: vi.fn((a, b) => ({ a, b })),
    mockAnd: vi.fn((...args) => args),
    mockSendInvitationEmail: vi.fn(),
    mockInvitationStatus: {
      PENDING: 'PENDING',
      REVOKED: 'REVOKED',
      ACCEPTED: 'ACCEPTED'
    },
    mockRouteUrls: {
      dashboard: {
        invitations: {
          request: (token: string) =>
            `https://dashboard.local/invitations/request/${token}`
        }
      }
    },
    pushSelectRows: (rows: unknown[]) => selectQueue.push(rows),
    clearSelectQueue: () => {
      selectQueue.length = 0;
    }
  };
});

vi.mock('@workspace/database', () => ({
  db: mockDb,
  eq: mockEq,
  and: mockAnd
}));

vi.mock('@workspace/database/schema', () => ({
  InvitationStatus: mockInvitationStatus,
  Role: {
    ADMIN: 'admin',
    MEMBER: 'member'
  },
  invitationTable: {
    id: 'invitation-id',
    token: 'invitation-token',
    status: 'invitation-status',
    role: 'invitation-role',
    email: 'invitation-email',
    organizationId: 'invitation-organization-id'
  },
  membershipTable: {
    organizationId: 'membership-organization-id',
    userId: 'membership-user-id'
  },
  organizationTable: {
    id: 'organization-id',
    slug: 'organization-slug'
  },
  userTable: {
    id: 'user-id',
    email: 'user-email'
  }
}));

vi.mock('@workspace/email/send-invitation-email', () => ({
  sendInvitationEmail: mockSendInvitationEmail
}));

vi.mock('@workspace/routes', () => ({
  routeUrls: mockRouteUrls
}));

async function importInvitations() {
  return import('./invitations');
}

describe('invitation helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    clearSelectQueue();
  });

  describe('acceptInvitation', () => {
    it('returns invalid when token is empty', async () => {
      const { acceptInvitation } = await importInvitations();
      await expect(
        acceptInvitation('   ', 'user-1', 'user@acme.com')
      ).resolves.toEqual({ ok: false, reason: 'invalid' });
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it('returns revoked when invitation is revoked', async () => {
      pushSelectRows([
        {
          id: 'inv-1',
          organizationId: 'org-1',
          email: 'user@acme.com',
          role: 'member',
          status: mockInvitationStatus.REVOKED
        }
      ]);

      const { acceptInvitation } = await importInvitations();
      await expect(
        acceptInvitation('token-1', 'user-1', 'user@acme.com')
      ).resolves.toEqual({ ok: false, reason: 'revoked' });
    });

    it('returns accepted org slug when invitation was already accepted', async () => {
      pushSelectRows([
        {
          id: 'inv-1',
          organizationId: 'org-1',
          email: 'user@acme.com',
          role: 'member',
          status: mockInvitationStatus.ACCEPTED
        }
      ]);
      pushSelectRows([{ slug: 'acme' }]);

      const { acceptInvitation } = await importInvitations();
      await expect(
        acceptInvitation('token-1', 'user-1', 'user@acme.com')
      ).resolves.toEqual({ ok: true, organizationSlug: 'acme' });
    });

    it('returns email_mismatch when invitation email differs from authenticated user', async () => {
      pushSelectRows([
        {
          id: 'inv-1',
          organizationId: 'org-1',
          email: 'other@acme.com',
          role: 'member',
          status: mockInvitationStatus.PENDING
        }
      ]);

      const { acceptInvitation } = await importInvitations();
      await expect(
        acceptInvitation('token-1', 'user-1', 'user@acme.com')
      ).resolves.toEqual({ ok: false, reason: 'email_mismatch' });
    });

    it('creates membership and marks invitation as accepted', async () => {
      pushSelectRows([
        {
          id: 'inv-1',
          organizationId: 'org-1',
          email: 'user@acme.com',
          role: 'admin',
          status: mockInvitationStatus.PENDING
        }
      ]);
      pushSelectRows([{ slug: 'acme' }]);
      pushSelectRows([]);

      const txInsertValues = vi.fn().mockResolvedValue(undefined);
      const txInsert = vi.fn().mockReturnValue({ values: txInsertValues });
      const txUpdateWhere = vi.fn().mockResolvedValue(undefined);
      const txUpdateSet = vi.fn().mockReturnValue({ where: txUpdateWhere });
      const txUpdate = vi.fn().mockReturnValue({ set: txUpdateSet });

      mockDb.transaction.mockImplementation(async (callback) =>
        callback({
          insert: txInsert,
          update: txUpdate
        })
      );

      const { acceptInvitation } = await importInvitations();
      await expect(
        acceptInvitation('token-1', 'user-1', 'user@acme.com')
      ).resolves.toEqual({ ok: true, organizationSlug: 'acme' });
      expect(txInsert).toHaveBeenCalledTimes(1);
      expect(txUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('checkIfCanInvite', () => {
    it('returns false when user is already a member', async () => {
      const txSelectQueue = [[{ id: 'membership-1' }], []];
      const tx = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              where: vi.fn(() => ({
                limit: vi.fn(async () => txSelectQueue.shift() ?? [])
              }))
            })),
            where: vi.fn(() => ({
              limit: vi.fn(async () => txSelectQueue.shift() ?? [])
            }))
          }))
        }))
      };
      mockDb.transaction.mockImplementation(async (callback) => callback(tx));

      const { checkIfCanInvite } = await importInvitations();
      await expect(checkIfCanInvite('member@acme.com', 'org-1')).resolves.toBe(
        false
      );
    });

    it('returns true when email has no membership and no pending invitation', async () => {
      const txSelectQueue = [[], []];
      const tx = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              where: vi.fn(() => ({
                limit: vi.fn(async () => txSelectQueue.shift() ?? [])
              }))
            })),
            where: vi.fn(() => ({
              limit: vi.fn(async () => txSelectQueue.shift() ?? [])
            }))
          }))
        }))
      };
      mockDb.transaction.mockImplementation(async (callback) => callback(tx));

      const { checkIfCanInvite } = await importInvitations();
      await expect(checkIfCanInvite('new@acme.com', 'org-1')).resolves.toBe(
        true
      );
    });
  });

  describe('createInvitation', () => {
    it('revokes old pending invitations and creates a new one', async () => {
      const txUpdateWhere = vi.fn().mockResolvedValue(undefined);
      const txUpdateSet = vi.fn().mockReturnValue({ where: txUpdateWhere });
      const txUpdate = vi.fn().mockReturnValue({ set: txUpdateSet });

      const txReturning = vi
        .fn()
        .mockResolvedValue([{ id: 'inv-2', token: 't-2' }]);
      const txInsertValues = vi
        .fn()
        .mockReturnValue({ returning: txReturning });
      const txInsert = vi.fn().mockReturnValue({ values: txInsertValues });

      mockDb.transaction.mockImplementation(async (callback) =>
        callback({
          update: txUpdate,
          insert: txInsert
        })
      );

      const { createInvitation } = await importInvitations();
      await expect(
        createInvitation('new@acme.com', Role.MEMBER, 'org-1')
      ).resolves.toEqual({ id: 'inv-2', token: 't-2' });
      expect(txUpdate).toHaveBeenCalledTimes(1);
      expect(txInsert).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendInvitationRequest', () => {
    it('sends invitation email and updates lastSentAt', async () => {
      const updateWhere = vi.fn().mockResolvedValue(undefined);
      const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
      mockDb.update.mockReturnValue({ set: updateSet });
      mockSendInvitationEmail.mockResolvedValue(undefined);

      const { sendInvitationRequest } = await importInvitations();
      await sendInvitationRequest({
        email: 'new@acme.com',
        organizationName: 'Acme',
        invitedByEmail: 'admin@acme.com',
        invitedByName: 'Admin',
        token: 'token-1',
        invitationId: 'inv-1',
        organizationId: 'org-1'
      });

      expect(mockSendInvitationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: 'new@acme.com',
          inviteLink: 'https://dashboard.local/invitations/request/token-1'
        })
      );
      expect(mockDb.update).toHaveBeenCalledTimes(1);
      expect(updateWhere).toHaveBeenCalledTimes(1);
    });
  });
});
