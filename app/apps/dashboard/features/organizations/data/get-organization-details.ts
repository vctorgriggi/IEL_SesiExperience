import 'server-only';

import type { OrganizationDetails } from '@/features/organizations/types';

import { dedupedAuth } from '@workspace/auth';
import { checkSession } from '@workspace/auth/session';
import {
  and,
  db,
  eq,
  membershipTable,
  organizationTable
} from '@workspace/database';

/** Detalhes da organização por slug (requer ser membro). Usado em RSC. */
export async function getOrganizationDetails(
  slug: string
): Promise<OrganizationDetails | null> {
  const session = await dedupedAuth();
  if (!checkSession(session)) return null;

  const [row] = await db
    .select({
      name: organizationTable.name,
      address: organizationTable.address,
      phone: organizationTable.phone,
      email: organizationTable.email,
      website: organizationTable.website,
      logo: organizationTable.logo
    })
    .from(organizationTable)
    .innerJoin(
      membershipTable,
      and(
        eq(membershipTable.organizationId, organizationTable.id),
        eq(membershipTable.userId, session.user.id)
      )
    )
    .where(eq(organizationTable.slug, slug.trim()))
    .limit(1);

  if (!row) return null;

  return {
    name: row.name,
    address: row.address ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    website: row.website ?? null,
    logo: row.logo ?? null
  };
}
