import 'server-only';

import type { UserOrganization } from '@/features/organizations/types';

import {
  db,
  eq,
  membershipTable,
  organizationTable
} from '@workspace/database';

/**
 * Query: organizações de um usuário por ID (role + isOwner por org).
 * Usado pela API GET /api/users/me/organizations e por getUserOrganizations (RSC).
 */
export async function getOrganizationsByUserId(
  userId: string
): Promise<UserOrganization[]> {
  const rows = await db
    .select({
      id: organizationTable.id,
      name: organizationTable.name,
      slug: organizationTable.slug,
      logo: organizationTable.logo,
      role: membershipTable.role,
      isOwner: membershipTable.isOwner
    })
    .from(membershipTable)
    .innerJoin(
      organizationTable,
      eq(organizationTable.id, membershipTable.organizationId)
    )
    .where(eq(membershipTable.userId, userId));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo: row.logo ?? undefined,
    role: row.role,
    isOwner: row.isOwner
  }));
}
