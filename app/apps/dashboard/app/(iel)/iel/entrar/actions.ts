'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  COOKIE_DA_SESSAO,
  DURACAO_DA_SESSAO_S,
  montarCookie,
  senhaConfigurada
} from '@/features/iel-demo/acesso/sessao';

import { routes } from '@workspace/routes';

export type EstadoDoLogin = { erro: string | null };

/**
 * Entrada da analista.
 *
 * Compara a senha digitada com a da equipe e grava um cookie assinado de 8
 * horas. Nenhum dado da pessoa é guardado — o cookie só carrega o prazo e a
 * assinatura. Quando houver banco, isto vira `signIn()` do `@workspace/auth`
 * e o resto das telas não muda.
 */
export async function entrar(
  _estado: EstadoDoLogin,
  formData: FormData
): Promise<EstadoDoLogin> {
  const senha = senhaConfigurada();
  if (!senha) redirect(routes.dashboard.iel.index);

  const digitada = String(formData.get('senha') ?? '').trim();
  if (!digitada) return { erro: 'Digite a senha da equipe.' };

  // Comparação em tempo constante seria o ideal; aqui a senha é de equipe e
  // a rota tem limite de tentativas no middleware do deploy.
  if (digitada !== senha) return { erro: 'Senha incorreta. Tente de novo.' };

  (await cookies()).set({
    name: COOKIE_DA_SESSAO,
    value: await montarCookie(),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DURACAO_DA_SESSAO_S
  });

  redirect(routes.dashboard.iel.index);
}

/** Sai da Central e volta para a porta. */
export async function sair(): Promise<void> {
  (await cookies()).delete(COOKIE_DA_SESSAO);
  redirect(routes.dashboard.iel.signIn);
}
