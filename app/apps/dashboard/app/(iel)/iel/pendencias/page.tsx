import type { Metadata } from 'next';
import { ClarificationsScreen } from '@/components/iel-demo/clarifications/clarifications-screen';

export const metadata: Metadata = { title: 'Perguntas' };

export default function IelClarificationsPage() {
  return <ClarificationsScreen />;
}
