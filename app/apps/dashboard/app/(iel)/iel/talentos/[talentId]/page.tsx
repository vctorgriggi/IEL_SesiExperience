import { Suspense } from 'react';
import { TalentProfileScreen } from '@/components/iel-demo/talents/talent-profile-screen';

import { Skeleton } from '@workspace/ui';

type PageProps = {
  params: Promise<{ talentId: string }>;
};

export default async function IelTalentProfilePage({ params }: PageProps) {
  const { talentId } = await params;
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <TalentProfileScreen talentId={talentId} />
    </Suspense>
  );
}
