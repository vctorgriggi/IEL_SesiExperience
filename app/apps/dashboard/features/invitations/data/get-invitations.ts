import 'server-only';

import type { Invitation } from '@/features/invitations/types';

import { getAuthOrganizationContext } from '@workspace/auth/context';
import { db, eq, invitationTable } from '@workspace/database';

export async function getInvitations(): Promise<Invitation[]> {
  const { organization } = await getAuthOrganizationContext();

  const rows = await db
    .select({
      id: invitationTable.id,
      email: invitationTable.email,
      role: invitationTable.role,
      status: invitationTable.status,
      lastSentAt: invitationTable.lastSentAt
    })
    .from(invitationTable)
    .where(eq(invitationTable.organizationId, organization.id));

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    status: row.status,
    lastSentAt: row.lastSentAt?.toISOString() ?? null
  }));
}
