import type { Metadata } from 'next';
import { CompanyDetailScreen } from '@/components/iel-demo/companies/companies-screens';

export const metadata: Metadata = { title: 'Empresa' };

type PageProps = {
  params: Promise<{ companyId: string }>;
};

export default async function IelCompanyDetailPage({ params }: PageProps) {
  const { companyId } = await params;
  return <CompanyDetailScreen companyId={companyId} />;
}
