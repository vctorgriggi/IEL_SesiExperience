import type { Metadata } from 'next';
import { ReferralsScreen } from '@/components/iel-demo/referrals/referrals-screens';

export const metadata: Metadata = { title: 'Encaminhamentos' };

export default function IelReferralsPage() {
  return <ReferralsScreen />;
}
