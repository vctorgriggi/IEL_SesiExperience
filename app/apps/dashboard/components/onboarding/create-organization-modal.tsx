'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SIGN_OUT_CALLBACK_URL } from '@/features/auth/constants';
import { createOrganization } from '@/features/organizations/actions';
import { useZodForm } from '@/hooks/use-zod-form';
import { runSafeAction } from '@/lib/run-safe-action';
import { signOut } from 'next-auth/react';
import { z } from 'zod';

import { routes } from '@workspace/routes';
import { Button, Dialog, Input, toast } from '@workspace/ui';

const createOrgSchema = z.object({
  name: z.string().min(2, 'Name must have at least 2 characters')
});

type CreateOrgFormData = z.infer<typeof createOrgSchema>;

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

function buildOrganizationRedirect(slug: string): string {
  return `${routes.dashboard.select(slug)}?${new URLSearchParams({
    source: 'create'
  }).toString()}`;
}

function getCreateOrganizationErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Erro ao criar organização';
}

let openCreateOrganizationModalImpl: (() => void) | null = null;

export function openCreateOrganizationModal() {
  openCreateOrganizationModalImpl?.();
}

function CreateOrganizationModalContent({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const form = useZodForm({
    schema: createOrgSchema,
    defaultValues: { name: '' }
  });

  const onSubmit = async (data: CreateOrgFormData) => {
    try {
      setIsCreating(true);
      const organization = await runSafeAction<{
        id: string;
        name: string;
        slug: string;
      }>(
        createOrganization({
          name: data.name,
          slug: nameToSlug(data.name)
        }),
        {
          onUnauthorized: () =>
            signOut({ callbackUrl: SIGN_OUT_CALLBACK_URL, redirect: true })
        }
      );

      if (!organization) {
        throw new Error('Falha ao criar organização');
      }

      toast.success('Organização criada!');
      onClose();
      router.refresh();
      router.push(buildOrganizationRedirect(organization.slug));
    } catch (error) {
      toast.error(getCreateOrganizationErrorMessage(error));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-2">
        <label
          htmlFor="org-name"
          className="text-sm font-medium text-foreground"
        >
          Nome
        </label>
        <Input
          id="org-name"
          {...form.register('name')}
          placeholder="My Organization"
          className="h-11"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          outlined
          className="w-full sm:w-auto"
          onClick={onClose}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={form.formState.isSubmitting || isCreating}
          className="w-full sm:w-auto sm:min-w-[140px]"
        >
          Criar organização
        </Button>
      </div>
    </form>
  );
}

export function CreateOrganizationModalProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    openCreateOrganizationModalImpl = () => setVisible(true);
    return () => {
      openCreateOrganizationModalImpl = null;
    };
  }, []);

  return (
    <>
      {children}
      <Dialog
        visible={visible}
        onHide={() => setVisible(false)}
        header="Criar organização"
        style={{ width: '28rem', maxWidth: '90vw' }}
      >
        <div className="text-sm text-muted-foreground leading-relaxed mb-4">
          Crie sua organização para gerenciar eventos e equipes.
        </div>
        <CreateOrganizationModalContent onClose={() => setVisible(false)} />
      </Dialog>
    </>
  );
}
