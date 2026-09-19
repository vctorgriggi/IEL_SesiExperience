'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateOrganizationDetails } from '@/features/organizations/actions';
import {
  generalOrganizationFormSchema,
  type GeneralOrganizationFormData
} from '@/features/organizations/schemas/general-organization-form-schema';
import { useZodForm } from '@/hooks/use-zod-form';
import { runSafeAction } from '@/lib/run-safe-action';

import { Button, Input, toast } from '@workspace/ui';

type GeneralOrganizationFormProps = {
  defaultValues: GeneralOrganizationFormData;
  slug: string;
};

export function GeneralOrganizationForm({
  defaultValues,
  slug: _slug
}: GeneralOrganizationFormProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useZodForm({
    schema: generalOrganizationFormSchema,
    defaultValues
  });

  const onSubmit = async (data: GeneralOrganizationFormData) => {
    try {
      setIsUpdating(true);
      await runSafeAction(
        updateOrganizationDetails({
          name: data.name,
          address: data.address || null,
          phone: data.phone || null,
          email: data.email || null,
          website: data.website || null
        })
      );
      toast.success('Organização atualizada');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <h2 className="text-sm font-medium text-foreground">
            Detalhes da organização
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Nome, contato e endereço usados em convites e documentos.
          </p>
        </div>

        <div className="space-y-5">
          <Input
            id="org-name"
            label="Nome"
            placeholder="Nome da organização"
            error={form.formState.errors.name?.message}
            {...form.register('name')}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              id="org-phone"
              label="Telefone"
              placeholder="(00) 00000-0000"
              error={form.formState.errors.phone?.message}
              {...form.register('phone')}
            />
            <Input
              id="org-email"
              label="Email"
              type="email"
              placeholder="contato@exemplo.com"
              error={form.formState.errors.email?.message}
              {...form.register('email')}
            />
          </div>

          <Input
            id="org-address"
            label="Endereço"
            placeholder="Endereço"
            error={form.formState.errors.address?.message}
            {...form.register('address')}
          />

          <Input
            id="org-website"
            label="Website"
            placeholder="https://..."
            error={form.formState.errors.website?.message}
            {...form.register('website')}
          />
        </div>

        <Button
          type="submit"
          loading={form.formState.isSubmitting || isUpdating}
        >
          Salvar alterações
        </Button>
      </div>
    </form>
  );
}
