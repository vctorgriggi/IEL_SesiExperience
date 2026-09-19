'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SIGN_OUT_CALLBACK_URL } from '@/features/auth/constants';
import { completeOnboarding } from '@/features/onboarding/actions/complete-onboarding';
import { OnboardingStep } from '@/features/onboarding/schemas/complete-onboarding-schema';
import { runSafeAction } from '@/lib/run-safe-action';
import { signOut } from 'next-auth/react';

import { cn, toast } from '@workspace/ui';

import { OnboardingOrganizationStep } from './onboarding-organization-step';
import type { OnboardingMetadata } from './onboarding-step-props';
import { SignOutButton } from './sign-out-button';
import { StepIndicator } from './step-indicator';

export type OnboardingWizardProps = React.HTMLAttributes<HTMLDivElement> & {
  activeSteps: readonly OnboardingStep[];
  metadata: OnboardingMetadata;
};

const STEP_ORDER: OnboardingStep[] = [OnboardingStep.Organization];

export function OnboardingWizard({
  activeSteps,
  metadata,
  className,
  ...other
}: OnboardingWizardProps): React.ReactElement {
  const router = useRouter();
  const steps = STEP_ORDER.filter((s) =>
    (activeSteps as readonly string[]).includes(s)
  );
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    steps[0] ?? OnboardingStep.Organization
  );
  const [loading, setLoading] = useState(false);

  const handleOrganizationSubmit = async (data: {
    name: string;
    slug: string;
  }): Promise<void> => {
    try {
      setLoading(true);
      const result = await runSafeAction<{ redirect: string }>(
        completeOnboarding({
          activeSteps: [...steps],
          organizationStep: data
        }),
        {
          onUnauthorized: () =>
            signOut({ callbackUrl: SIGN_OUT_CALLBACK_URL, redirect: true })
        }
      );
      if (!result) {
        throw new Error('Falha ao concluir onboarding');
      }
      toast.success('Organização criada!');
      router.push(result.redirect);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao concluir');
    } finally {
      setLoading(false);
    }
  };

  if (steps.length === 0) {
    return (
      <div
        className={cn('space-y-6', className)}
        {...other}
      >
        <p className="text-muted-foreground">Nenhum passo configurado.</p>
      </div>
    );
  }

  const currentIndex = steps.indexOf(currentStep);
  const isLastStep = currentIndex >= steps.length - 1;

  return (
    <div
      className={cn('space-y-8', className)}
      {...other}
    >
      <div className="flex items-center justify-between gap-4">
        <StepIndicator
          steps={steps}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
        />
        <SignOutButton
          severity="secondary"
          text
          size="small"
        >
          Sair
        </SignOutButton>
      </div>

      {currentStep === OnboardingStep.Organization && (
        <OnboardingOrganizationStep
          metadata={metadata}
          canNext={true}
          loading={loading}
          isLastStep={isLastStep}
          handleNext={() => {}}
          onStepSubmit={handleOrganizationSubmit}
        />
      )}
    </div>
  );
}
