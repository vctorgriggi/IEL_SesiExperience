import type { Metadata } from 'next';
import { CandidatosScreen } from '@/components/iel-demo/metricas/candidatos-screen';

export const metadata: Metadata = { title: 'Candidatos' };

export default function IelCandidatosPage() {
  return <CandidatosScreen />;
}
