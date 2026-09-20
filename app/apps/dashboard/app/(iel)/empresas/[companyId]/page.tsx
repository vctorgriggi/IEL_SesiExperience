import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CompanyDetailScreen } from '@/components/iel-demo/companies/companies-screens';

import { Skeleton } from '@workspace/ui';

export const metadata: Metadata = { title: 'Empresa' };

type PageProps = {
  params: Promise<{ companyId: string }>;
};

/**
 * A tela lê `?aba=` (e `?vaga=` na aba do mapa) para abrir direto na aba que
 * o link pediu, então precisa do limite de suspensão que o `useSearchParams`
 * exige.
 */
export default async function IelCompanyDetailPage({ params }: PageProps) {
  const { companyId } = await params;
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <CompanyDetailScreen companyId={companyId} />
    </Suspense>
  );
}
