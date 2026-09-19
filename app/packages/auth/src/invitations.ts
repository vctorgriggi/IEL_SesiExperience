import { APP_NAME } from '@workspace/common/app';
import { and, db, eq } from '@workspace/database';
import {
  InvitationStatus,
  invitationTable,
  membershipTable,
  organizationTable,
  Role,
  userTable
} from '@workspace/database/schema';
import { sendInvitationEmail } from '@workspace/email/send-invitation-email';
import { routeUrls } from '@workspace/routes';

export type AcceptInvitationResult =
  | { ok: true; organizationSlug: string }
  | {
      ok: false;
      reason: 'invalid' | 'revoked' | 'already_accepted' | 'email_mismatch';
    };

/**
 * Aceita um convite: cria membership e marca invitation como ACCEPTED.
 * Exige que o email da sessão coincida com o email do convite.
 */
export async function acceptInvitation(
  token: string,
  userId: string,
  userEmail: string
): Promise<AcceptInvitationResult> {
  const trimmedToken = token?.trim();
  if (!trimmedToken) {
    return { ok: false, reason: 'invalid' };
  }

  const [invitation] = await db
    .select({
      id: invitationTable.id,
      organizationId: invitationTable.organizationId,
      email: invitationTable.email,
      role: invitationTable.role,
      status: invitationTable.status
    })
    .from(invitationTable)
    .where(eq(invitationTable.token, trimmedToken))
    .limit(1);

  if (!invitation) {
    return { ok: false, reason: 'invalid' };
  }

  if (invitation.status === InvitationStatus.REVOKED) {
    return { ok: false, reason: 'revoked' };
  }

  if (invitation.status === InvitationStatus.ACCEPTED) {
    const [org] = await db
      .select({ slug: organizationTable.slug })
      .from(organizationTable)
      .where(eq(organizationTable.id, invitation.organizationId))
      .limit(1);
    return org
      ? { ok: true, organizationSlug: org.slug }
      : { ok: false, reason: 'invalid' };
  }

  if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
    return { ok: false, reason: 'email_mismatch' };
  }

  const [org] = await db
    .select({ slug: organizationTable.slug })
    .from(organizationTable)
    .where(eq(organizationTable.id, invitation.organizationId))
    .limit(1);

  if (!org) {
    return { ok: false, reason: 'invalid' };
  }

  const [existingMembership] = await db
    .select()
    .from(membershipTable)
    .where(
      and(
        eq(membershipTable.organizationId, invitation.organizationId),
        eq(membershipTable.userId, userId)
      )
    )
    .limit(1);

  await db.transaction(async (tx) => {
    if (!existingMembership) {
      await tx.insert(membershipTable).values({
        organizationId: invitation.organizationId,
        userId,
        role: invitation.role,
        isOwner: false
      });
    }
    await tx
      .update(invitationTable)
      .set({
        status: InvitationStatus.ACCEPTED,
        updatedAt: new Date()
      })
      .where(eq(invitationTable.id, invitation.id));
  });

  return { ok: true, organizationSlug: org.slug };
}

export async function checkIfCanInvite(
  email: string,
  organizationId: string
): Promise<boolean> {
  return await db.transaction(async (tx) => {
    const [existingMembership] = await tx
      .select()
      .from(membershipTable)
      .innerJoin(userTable, eq(membershipTable.userId, userTable.id))
      .where(
        and(
          eq(membershipTable.organizationId, organizationId),
          eq(userTable.email, email)
        )
      )
      .limit(1);

    const [pendingInvitation] = await tx
      .select()
      .from(invitationTable)
      .where(
        and(
          eq(invitationTable.organizationId, organizationId),
          eq(invitationTable.email, email),
          eq(invitationTable.status, InvitationStatus.PENDING)
        )
      )
      .limit(1);

    return !existingMembership && !pendingInvitation;
  });
}

export async function createInvitation(
  email: string,
  role: Role,
  organizationId: string
) {
  return await db.transaction(async (tx) => {
    // revoke old invitations
    await tx
      .update(invitationTable)
      .set({ status: InvitationStatus.REVOKED })
      .where(
        and(
          eq(invitationTable.organizationId, organizationId),
          eq(invitationTable.email, email),
          eq(invitationTable.status, InvitationStatus.PENDING)
        )
      );

    const [newInvitation] = await tx
      .insert(invitationTable)
      .values({
        email: email,
        role: role,
        organizationId: organizationId,
        lastSentAt: new Date()
      })
      .returning();

    return newInvitation;
  });
}

type SendInvitationParams = {
  email: string;
  organizationName: string;
  invitedByEmail: string;
  invitedByName: string;
  token: string;
  invitationId: string;
  organizationId: string;
};

export async function sendInvitationRequest({
  email,
  organizationName,
  invitedByEmail,
  invitedByName,
  token,
  invitationId,
  organizationId
}: SendInvitationParams): Promise<void> {
  await sendInvitationEmail({
    recipient: email,
    appName: APP_NAME,
    organizationName,
    invitedByEmail,
    invitedByName,
    inviteLink: routeUrls.dashboard.invitations.request(token)
  });
  await db
    .update(invitationTable)
    .set({ lastSentAt: new Date() })
    .where(
      and(
        eq(invitationTable.id, invitationId),
        eq(invitationTable.organizationId, organizationId)
      )
    );
}
