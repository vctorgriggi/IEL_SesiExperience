import { SelectionDesk } from '@/components/iel-demo/selection/selection-desk';

type PageProps = {
  params: Promise<{ jobId: string }>;
};

export default async function IelSelectionDeskPage({ params }: PageProps) {
  const { jobId } = await params;
  return <SelectionDesk jobId={jobId} />;
}
