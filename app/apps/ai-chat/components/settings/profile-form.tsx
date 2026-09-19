'use client';

import { useState } from 'react';

import { Button, Input, Label, toast } from '@workspace/ui';

import { updateProfile } from '~/features/account/actions/update-profile';

export function ProfileForm({
  name: initialName,
  email,
  readOnly
}: {
  name: string;
  email: string;
  readOnly?: boolean;
}) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const result = await updateProfile({ name });
    setSaving(false);

    if (result?.data?.ok) {
      toast.success('Perfil atualizado.');
      return;
    }
    toast.error(
      result?.data?.error ?? result?.serverError ?? 'Não foi possível salvar.'
    );
  };

  return (
    <form
      onSubmit={save}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="perfil-nome">Nome</Label>
        <Input
          id="perfil-nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={64}
          disabled={readOnly}
          className="h-11 md:h-10"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="perfil-email">Email</Label>
        <Input
          id="perfil-email"
          value={email}
          readOnly
          disabled
          className="h-11 md:h-10"
        />
        <p className="text-xs text-muted-foreground">
          Trocar o email exige uma nova verificação e ainda não está disponível
          aqui.
        </p>
      </div>

      <div>
        <Button
          type="submit"
          className="h-11 md:h-10"
          disabled={saving || readOnly || name.trim() === initialName}
        >
          {saving ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}
