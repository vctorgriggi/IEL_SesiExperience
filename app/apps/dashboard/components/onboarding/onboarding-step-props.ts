export type OnboardingMetadata = {
  user?: {
    name?: string;
    email?: string;
  };
  organization?: {
    name?: string;
    slug?: string;
  };
};

export type OnboardingStepProps = {
  metadata: OnboardingMetadata;
  canNext: boolean;
  loading: boolean;
  isLastStep: boolean;
  handleNext: () => void;
};
