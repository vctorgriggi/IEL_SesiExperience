import type { Metadata } from 'next';
import { ReferralDetailScreen } from '@/components/iel-demo/referrals/referrals-screens';

export const metadata: Metadata = { title: 'Encaminhamento' };

type PageProps = {
  params: Promise<{ referralId: string }>;
};

export default async function IelReferralDetailPage({ params }: PageProps) {
  const { referralId } = await params;
  return <ReferralDetailScreen referralId={referralId} />;
}
