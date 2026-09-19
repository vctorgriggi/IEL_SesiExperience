import 'server-only';

import { cache } from 'react';
import { getMembersForOrganization } from '@/features/members/data/get-members-for-organization';
import type { Member } from '@/features/members/types';
import { getOrganizationSlug } from '@/features/organizations/routing/get-organization-slug-server';

import { getAuthContext } from '@workspace/auth/context';

async function getCurrentMembershipImpl(): Promise<Member | null> {
  const slug = await getOrganizationSlug();
  if (!slug) return null;

  try {
    const [ctx, members] = await Promise.all([
      getAuthContext(),
      getMembersForOrganization(slug)
    ]);
    const userId = ctx.session?.user?.id;
    if (!userId) return null;
    return members.find((m) => m.userId === userId) ?? null;
  } catch {
    return null;
  }
}

export const getCurrentMembership = cache(getCurrentMembershipImpl);
