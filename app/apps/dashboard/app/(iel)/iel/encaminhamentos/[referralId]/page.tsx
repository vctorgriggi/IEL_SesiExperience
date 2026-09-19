import { ReferralDetailScreen } from '@/components/iel-demo/referrals/referrals-screens';

type PageProps = {
  params: Promise<{ referralId: string }>;
};

export default async function IelReferralDetailPage({ params }: PageProps) {
  const { referralId } = await params;
  return <ReferralDetailScreen referralId={referralId} />;
}
