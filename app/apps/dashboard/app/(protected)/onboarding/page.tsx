import { redirect } from 'next/navigation';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';
import { OnboardingStep } from '@/features/onboarding/schemas/complete-onboarding-schema';

import { getAuthContext } from '@workspace/auth/context';
import { routes } from '@workspace/routes';

const ACTIVE_STEPS: OnboardingStep[] = [OnboardingStep.Organization];

export default async function OnboardingIndexPage() {
  const { session } = await getAuthContext();

  const completedOnboarding = (
    session?.user as { completedOnboarding?: boolean } | undefined
  )?.completedOnboarding;
  if (completedOnboarding) {
    redirect(routes.dashboard.index);
  }

  const memberships =
    (session?.user as { memberships?: unknown[] } | undefined)?.memberships ??
    [];
  const hasMemberships = Array.isArray(memberships) && memberships.length > 0;
  if (hasMemberships) {
    redirect(routes.dashboard.onboarding.user);
  }

  const metadata = {
    user: session?.user
      ? {
          name: session.user.name ?? undefined,
          email: session.user.email ?? undefined
        }
      : undefined,
    organization: undefined
  };

  return (
    <div className="container max-w-xl py-12">
      <h1 className="text-2xl font-semibold tracking-tight mb-2">
        Configurar sua organização
      </h1>
      <p className="text-muted-foreground mb-8">
        Crie sua primeira organização para começar.
      </p>
      <OnboardingWizard
        activeSteps={ACTIVE_STEPS}
        metadata={metadata}
      />
    </div>
  );
}
