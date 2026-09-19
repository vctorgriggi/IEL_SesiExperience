'use client';

import { useState } from 'react';

import {
  Button,
  InputPassword,
  Label,
  PasswordFormMessage,
  toast
} from '@workspace/ui';

import { changePassword } from '~/features/account/actions/change-password';

export function PasswordForm({ readOnly }: { readOnly?: boolean }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const result = await changePassword({
      currentPassword,
      password,
      confirmPassword
    });
    setSaving(false);

    if (result?.data?.ok) {
      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
      toast.success('Senha alterada.');
      return;
    }

    const validation =
      result?.validationErrors?.confirmPassword?._errors?.[0] ??
      result?.validationErrors?.password?._errors?.[0];
    toast.error(
      result?.data?.error ??
        validation ??
        result?.serverError ??
        'Não foi possível alterar a senha.'
    );
  };

  return (
    <form
      onSubmit={save}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="senha-atual">Senha atual</Label>
        <InputPassword
          id="senha-atual"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          maxLength={72}
          disabled={readOnly}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="senha-nova">Nova senha</Label>
        <InputPassword
          id="senha-nova"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          maxLength={72}
          disabled={readOnly}
        />
        <PasswordFormMessage password={password} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="senha-confirma">Repita a nova senha</Label>
        <InputPassword
          id="senha-confirma"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          maxLength={72}
          disabled={readOnly}
        />
      </div>

      <div>
        <Button
          type="submit"
          className="h-11 md:h-10"
          disabled={saving || readOnly || !currentPassword || !password}
        >
          {saving ? 'Alterando…' : 'Alterar senha'}
        </Button>
      </div>
    </form>
  );
}
