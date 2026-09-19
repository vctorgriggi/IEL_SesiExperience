'use client';

import { useRouter } from 'next/navigation';
import { sendInvitation } from '@/features/invitations/actions';
import {
  inviteMemberSchema,
  type InviteMemberFormData
} from '@/features/invitations/schemas/invite-member-schema';
import { useZodForm } from '@/hooks/use-zod-form';
import { runSafeAction } from '@/lib/run-safe-action';
import { Controller } from 'react-hook-form';

import { Button, Input, Select, toast } from '@workspace/ui';

const ROLE_OPTIONS = [
  { value: 'member' as const, label: 'Membro' },
  { value: 'admin' as const, label: 'Admin' }
];

export function InviteMemberForm() {
  const router = useRouter();

  const form = useZodForm({
    schema: inviteMemberSchema,
    defaultValues: { email: '', role: 'member' }
  });

  const onSubmit = async (data: InviteMemberFormData) => {
    try {
      await runSafeAction(
        sendInvitation({
          email: data.email,
          role: data.role
        })
      );
      toast.success('Convite enviado com sucesso');
      form.reset({ email: '', role: 'member' });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao convidar');
    }
  };

  return (
    <>
      <h3 className="text-sm font-medium text-muted-foreground">
        Convidar membro
      </h3>
      <p className="text-sm text-muted-foreground">
        Envie um convite por email. O usuário poderá entrar na organização após
        aceitar.
      </p>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-md space-y-5"
      >
        <Input
          id="invite-email"
          label="Email"
          type="email"
          placeholder="email@exemplo.com"
          error={form.formState.errors.email?.message}
          {...form.register('email')}
        />
        <Controller
          name="role"
          control={form.control}
          render={({ field }) => (
            <Select
              id="invite-role"
              label="Função"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              options={ROLE_OPTIONS}
              placeholder="Selecione a função"
              error={form.formState.errors.role?.message}
            />
          )}
        />
        <Button
          type="submit"
          loading={form.formState.isSubmitting}
        >
          Enviar convite
        </Button>
      </form>
    </>
  );
}
