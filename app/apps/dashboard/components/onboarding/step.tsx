'use client';

import type { OnboardingStep } from '@/features/onboarding/schemas/complete-onboarding-schema';

import { cn } from '@workspace/ui';

export type StepProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  step: OnboardingStep;
  active: boolean;
  disabled: boolean;
  setCurrentStep: (value: OnboardingStep) => void;
};

export function Step({
  step,
  active,
  disabled,
  setCurrentStep,
  className,
  ...other
}: StepProps): React.ReactElement {
  const navigate = (): void => {
    setCurrentStep(step);
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  };
  return (
    <button
      type="button"
      tabIndex={-1}
      disabled={disabled}
      onClick={navigate}
      className={cn(
        'h-1 w-full rounded-[1px]',
        active ? 'bg-primary' : 'bg-muted',
        className
      )}
      {...other}
    />
  );
}
