import { COPY } from '@/features/iel-demo/copy';
import { plural } from '@/features/iel-demo/format';
import {
  getCultureAttentionPoints,
  getJobRanking,
  getRegisteredReferrals,
  getVisibleCompanies,
  getVisibleJobs,
  type JobRankingEntry
} from '@/features/iel-demo/state/selectors';
import type { DemoState } from '@/features/iel-demo/types';

import { routes } from '@workspace/routes';

/**
 * Uma coisa que precisa da analista hoje, com o verbo que a resolve.
 *
 * `urgencia` existe para ordenar a fila, e a ordem não é arbitrária: primeiro
 * o que já tem resposta esperando para ser usada, depois o que está parado à
 * espera de alguém, e por último o que só precisa de conferência. Quem abre a
 * tela de manhã deve conseguir descer a lista de cima para baixo.
 */
export type Pendencia = {
  id: string;
  titulo: string;
  resumo: string;
  href: string;
  verbo: string;
  urgencia: number;
};

export const PENDENCIAS_VISIVEIS = 5;

/**
 * A fila do dia, montada do estado atual das vagas e das empresas.
 *
 * Mora fora da tela porque a barra lateral mostra a mesma contagem ao lado de
 * "Hoje": se cada uma calculasse do seu jeito, as duas divergiriam.
 */
export function montarPendencias(state: DemoState): Pendencia[] {
  const iel = routes.dashboard.iel;
  const pendencias: Pendencia[] = [];
  const referrals = getRegisteredReferrals(state);

  for (const job of getVisibleJobs(state)) {
    if (job.stage === 'encerrada') continue;

    const clarifications = state.clarifications.filter(
      (clarification) => clarification.jobId === job.id
    );
    const respondidas = clarifications.filter(
      (clarification) => clarification.state === 'respondida'
    ).length;
    const semResposta = clarifications.filter(
      (clarification) =>
        clarification.state === 'solicitada' ||
        clarification.state === 'rascunho'
    ).length;

    const ranking: JobRankingEntry[] = getJobRanking(state, job.id);
    const compativeis = ranking.filter(
      (entry) => entry.adherence.compatible === true
    ).length;
    const semQuestionario = ranking.filter(
      (entry) => entry.fitStatus === 'pendente'
    ).length;
    const jaEnviados = referrals.filter(
      (referral) => referral.jobId === job.id
    ).length;

    if (respondidas > 0) {
      pendencias.push({
        id: `${job.id}-respostas`,
        titulo: job.title,
        resumo: `${plural(respondidas, 'resposta chegou', 'respostas chegaram')} e ainda não entraram na análise`,
        href: iel.jobs.byId(job.id).index,
        verbo: 'Abrir a vaga',
        urgencia: 1
      });
      continue;
    }

    if (semResposta > 0) {
      pendencias.push({
        id: `${job.id}-perguntas`,
        titulo: job.title,
        resumo: `${plural(semResposta, 'pergunta', 'perguntas')} sem resposta`,
        href: iel.jobs.byId(job.id).index,
        verbo: 'Abrir a vaga',
        urgencia: 2
      });
      continue;
    }

    if (compativeis > 0 && jaEnviados === 0) {
      pendencias.push({
        id: `${job.id}-envio`,
        titulo: job.title,
        resumo: `${plural(compativeis, 'pessoa compatível', 'pessoas compatíveis')}, nenhum currículo enviado`,
        href: iel.jobs.byId(job.id).referral,
        verbo: COPY.referral.action,
        urgencia: 3
      });
      continue;
    }

    if (semQuestionario > 0) {
      pendencias.push({
        id: `${job.id}-questionario`,
        titulo: job.title,
        resumo: `${plural(semQuestionario, 'pessoa ainda não respondeu', 'pessoas ainda não responderam')} as 5 perguntas`,
        href: iel.jobs.byId(job.id).index,
        verbo: 'Abrir a vaga',
        urgencia: 4
      });
    }
  }

  for (const company of getVisibleCompanies(state)) {
    const emAberto = getCultureAttentionPoints(state, company.id).length;
    if (emAberto === 0) continue;

    pendencias.push({
      id: `${company.id}-cultura`,
      titulo: company.name,
      resumo: `${plural(emAberto, 'ponto do dia a dia', 'pontos do dia a dia')} sem resposta suficiente da equipe`,
      href: routes.dashboard.iel.companies.byId(company.id),
      verbo: 'Abrir a empresa',
      urgencia: 5
    });
  }

  return pendencias.sort((a, b) => a.urgencia - b.urgencia);
}
