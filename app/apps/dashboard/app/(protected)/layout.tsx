import type { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { ProtectedLayoutClient } from '@/components/layout/protected-layout-client';
import { getActivePlanByOrganizationId } from '@/features/billing/data/get-active-plan';
import { getCurrentMembership } from '@/features/members/data/get-current-membership';
import { can } from '@/features/members/permissions';
import { getUserOrganizations } from '@/features/organizations/data/get-user-organizations';
import { getOrganizationSlug } from '@/features/organizations/routing/get-organization-slug-server';
import { createTitle } from '@/lib/formatters';
import { shouldHideSidebar } from '@/lib/protected-layout';

import { getAuthContext } from '@workspace/auth/context';
import { canUseFeature } from '@workspace/billing';

export const metadata: Metadata = {
  title: createTitle('Painel')
};

export type PlanFeatures = {
  inviteMembers: boolean;
};

async function loadPlanFeatures(
  organizations: { id: string; slug: string }[],
  currentOrgSlug: string | null
): Promise<PlanFeatures> {
  const org = currentOrgSlug
    ? organizations.find((o) => o.slug === currentOrgSlug)
    : undefined;

  if (!org) {
    return { inviteMembers: false };
  }

  const planId = await getActivePlanByOrganizationId(org.id);

  return {
    inviteMembers: canUseFeature(planId, 'invite_members')
  };
}

function toLayoutUser(
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null
) {
  if (!user) return null;
  return {
    name: user.name ?? null,
    email: user.email ?? null,
    image: user.image ?? null
  };
}

export default async function ProtectedLayout({ children }: PropsWithChildren) {
  const [ctx, organizations, headerList, membership, currentOrgSlug] =
    await Promise.all([
      getAuthContext(),
      getUserOrganizations(),
      headers(),
      getCurrentMembership(),
      getOrganizationSlug()
    ]);

  const pathname = headerList.get('x-pathname') ?? null;
  const hideSidebar = shouldHideSidebar(pathname, currentOrgSlug);
  const permissions = can(membership);
  const planFeatures = await loadPlanFeatures(organizations, currentOrgSlug);
  const user = toLayoutUser(ctx.session?.user ?? null);

  return (
    <ProtectedLayoutClient
      currentOrgSlug={currentOrgSlug}
      organizations={organizations}
      hideSidebar={hideSidebar}
      permissions={permissions}
      planFeatures={planFeatures}
      user={user}
    >
      {children}
    </ProtectedLayoutClient>
  );
}
