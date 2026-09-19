import {
  organizationNameSchema,
  organizationSlugSchema
} from '@/features/organizations/schemas/organization-fields';
import { z } from 'zod';

export const organizationOnboardingSchema = z.object({
  name: organizationNameSchema,
  slug: organizationSlugSchema
});

export const OnboardingStep = {
  Organization: 'organization'
} as const;

export type OnboardingStep =
  (typeof OnboardingStep)[keyof typeof OnboardingStep];

export const completeOnboardingSchema = z.object({
  activeSteps: z.array(z.literal(OnboardingStep.Organization)),
  organizationStep: organizationOnboardingSchema
});

export type CompleteOnboardingSchema = z.infer<typeof completeOnboardingSchema>;
