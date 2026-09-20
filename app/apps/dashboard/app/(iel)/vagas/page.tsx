import type { Metadata } from 'next';
import { JobsScreen } from '@/components/iel-demo/jobs/jobs-screen';

export const metadata: Metadata = { title: 'Vagas' };

export default function IelJobsPage() {
  return <JobsScreen />;
}
