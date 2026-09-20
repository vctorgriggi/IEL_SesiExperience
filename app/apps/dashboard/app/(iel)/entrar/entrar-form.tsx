'use client';

import { useActionState } from 'react';
import { Loader2, LogIn } from 'lucide-react';

import { Button } from '@workspace/ui/shadcn/button';
import { Input } from '@workspace/ui/shadcn/input';
import { Label } from '@workspace/ui/shadcn/label';

import { entrar, type EstadoDoLogin } from './actions';

const INICIAL: EstadoDoLogin = { erro: null };

export function EntrarForm() {
  const [estado, acao, enviando] = useActionState(entrar, INICIAL);

  return (
    <form
      action={acao}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="senha">Senha da equipe</Label>
        <Input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          aria-describedby={estado.erro ? 'erro-do-login' : undefined}
          aria-invalid={estado.erro ? true : undefined}
        />
        {estado.erro ? (
          <p
            id="erro-do-login"
            role="alert"
            className="text-sm text-[hsl(var(--estado-difere-fg))]"
          >
            {estado.erro}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={enviando}
      >
        {enviando ? (
          <Loader2 className="animate-spin" />
        ) : (
          <LogIn aria-hidden="true" />
        )}
        {enviando ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
}
