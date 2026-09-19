/**
 * Amostra de colaboradores que responde o traçado cultural da empresa (M2).
 *
 * A analista do IEL cadastra nome e e-mail corporativo de uma amostra da área
 * da vaga e das áreas conexas; o sistema gera um link por pessoa, sem login,
 * e a tela da empresa acompanha "N de M responderam" até o prazo. O perfil da
 * empresa é a média das respostas (`getCompanyCultureProfile`), então quem
 * responde importa tanto quanto o que responde.
 *
 * ## Privacidade (PRODUTO.md §5)
 *
 * **Só nome e e-mail corporativo.** Nada de CPF, matrícula, cargo detalhado
 * ou qualquer campo que a média não use. `role` e `area` existem porque a
 * leitura precisa distinguir gestão de equipe — é essa distinção que mostra
 * quando o traçado é autorretrato da chefia.
 *
 * **O token não carrega dado pessoal.** É opaco, 16 caracteres hexadecimais
 * derivados do id do convite e de uma semente do produto. Quem intercepta a
 * URL não descobre nome, e-mail nem empresa a partir dela; a associação só
 * existe do lado de cá. Num produto real o token sairia de gerador aleatório
 * seguro e ficaria guardado como hash — aqui ele precisa ser o mesmo a cada
 * carga da demonstração, e por isso é derivado.
 *
 * **O consentimento fica no aceite.** `consentVersion` é gravado junto da
 * resposta, como em `CandidateFitResponse.consent`: sem a versão do texto não
 * há como demonstrar a que a pessoa consentiu.
 *
 * **A resposta é agregada.** Quem responde sobre o próprio ambiente de
 * trabalho não pode ficar identificado para a gestão: a tela da empresa vê
 * contagem e média, nunca "fulano respondeu isto".
 */

import { hashHex } from './deterministic-hash';

/** Papel de quem responde, na mesma escala de `CultureRespondent`. */
export type CultureInviteRole = 'gestao' | 'rh' | 'equipe';

/** Prazo de resposta da amostra, em dias (R2). */
export const CULTURE_INVITE_DEADLINE_DAYS = 3;

/** Versão do texto de aceite apresentado ao colaborador. */
export const CULTURE_CONSENT_VERSION = '2026-09-19';

const TOKEN_LENGTH = 16;

/**
 * Semente do produto para os tokens da demonstração.
 *
 * Fica visível de propósito: não é segredo de segurança, é o que mantém a
 * demonstração idêntica entre cargas. Num produto real o token é aleatório.
 */
export const CULTURE_INVITE_TOKEN_SEED = 'iel-central-selecao';

export function buildInviteToken(inviteId: string, seed: string): string {
  return hashHex(`${seed}:${inviteId}`, TOKEN_LENGTH);
}

/** Soma dias a uma data ISO, preservando o formato de data pura. */
export function addDays(isoDate: string, days: number): string {
  const base = Date.parse(`${isoDate.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(base)) return isoDate.slice(0, 10);
  return new Date(base + days * 86_400_000).toISOString().slice(0, 10);
}

/** Dias inteiros entre duas datas ISO. Negativo quando `toIso` já passou. */
export function daysBetweenDates(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso.slice(0, 10)}T00:00:00.000Z`);
  const to = Date.parse(`${toIso.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.round((to - from) / 86_400_000);
}

/** Menor amostra que sustenta uma leitura de equipe. */
export const MIN_SAMPLE_SIZE = 3;

/** Maior amostra que o IEL pede de uma vez. */
export const MAX_SAMPLE_SIZE = 10;

/** Fração do quadro da área que a amostra cobre (R2). */
export const SAMPLE_FRACTION = 0.2;

/**
 * Quantas pessoas convidar, dado o quadro da área (regra R2 do cliente).
 *
 * "Cerca de 20% da área da vaga e das áreas conexas." Os dois limites são
 * decisões de produto, não arredondamento:
 *
 * - **Mínimo 3**, porque abaixo disso não existe "a equipe": é o mesmo piso de
 *   `MIN_TEAM_RESPONSES`, e um perfil fechado com duas respostas trataria duas
 *   pessoas como o conjunto.
 * - **Máximo 10**, porque a consulta tem prazo de três dias e custo de
 *   atenção da empresa. O enunciado lista tempo de aplicação como limitação do
 *   fit cultural; uma amostra de quarenta pessoas recria o problema.
 *
 * Quadro não informado ou não positivo devolve o mínimo: convidar três é a
 * ação segura, e zero convites travaria o perfil sem dizer por quê.
 */
export function getSuggestedSampleSize(companyHeadcount: number): number {
  if (!Number.isFinite(companyHeadcount) || companyHeadcount <= 0) {
    return MIN_SAMPLE_SIZE;
  }
  const proportional = Math.round(companyHeadcount * SAMPLE_FRACTION);
  return Math.min(MAX_SAMPLE_SIZE, Math.max(MIN_SAMPLE_SIZE, proportional));
}
