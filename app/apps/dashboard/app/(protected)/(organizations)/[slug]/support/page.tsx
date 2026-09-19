import { DashboardPageLayout } from '@/components/dashboard/dashboard-page-layout';
import { SupportFaq } from '@/components/support/support-faq';

import { getAuthOrganizationContext } from '@workspace/auth/context';
import { routes } from '@workspace/routes';

export default async function SupportPage() {
  const ctx = await getAuthOrganizationContext();
  const slug = ctx.organization.slug;
  const breadcrumb = [
    {
      label: 'Início',
      href: routes.dashboard.org(slug).home
    },
    { label: 'Suporte' }
  ];

  return (
    <DashboardPageLayout
      title="Suporte"
      breadcrumb={breadcrumb}
    >
      <div className="space-y-6">
        <SupportFaq />
      </div>
    </DashboardPageLayout>
  );
}
