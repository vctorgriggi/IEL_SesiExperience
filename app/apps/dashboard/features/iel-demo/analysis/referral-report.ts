/**
 * O relatório que a empresa abre por link (S3).
 *
 * Depois que a analista registra o encaminhamento, a empresa recebe um
 * endereço sem login com as até cinco pessoas enviadas naquela vaga. Este
 * arquivo guarda só a parte que é conta pura — token, faixa de cada ponto,
 * tempo de experiência, ponto de maior divergência. Quem monta o relatório a
 * partir do estado é `getReferralReport`, em `state/selectors.ts`.
 *
 * ## O que o relatório não pode conter (PRODUTO.md §5.1)
 *
 * **Outros candidatos.** A empresa vê os enviados daquela vaga e mais
 * ninguém: nem o ranking, nem quem ficou abaixo do corte, nem quantos foram
 * descartados.
 *
 * **Resposta individual de colaborador.** Da consulta à equipe sai apenas o
 * agregado — "sua equipe respondeu 7 de 10" e o ponto onde as leituras mais
 * se afastam. Nunca quem respondeu o quê.
 *
 * **Resposta do candidato ao fit.** A empresa vê a aderência por ponto, em
 * faixa ("combina", "parecido", "difere"), não a alternativa que a pessoa
 * marcou. O percentual total continua explicável porque a faixa é derivada
 * dele por regra fixa, escrita aqui.
 *
 * **Anotação interna do IEL.** Em nenhuma hipótese, em nenhum relatório.
 */

import { hashHex } from './deterministic-hash';
import type { FitAxisId } from './fit-axes';

/** Estado de um ponto do dia a dia, na palavra que a empresa lê. */
export type ReportAxisMatch =
  | 'combina'
  | 'parecido'
  | 'difere'
  | 'sem-resposta';

/**
 * Faixas da aderência por ponto.
 *
 * Três faixas, e não o percentual cru, porque quem lê é o RH da indústria
 * decidindo a ordem das entrevistas: "82% neste ponto" sugere precisão que a
 * escala ordinal de três degraus não tem. Os cortes são decisão de produto —
 * 75 é a distância de menos de meio degrau, 50 é a de um degrau inteiro —, e
 * ficam como constantes para que continuem sendo revisáveis por alguém.
 */
export const REPORT_AXIS_MATCH_FLOOR = 75;
export const REPORT_AXIS_CLOSE_FLOOR = 50;

/** A faixa de um ponto. Ausência de medida nunca vira "difere". */
export function readAxisMatch(adherence: number | null): ReportAxisMatch {
  if (adherence === null) return 'sem-resposta';
  if (adherence >= REPORT_AXIS_MATCH_FLOOR) return 'combina';
  if (adherence >= REPORT_AXIS_CLOSE_FLOOR) return 'parecido';
  return 'difere';
}

export const REPORT_AXIS_MATCH_LABEL: Record<ReportAxisMatch, string> = {
  combina: 'combina',
  parecido: 'parecido',
  difere: 'difere',
  'sem-resposta': 'sua equipe não respondeu este ponto'
};

/**
 * Semente do token do relatório.
 *
 * Igual à dos convites em espírito e diferente em valor: dois links de escopos
 * diferentes não podem colidir, e um token de vaga derivado da mesma semente
 * do convite abriria a porta para um confundir-se com o outro.
 */
export const REPORT_TOKEN_SEED = 'iel-relatorio-empresa';

const TOKEN_LENGTH = 16;

/**
 * Token opaco do relatório de uma vaga.
 *
 * Determinístico pelo mesmo motivo do convite: a demonstração recarrega e o
 * link precisa continuar valendo. Num produto real ele sairia de gerador
 * aleatório seguro, guardado como hash e com validade própria — o que a
 * página escreve no rodapé (30 dias) seria checado no servidor.
 */
export function buildReportToken(jobId: string): string {
  return hashHex(`${REPORT_TOKEN_SEED}:${jobId}`, TOKEN_LENGTH);
}

/** Validade que a página anuncia à empresa, em dias. */
export const REPORT_VALIDITY_DAYS = 30;

/**
 * Meses de experiência declarados, somando os períodos do currículo.
 *
 * Os períodos vêm como texto ("mar/2024 — fev/2026") porque é assim que a
 * planilha do Empregare os entrega. Um período que não casa com o formato é
 * ignorado, nunca estimado: currículo mal preenchido não pode virar número
 * inventado ao lado do nome de alguém.
 */
const MONTH_BY_NAME: Record<string, number> = {
  jan: 0,
  fev: 1,
  mar: 2,
  abr: 3,
  mai: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  set: 8,
  out: 9,
  nov: 10,
  dez: 11
};

function parseMonthYear(value: string): number | null {
  const match = /^([a-zç]{3})\/(\d{4})$/.exec(value.trim().toLowerCase());
  if (!match) return null;
  const month = MONTH_BY_NAME[match[1] ?? ''];
  const year = Number.parseInt(match[2] ?? '', 10);
  if (month === undefined || Number.isNaN(year)) return null;
  return year * 12 + month;
}

export function countExperienceMonths(periods: string[]): number {
  let total = 0;
  for (const period of periods) {
    const [start, end] = period.split(/\s*[—–-]\s*/);
    if (!start || !end) continue;
    const from = parseMonthYear(start);
    const to = parseMonthYear(end);
    if (from === null || to === null || to < from) continue;
    total += to - from;
  }
  return total;
}

/**
 * "3 anos", "8 meses" ou nada.
 *
 * Curto porque entra numa linha que já tem cargo e cidade: escrito por
 * extenso, "3 anos de experiência" empurrava a cidade para fora do cartão.
 * Devolve `null` quando não há período legível — a parte some em vez de dizer
 * "0 anos", que leria como demérito onde há só falta de dado.
 */
export function formatExperienceSpan(periods: string[]): string | null {
  const months = countExperienceMonths(periods);
  if (months <= 0) return null;
  const years = Math.floor(months / 12);
  if (years >= 1) return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  return `${months} ${months === 1 ? 'mês' : 'meses'}`;
}

/** Iniciais para o avatar, sem foto e sem serviço externo. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

/**
 * O ponto em que as leituras mais se afastam entre as pessoas enviadas.
 *
 * É a frase do cartão "ponto onde mais divergem": serve para a empresa levar
 * um assunto à entrevista, não para reprovar ninguém. Conta quantas pessoas
 * ficaram fora de "combina" naquele ponto, ignorando quem não tem medida —
 * silêncio não é divergência. Empate resolve pela ordem dos pontos, que é
 * fixa, para que o relatório não mude de frase a cada carga.
 */
export function findMostDivergentAxis(
  people: { byAxis: { axisId: FitAxisId; match: ReportAxisMatch }[] }[]
): FitAxisId | null {
  const counts = new Map<FitAxisId, number>();
  const order: FitAxisId[] = [];

  for (const person of people) {
    for (const axis of person.byAxis) {
      if (!counts.has(axis.axisId)) {
        counts.set(axis.axisId, 0);
        order.push(axis.axisId);
      }
      if (axis.match === 'difere' || axis.match === 'parecido') {
        counts.set(axis.axisId, (counts.get(axis.axisId) ?? 0) + 1);
      }
    }
  }

  let best: FitAxisId | null = null;
  let bestCount = 0;
  for (const axisId of order) {
    const count = counts.get(axisId) ?? 0;
    if (count > bestCount) {
      best = axisId;
      bestCount = count;
    }
  }
  return best;
}
