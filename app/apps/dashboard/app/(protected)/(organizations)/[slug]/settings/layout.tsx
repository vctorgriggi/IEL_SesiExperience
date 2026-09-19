import type { PropsWithChildren } from 'react';
import { DashboardPageLayout } from '@/components/dashboard/dashboard-page-layout';
import { SettingsNav } from '@/components/settings/layout/settings-nav';
import { getCurrentMembership } from '@/features/members/data/get-current-membership';
import { can } from '@/features/members/permissions';

import { getAuthOrganizationContext } from '@workspace/auth/context';
import { routes } from '@workspace/routes';

async function OrgSettingsLayoutInner({
  children,
  slug
}: PropsWithChildren<{ slug: string }>) {
  const membership = await getCurrentMembership();
  const permissions = can(membership);

  const baseSettings = `/${slug}/settings`;
  const breadcrumb = [
    {
      label: 'Início',
      href: routes.dashboard.org(slug).home
    },
    { label: 'Configurações' }
  ];

  return (
    <DashboardPageLayout
      title="Configurações"
      breadcrumb={breadcrumb}
    >
      <div className="flex flex-col gap-6 md:flex-row">
        <SettingsNav
          baseSettings={baseSettings}
          showOrganizationNav={permissions.updateOrgSettings}
        />
        <div className="min-w-0 flex-1 pt-1">{children}</div>
      </div>
    </DashboardPageLayout>
  );
}

export default async function OrgSettingsLayout({
  children
}: PropsWithChildren) {
  const ctx = await getAuthOrganizationContext();
  const slug = ctx.organization.slug;
  return (
    <OrgSettingsLayoutInner slug={slug}>{children}</OrgSettingsLayoutInner>
  );
}
