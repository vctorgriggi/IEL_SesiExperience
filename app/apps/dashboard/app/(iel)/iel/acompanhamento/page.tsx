import type { Metadata } from 'next';
import { AcompanhamentoScreen } from '@/components/iel-demo/acompanhamento/acompanhamento-screen';

export const metadata: Metadata = { title: 'Acompanhamento' };

export default function IelFollowUpPage() {
  return <AcompanhamentoScreen />;
}
