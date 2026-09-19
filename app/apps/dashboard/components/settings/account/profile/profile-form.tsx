'use client';

import { useRouter } from 'next/navigation';
import { updateProfile } from '@/features/account/actions';
import type { UpdateProfileInput } from '@/features/account/schemas/update-profile-schema';
import { useZodForm } from '@/hooks/use-zod-form';
import { firstValidationError, getErrorMessage } from '@/lib/get-error-message';
import { useAction } from 'next-safe-action/hooks';
import { z } from 'zod';

import { Button, Input, toast } from '@workspace/ui';

import { ProfileAvatarSection } from './profile-avatar-section';

const profileSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().optional()
});

type ProfileFormData = z.infer<typeof profileSchema>;

const PROFILE_FALLBACK = 'Erro ao atualizar perfil';

type ProfileFormProps = {
  defaultValues: ProfileFormData;
  userImage: string | null;
};

export function ProfileForm({ defaultValues, userImage }: ProfileFormProps) {
  const router = useRouter();
  const { execute, isExecuting } = useAction(updateProfile, {
    onSuccess: () => {
      toast.success('Perfil atualizado');
      router.refresh();
    },
    onError: ({ error }) => {
      const message =
        error.serverError ?? firstValidationError(error.validationErrors);
      toast.error(getErrorMessage(message, PROFILE_FALLBACK));
    }
  });

  const form = useZodForm({
    schema: profileSchema,
    defaultValues
  });

  const onSubmit = (data: ProfileFormData) => {
    const payload: UpdateProfileInput = {
      name: data.name,
      phone: data.phone || null
    };
    execute(payload);
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6"
    >
      <ProfileAvatarSection
        userImage={userImage}
        userName={defaultValues.name}
      />

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <h2 className="text-sm font-medium text-foreground">
            Informações pessoais
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Nome e telefone usados no dia a dia.
          </p>
        </div>

        <div className="space-y-3">
          <Input
            id="profile-name"
            label="Nome"
            placeholder="Seu nome"
            error={form.formState.errors.name?.message}
            {...form.register('name')}
          />
          <Input
            id="profile-phone"
            label="Telefone"
            placeholder="(00) 00000-0000"
            {...form.register('phone')}
          />
        </div>

        <Button
          type="submit"
          loading={form.formState.isSubmitting || isExecuting}
        >
          Salvar alterações
        </Button>
      </div>
    </form>
  );
}
