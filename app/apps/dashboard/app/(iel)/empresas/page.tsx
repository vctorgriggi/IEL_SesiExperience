import type { Metadata } from 'next';
import { CompaniesScreen } from '@/components/iel-demo/companies/companies-screens';

export const metadata: Metadata = { title: 'Empresas' };

export default function IelCompaniesPage() {
  return <CompaniesScreen />;
}
