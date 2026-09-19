import 'server-only';

import { getAuthContext } from '@workspace/auth/context';
import {
  and,
  db,
  eq,
  membershipTable,
  organizationTable
} from '@workspace/database';

export type ActiveDashboardOrganization = {
  id: string;
  slug: string;
};

export async function getActiveOrganization(
  organizationSlug?: string | null
): Promise<ActiveDashboardOrganization | null> {
  const { session } = await getAuthContext();
  const activeOrganizationSlug = organizationSlug ?? null;

  if (!activeOrganizationSlug) {
    return null;
  }

  const [organization] = await db
    .select({
      id: organizationTable.id,
      slug: organizationTable.slug
    })
    .from(organizationTable)
    .innerJoin(
      membershipTable,
      and(
        eq(membershipTable.organizationId, organizationTable.id),
        eq(membershipTable.userId, session.user.id)
      )
    )
    .where(eq(organizationTable.slug, activeOrganizationSlug))
    .limit(1);

  return organization ?? null;
}
