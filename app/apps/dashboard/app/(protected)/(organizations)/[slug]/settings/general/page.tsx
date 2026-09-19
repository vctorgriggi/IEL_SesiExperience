import { notFound, redirect } from 'next/navigation';
import { SettingsPageHeader } from '@/components/settings/layout/settings-page-header';
import { GeneralOrganizationForm } from '@/components/settings/organization/general-organization-form';
import { getCurrentMembership } from '@/features/members/data/get-current-membership';
import { can } from '@/features/members/permissions';
import { getOrganizationDetails } from '@/features/organizations/data/get-organization-details';

import { getAuthOrganizationContext } from '@workspace/auth/context';
import { routes } from '@workspace/routes';
import { Separator } from '@workspace/ui';

export default async function GeneralOrganizationSettingsPage() {
  const ctx = await getAuthOrganizationContext();
  const slug = ctx.organization.slug;
  const membership = await getCurrentMembership();
  if (!membership || !can(membership).updateOrgSettings) {
    redirect(routes.dashboard.org(slug).settings.profile);
  }
  const details = await getOrganizationDetails(slug);
  if (!details) notFound();

  const defaultValues = {
    name: details.name,
    address: details.address ?? '',
    phone: details.phone ?? '',
    email: details.email ?? '',
    website: details.website ?? ''
  };

  return (
    <div className="max-w-2xl">
      <SettingsPageHeader
        title="Geral"
        description="Informações básicas da organização. Visíveis para membros com acesso."
      />
      <Separator className="my-6" />
      <GeneralOrganizationForm
        defaultValues={defaultValues}
        slug={slug}
      />
    </div>
  );
}
