import type { Metadata } from 'next';
import { TemasScreen } from '@/components/iel-demo/temas/temas-screen';

export const metadata: Metadata = { title: 'Temas' };

export default function IelTemasPage() {
  return <TemasScreen />;
}
