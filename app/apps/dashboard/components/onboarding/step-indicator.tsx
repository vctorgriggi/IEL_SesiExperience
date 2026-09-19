'use client';

import type { OnboardingStep } from '@/features/onboarding/schemas/complete-onboarding-schema';

import { cn } from '@workspace/ui';

import { Step } from './step';

export type StepIndicatorProps = React.HTMLAttributes<HTMLDivElement> & {
  steps: OnboardingStep[];
  currentStep: OnboardingStep;
  setCurrentStep: (value: OnboardingStep) => void;
};

export function StepIndicator({
  steps,
  currentStep,
  setCurrentStep,
  className,
  ...other
}: StepIndicatorProps): React.ReactElement {
  const currentStepIndex = steps.indexOf(currentStep);
  return (
    <div
      className={cn('flex flex-row gap-2', className)}
      {...other}
    >
      {steps.map((step, stepIndex) => {
        const active = stepIndex <= currentStepIndex;
        const disabled = !active || stepIndex === currentStepIndex;
        return (
          <Step
            key={stepIndex}
            step={step}
            active={active}
            disabled={disabled}
            setCurrentStep={setCurrentStep}
          />
        );
      })}
    </div>
  );
}
