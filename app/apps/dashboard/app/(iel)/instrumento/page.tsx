import type { Metadata } from 'next';
import { InstrumentoScreen } from '@/components/iel-demo/instrumento/instrumento-screen';

export const metadata: Metadata = { title: 'Instrumento' };

export default function IelInstrumentoPage() {
  return <InstrumentoScreen />;
}
