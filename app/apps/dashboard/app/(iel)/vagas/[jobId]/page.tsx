import type { Metadata } from 'next';
import { JobScreen } from '@/components/iel-demo/selection/job-screen';

export const metadata: Metadata = { title: 'Vaga' };

type PageProps = {
  params: Promise<{ jobId: string }>;
};

export default async function IelJobPage({ params }: PageProps) {
  const { jobId } = await params;
  return <JobScreen jobId={jobId} />;
}
