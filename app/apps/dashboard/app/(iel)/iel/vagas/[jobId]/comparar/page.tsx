import { ComparisonScreen } from '@/components/iel-demo/selection/comparison-screen';

type PageProps = {
  params: Promise<{ jobId: string }>;
};

export default async function IelComparisonPage({ params }: PageProps) {
  const { jobId } = await params;
  return <ComparisonScreen jobId={jobId} />;
}
