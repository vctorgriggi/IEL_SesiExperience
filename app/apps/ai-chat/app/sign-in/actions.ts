'use server';

import { signIn } from '@workspace/auth';
import { CredentialsSignin } from '@workspace/auth/errors';
import { resolveAuthErrorMessage } from '@workspace/auth/error-labels';
import { Provider } from '@workspace/auth/providers.types';

export type SignInState = { error?: string; code?: string };

export async function signInAction(_previous: SignInState, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const callbackUrl = String(formData.get('callbackUrl') ?? '') || '/chat';

  if (!email || !password) {
    return { error: 'Preencha email e senha.' };
  }

  try {
    await signIn(Provider.Credentials, {
      email,
      password,
      redirectTo: callbackUrl.startsWith('/') ? callbackUrl : '/chat',
      redirect: true
    });
  } catch (err) {
    // O código carrega o motivo real: email não verificado, TOTP obrigatório,
    // limite de tentativas. Tratar tudo como "senha errada" esconde isso.
    if (err instanceof CredentialsSignin) {
      return { error: resolveAuthErrorMessage(err.code), code: err.code };
    }
    throw err;
  }

  return {};
}
