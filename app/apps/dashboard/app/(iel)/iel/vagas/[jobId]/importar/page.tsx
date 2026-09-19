import type { Metadata } from 'next';
import { ImportScreen } from '@/components/iel-demo/import/import-screen';

export const metadata: Metadata = { title: 'Importar planilha' };

type PageProps = {
  params: Promise<{ jobId: string }>;
};

export default async function IelImportSpreadsheetPage({ params }: PageProps) {
  const { jobId } = await params;
  return <ImportScreen jobId={jobId} />;
}
