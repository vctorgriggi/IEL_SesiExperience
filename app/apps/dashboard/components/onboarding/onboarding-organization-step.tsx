'use client';

import { useEffect } from 'react';
import { organizationOnboardingSchema } from '@/features/onboarding/schemas/complete-onboarding-schema';
import { useZodForm } from '@/hooks/use-zod-form';

import { Input, Label } from '@workspace/ui';

import type { OnboardingStepProps } from './onboarding-step-props';

function nameToSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50) || 'organization'
  );
}

export type OnboardingOrganizationStepData = { name: string; slug: string };

export type OnboardingOrganizationStepProps = OnboardingStepProps & {
  defaultName?: string;
  defaultSlug?: string;
  onStepSubmit: (data: OnboardingOrganizationStepData) => void;
};

export function OnboardingOrganizationStep({
  metadata,
  loading,
  isLastStep,
  defaultName = '',
  defaultSlug = '',
  onStepSubmit
}: OnboardingOrganizationStepProps): React.ReactElement {
  const form = useZodForm({
    schema: organizationOnboardingSchema,
    mode: 'onChange',
    defaultValues: {
      name: metadata?.organization?.name ?? defaultName,
      slug: metadata?.organization?.slug ?? defaultSlug
    }
  });

  useEffect(() => {
    const subscription = form.watch((value, { name: changed }) => {
      if (changed === 'name' && value.name) {
        form.setValue('slug', nameToSlug(value.name), { shouldValidate: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = (): void => {
    const data = form.getValues();
    const result = organizationOnboardingSchema.safeParse(data);
    if (result.success) {
      onStepSubmit(result.data);
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6"
    >
      <div className="space-y-2">
        <Label htmlFor="onboarding-org-name">Nome da organização</Label>
        <Input
          id="onboarding-org-name"
          {...form.register('name')}
          placeholder="Minha organização"
          className="h-11"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="onboarding-org-slug">Slug (URL)</Label>
        <Input
          id="onboarding-org-slug"
          {...form.register('slug')}
          placeholder="minha-organizacao"
          className="h-11 font-mono text-sm"
        />
        {form.formState.errors.slug && (
          <p className="text-sm text-destructive">
            {form.formState.errors.slug.message}
          </p>
        )}
      </div>
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading || !form.formState.isValid}
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isLastStep ? 'Concluir' : 'Próximo →'}
        </button>
      </div>
    </form>
  );
}
