import type { Metadata } from 'next';
import { DataSourcesScreen } from '@/components/iel-demo/sources/data-sources-screen';

export const metadata: Metadata = { title: 'Integrações' };

export default function IelDataSourcesPage() {
  return <DataSourcesScreen />;
}
