import 'server-only';

import { cookies } from 'next/headers';

/**
 * Acesso da analista à Central (M5).
 *
 * Enquanto o IEL não tiver banco, a porta é uma senha de equipe: quem tem a
 * senha entra como analista. O login com conta própria (o `@workspace/auth`
 * do kit, com e-mail, senha e sessão em banco) entra no lugar disto sem
 * mexer nas telas — o que elas conhecem é `temSessaoDaAnalista()`.
 *
 * O que **não** passa por aqui: os links do candidato, do colaborador e do
 * relatório da empresa. Esses papéis entram por link, sem senha e sem
 * cadastro (R9 e R10), e continuam abertos.
 */
export const COOKIE_DA_SESSAO = 'iel-acesso';

/** Oito horas: um turno de trabalho, e não uma sessão eterna no navegador. */
export const DURACAO_DA_SESSAO_S = 8 * 60 * 60;

/**
 * A senha da equipe. Sem ela configurada, a porta fica aberta — é o que
 * permite rodar o protótipo local sem configurar nada, como o briefing pede.
 * Em produção, defina `IEL_SENHA_ANALISTA`.
 */
export function senhaConfigurada(): string | null {
  const senha = process.env.IEL_SENHA_ANALISTA?.trim();
  return senha ? senha : null;
}

export function acessoExigeSenha(): boolean {
  return senhaConfigurada() !== null;
}

/**
 * O valor do cookie: `expiraEm.assinatura`.
 *
 * A assinatura é um HMAC do prazo com o segredo do app, então o cookie não
 * pode ser forjado nem estendido no navegador. Não guarda nome, e-mail nem
 * nada da pessoa: só diz "esta sessão vale até tal hora".
 */
async function assinar(expiraEm: number): Promise<string> {
  const segredo = process.env.AUTH_SECRET ?? '';
  const chave = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(segredo),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const assinatura = await crypto.subtle.sign(
    'HMAC',
    chave,
    new TextEncoder().encode(String(expiraEm))
  );
  return [...new Uint8Array(assinatura)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function montarCookie(): Promise<string> {
  const expiraEm = Date.now() + DURACAO_DA_SESSAO_S * 1000;
  return `${expiraEm}.${await assinar(expiraEm)}`;
}

/** Valida o cookie: assinatura correta e prazo não vencido. */
export async function cookieValido(
  valor: string | undefined
): Promise<boolean> {
  if (!valor) return false;
  const [expiraEmTexto, assinatura] = valor.split('.');
  const expiraEm = Number(expiraEmTexto);
  if (!expiraEmTexto || !assinatura || Number.isNaN(expiraEm)) return false;
  if (expiraEm < Date.now()) return false;
  return (await assinar(expiraEm)) === assinatura;
}

/**
 * Porta aberta para a apresentação (20/09/2026). **Temporário.**
 *
 * Com isto ligado, quem escaneia o QR Code cai direto no produto, sem senha.
 * A senha não foi removida nem deve ser removida da Vercel: ela continua
 * valendo para o que só a equipe faz — ver `analistaLogada()`, que é quem
 * libera "Reiniciar base" e "Sair da Central". A equipe entra por `/entrar`
 * como sempre.
 *
 * Para fechar de novo, troque para `false` e publique. Nada mais muda.
 */
const PORTA_ABERTA_PARA_A_APRESENTACAO = true;

/** A analista está autenticada, ou a porta está aberta por configuração. */
export async function temSessaoDaAnalista(): Promise<boolean> {
  if (PORTA_ABERTA_PARA_A_APRESENTACAO) return true;
  if (!acessoExigeSenha()) return true;
  return analistaLogada();
}

/**
 * Só o cookie: alguém da equipe entrou de fato neste navegador.
 *
 * Diferente de `temSessaoDaAnalista`, a porta aberta (sem senha configurada)
 * não conta. É o que decide se as telas por link — as do candidato e do
 * colaborador — mostram o atalho de volta ao Mind RH: para um candidato de
 * verdade, sem cookie, não aparece nada.
 */
export async function analistaLogada(): Promise<boolean> {
  const cookie = (await cookies()).get(COOKIE_DA_SESSAO)?.value;
  return cookieValido(cookie);
}
