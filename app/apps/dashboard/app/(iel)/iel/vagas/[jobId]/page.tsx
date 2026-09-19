import { JobScreen } from '@/components/iel-demo/selection/job-screen';

type PageProps = {
  params: Promise<{ jobId: string }>;
};

export default async function IelJobPage({ params }: PageProps) {
  const { jobId } = await params;
  return <JobScreen jobId={jobId} />;
}
