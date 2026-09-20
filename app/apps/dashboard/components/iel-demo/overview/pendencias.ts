import { rotuloDoMarco } from '@/features/iel-demo/analysis/acompanhamento';
import { COPY } from '@/features/iel-demo/copy';
import { plural } from '@/features/iel-demo/format';
import {
  getAcompanhamento,
  getApplication,
  getCompaniesWithCultureAnswers,
  getCompany,
  getCultureAttentionPoints,
  getJobRanking,
  getRegisteredReferrals,
  getTalent,
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
  tipo: TipoDePendencia;
  titulo: string;
  resumo: string;
  href: string;
  verbo: string;
  urgencia: number;
};

export const PENDENCIAS_VISIVEIS = 10;

/**
 * O tipo agrupa a fila na tela. Com milhares de vagas, uma lista corrida de
 * títulos não diz o que fazer; o cabeçalho do grupo diz.
 */
export type TipoDePendencia =
  | 'respostas'
  | 'perguntas'
  | 'ligacao'
  | 'envio'
  | 'questionario'
  | 'cultura';

/** Rótulo do grupo, na ordem da urgência. */
export const TIPO_DE_PENDENCIA_LABEL: Record<TipoDePendencia, string> = {
  respostas: 'Respostas para usar',
  perguntas: 'Perguntas sem resposta',
  ligacao: 'Ligar para quem foi contratado',
  envio: 'Currículos para enviar',
  questionario: 'Candidatos sem responder',
  cultura: 'Empresas com perfil aberto'
};

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
        tipo: 'respostas',
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
        tipo: 'perguntas',
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
        tipo: 'envio',
        titulo: job.title,
        resumo: `${plural(compativeis, 'pessoa compatível', 'pessoas compatíveis')}, nenhum currículo enviado`,
        href: iel.jobs.byId(job.id).referral,
        verbo: COPY.referral.action,
        urgencia: 4
      });
      continue;
    }

    if (semQuestionario > 0) {
      pendencias.push({
        id: `${job.id}-questionario`,
        tipo: 'questionario',
        titulo: job.title,
        resumo: `${plural(semQuestionario, 'pessoa ainda não respondeu', 'pessoas ainda não responderam')} as 10 frases`,
        href: iel.jobs.byId(job.id).index,
        verbo: 'Abrir a vaga',
        urgencia: 5
      });
    }
  }

  /*
   * Quem foi contratado, chegou aos 30, 60 ou 90 dias e não respondeu se
   * continua. Vem logo depois das perguntas sem resposta: a janela fecha em
   * 30 dias e, passada, a pessoa não é mais perguntada — é a ligação de hoje
   * ou nunca. A fila já chega na ordem de quem espera há mais tempo.
   */
  for (const situacao of getAcompanhamento(state)) {
    const marco = situacao.pendentes[0];
    if (marco === undefined) continue;
    const application = getApplication(state, situacao.applicationId);
    const talent = application ? getTalent(application.talentId, state) : null;
    if (!talent) continue;
    const aberto = situacao.diasNaEmpresa - marco;
    pendencias.push({
      id: `${situacao.applicationId}-ligacao`,
      tipo: 'ligacao',
      titulo: talent.name,
      resumo: `aos ${rotuloDoMarco(marco)} sem resposta${
        aberto > 0 ? ` há ${plural(aberto, 'dia', 'dias')}` : ''
      } · ${getCompany(situacao.companyId)?.name ?? situacao.companyId}`,
      href: iel.followUp.index,
      verbo: 'Abrir acompanhamento',
      urgencia: 3
    });
  }

  // Só as empresas com alguma resposta de cultura: sem resposta não há ponto
  // em aberto, e percorrer a carteira inteira custaria cada render da barra.
  for (const company of getCompaniesWithCultureAnswers(state)) {
    const emAberto = getCultureAttentionPoints(state, company.id).length;
    if (emAberto === 0) continue;

    pendencias.push({
      id: `${company.id}-cultura`,
      tipo: 'cultura',
      titulo: company.name,
      resumo: `${plural(emAberto, 'tema', 'temas')} sem resposta suficiente da equipe`,
      href: routes.dashboard.iel.companies.byId(company.id),
      verbo: 'Abrir a empresa',
      urgencia: 6
    });
  }

  return pendencias.sort((a, b) => a.urgencia - b.urgencia);
}
