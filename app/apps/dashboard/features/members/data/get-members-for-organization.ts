import 'server-only';

import type { Member } from '@/features/members/types';

import { dedupedAuth } from '@workspace/auth';
import { checkSession } from '@workspace/auth/session';
import {
  and,
  db,
  eq,
  membershipTable,
  organizationTable,
  userTable
} from '@workspace/database';

/**
 * Lista membros da organização. Server-only; exige sessão e que o usuário
 * seja membro da organização (evita vazamento de dados).
 */
export async function getMembersForOrganization(
  organizationSlug: string
): Promise<Member[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    throw new Error('Unauthorized');
  }

  const slug = organizationSlug.trim();
  if (!slug) {
    throw new Error('Missing organization slug');
  }

  const [org] = await db
    .select({ id: organizationTable.id })
    .from(organizationTable)
    .innerJoin(
      membershipTable,
      and(
        eq(membershipTable.organizationId, organizationTable.id),
        eq(membershipTable.userId, session.user.id)
      )
    )
    .where(eq(organizationTable.slug, slug))
    .limit(1);

  if (!org) {
    throw new Error('Organization not found or access denied');
  }

  const rows = await db
    .select({
      id: membershipTable.id,
      userId: membershipTable.userId,
      role: membershipTable.role,
      isOwner: membershipTable.isOwner,
      name: userTable.name,
      email: userTable.email
    })
    .from(membershipTable)
    .innerJoin(userTable, eq(membershipTable.userId, userTable.id))
    .where(eq(membershipTable.organizationId, org.id));

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    role: row.role,
    isOwner: row.isOwner,
    name: row.name ?? '',
    email: row.email ?? ''
  }));
}
