'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';

import { AuthErrorCode } from '@workspace/auth/error-codes';
import { routes } from '@workspace/routes';
import {
  AuthCardLayout,
  Button,
  FormErrorAlert,
  Input,
  InputPassword,
  Label,
  linkClass
} from '@workspace/ui';

import { AUTH_CARD_CLASS } from '~/components/auth/auth-shell';
import { signInAction, type SignInState } from './actions';

const DEMO_EMAIL =
  process.env.NEXT_PUBLIC_DEMO_SIGN_IN_EMAIL?.trim() || 'demo@arki.dev';
const DEMO_PASSWORD =
  process.env.NEXT_PUBLIC_DEMO_SIGN_IN_PASSWORD?.trim() || 'Demo1234';

const initialState: SignInState = {};

export function SignInForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(
    signInAction,
    initialState
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const fillDemoCredentials = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
  };

  return (
    <AuthCardLayout
      className={AUTH_CARD_CLASS}
      variant="centered"
      title="Bem vindo de volta"
      description="Entre para conversar com a IA."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Não tem conta?{' '}
          <Link
            href={routes.aiChat.signUp}
            className={linkClass}
          >
            Criar agora
          </Link>
        </p>
      }
    >
      <form
        action={formAction}
        className="flex flex-col gap-4"
      >
        <input
          type="hidden"
          name="callbackUrl"
          value={callbackUrl}
        />

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoCapitalize="off"
            autoComplete="username"
            required
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link
              href={routes.aiChat.forgotPassword.index}
              className={`text-sm ${linkClass}`}
            >
              Esqueceu a senha?
            </Link>
          </div>
          <InputPassword
            id="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            maxLength={72}
            autoCapitalize="off"
            autoComplete="current-password"
            required
          />
        </div>

        {state.error && <FormErrorAlert message={state.error} />}

        {state.code === AuthErrorCode.UnverifiedEmail && (
          <Link
            href={`${routes.aiChat.verifyEmail.index}?email=${encodeURIComponent(email)}`}
            className={`text-sm ${linkClass}`}
          >
            Reenviar email de verificação
          </Link>
        )}

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={pending}
            onClick={fillDemoCredentials}
          >
            Preencher credenciais demo
          </Button>
          <Button
            type="submit"
            className="w-full"
            disabled={pending}
          >
            {pending ? 'Entrando…' : 'Entrar'}
          </Button>
        </div>
      </form>
    </AuthCardLayout>
  );
}
