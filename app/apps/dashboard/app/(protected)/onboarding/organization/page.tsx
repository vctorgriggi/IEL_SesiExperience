import Link from 'next/link';
import { redirect } from 'next/navigation';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';
import { OnboardingStep } from '@/features/onboarding/schemas/complete-onboarding-schema';

import { getAuthContext } from '@workspace/auth/context';
import { routes } from '@workspace/routes';

const ACTIVE_STEPS: OnboardingStep[] = [OnboardingStep.Organization];

export default async function OnboardingOrganizationPage() {
  const { session } = await getAuthContext();

  const completedOnboarding = (
    session?.user as { completedOnboarding?: boolean } | undefined
  )?.completedOnboarding;
  if (!completedOnboarding) {
    redirect(routes.dashboard.onboarding.index);
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
      <div className="mb-6">
        <Link
          href={routes.dashboard.index}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Voltar às organizações
        </Link>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight mb-2">
        Nova organização
      </h1>
      <p className="text-muted-foreground mb-8">
        Crie mais uma organização para gerenciar.
      </p>
      <OnboardingWizard
        activeSteps={ACTIVE_STEPS}
        metadata={metadata}
      />
    </div>
  );
}
