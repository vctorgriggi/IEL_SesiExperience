import { CompanyDetailScreen } from '@/components/iel-demo/companies/companies-screens';

type PageProps = {
  params: Promise<{ companyId: string }>;
};

export default async function IelCompanyDetailPage({ params }: PageProps) {
  const { companyId } = await params;
  return <CompanyDetailScreen companyId={companyId} />;
}
