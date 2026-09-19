import type { Metadata } from 'next';
import { BiScreen } from '@/components/iel-demo/metricas/bi-screen';

export const metadata: Metadata = { title: 'BI' };

export default function IelBiPage() {
  return <BiScreen />;
}
