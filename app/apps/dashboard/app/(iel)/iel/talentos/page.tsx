import type { Metadata } from 'next';
import { TalentsScreen } from '@/components/iel-demo/talents/talents-screen';

export const metadata: Metadata = { title: 'Banco de talentos' };

export default function IelTalentsPage() {
  return <TalentsScreen />;
}
