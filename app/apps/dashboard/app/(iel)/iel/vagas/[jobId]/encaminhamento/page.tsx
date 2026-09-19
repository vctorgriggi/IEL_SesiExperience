import { ReferralPreparationScreen } from '@/components/iel-demo/referrals/referral-preparation-screen';

type PageProps = {
  params: Promise<{ jobId: string }>;
};

export default async function IelReferralPreparationPage({
  params
}: PageProps) {
  const { jobId } = await params;
  return <ReferralPreparationScreen jobId={jobId} />;
}
