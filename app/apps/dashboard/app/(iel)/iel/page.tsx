import type { Metadata } from 'next';
import { OverviewScreen } from '@/components/iel-demo/overview/overview-screen';

export const metadata: Metadata = { title: 'Hoje · Mind RH' };

export default function IelOverviewPage() {
  return <OverviewScreen />;
}
