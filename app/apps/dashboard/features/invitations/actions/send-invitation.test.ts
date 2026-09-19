import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ForbiddenError, PreConditionError } from '@workspace/common/errors';

import { sendInvitation } from './send-invitation';

const {
  mockRevalidatePath,
  mockGetCurrentMembership,
  mockGetActivePlan,
  mockCanUseFeature,
  mockCheckIfCanInvite,
  mockCreateInvitation,
  mockSendInvitationRequest,
  mockCtx
} = vi.hoisted(() => ({
  mockRevalidatePath: vi.fn(),
  mockGetCurrentMembership: vi.fn(),
  mockGetActivePlan: vi.fn(),
  mockCanUseFeature: vi.fn(),
  mockCheckIfCanInvite: vi.fn(),
  mockCreateInvitation: vi.fn(),
  mockSendInvitationRequest: vi.fn(),
  mockCtx: {
    session: {
      user: {
        id: 'user-1',
        email: 'admin@acme.com',
        name: 'Admin'
      }
    },
    organization: {
      id: 'org-1',
      name: 'Acme',
      slug: 'acme'
    }
  }
}));

function createMockActionClient<TCtx>(getCtx: () => TCtx) {
  return {
    metadata() {
      return this;
    },
    inputSchema() {
      return this;
    },
    action<TInput, TOutput>(
      handler: (args: {
        parsedInput: TInput;
        ctx: TCtx;
      }) => Promise<TOutput> | TOutput
    ) {
      return async (input: TInput) => ({
        data: await handler({ parsedInput: input, ctx: getCtx() })
      });
    }
  };
}

vi.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath
}));

vi.mock('@/actions/safe-action', () => ({
  authOrganizationActionClient: createMockActionClient(() => mockCtx)
}));

vi.mock('@/features/members/data/get-current-membership', () => ({
  getCurrentMembership: mockGetCurrentMembership
}));

vi.mock('@/features/billing/data/get-active-plan', () => ({
  getActivePlan: mockGetActivePlan
}));

vi.mock('@workspace/billing', () => ({
  canUseFeature: mockCanUseFeature
}));

vi.mock('@workspace/auth/invitations', () => ({
  checkIfCanInvite: mockCheckIfCanInvite,
  createInvitation: mockCreateInvitation,
  sendInvitationRequest: mockSendInvitationRequest
}));

describe('sendInvitation action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentMembership.mockResolvedValue({
      id: 'm-1',
      userId: 'user-1',
      role: 'admin',
      isOwner: false,
      name: 'Admin',
      email: 'admin@acme.com'
    });
    mockGetActivePlan.mockReturnValue('pro');
    mockCanUseFeature.mockReturnValue(true);
    mockCheckIfCanInvite.mockResolvedValue(true);
    mockCreateInvitation.mockResolvedValue({ id: 'inv-1', token: 'token-1' });
    mockSendInvitationRequest.mockResolvedValue(undefined);
  });

  it('throws ForbiddenError when user is not admin', async () => {
    mockGetCurrentMembership.mockResolvedValue({
      id: 'm-1',
      userId: 'user-1',
      role: 'member',
      isOwner: false,
      name: 'Member',
      email: 'member@acme.com'
    });

    await expect(
      sendInvitation({ email: 'new@acme.com', role: 'member' })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('throws PreConditionError when plan cannot invite members', async () => {
    mockCanUseFeature.mockReturnValue(false);

    await expect(
      sendInvitation({ email: 'new@acme.com', role: 'member' })
    ).rejects.toBeInstanceOf(PreConditionError);
  });

  it('throws PreConditionError when email already has access or pending invite', async () => {
    mockCheckIfCanInvite.mockResolvedValue(false);

    await expect(
      sendInvitation({ email: 'existing@acme.com', role: 'member' })
    ).rejects.toBeInstanceOf(PreConditionError);
  });
});
