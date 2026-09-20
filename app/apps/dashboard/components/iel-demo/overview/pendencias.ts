import { rotuloDoMarco } from '@/features/iel-demo/analysis/acompanhamento';
import { COPY } from '@/features/iel-demo/copy';
import { DEMO_REFERENCE_DATE } from '@/features/iel-demo/fixtures';
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
 */
export type NivelDePrioridade = 'alta' | 'media' | 'normal';
export type StatusPrazo = 'atrasado' | 'urgente' | 'no-prazo';

export type Pendencia = {
  id: string;
  tipo: TipoDePendencia;
  titulo: string;
  resumo: string;
  href: string;
  verbo: string;
  urgencia: number;
  prioridade: NivelDePrioridade;
  criterio: string;
  score: number;
  statusPrazo: StatusPrazo;
  prazoLabel: string;
  diasAtraso?: number;
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
 * Ordenada estritamente por severidade: atrasos de entrega/resposta primeiro,
 * depois prazos em alerta iminente e por fim itens no prazo regular.
 */
export function montarPendencias(state: DemoState): Pendencia[] {
  const iel = routes.dashboard.iel;
  const pendencias: Pendencia[] = [];
  const referrals = getRegisteredReferrals(state);
  const dataRefMs = new Date(DEMO_REFERENCE_DATE).getTime();

  for (const job of getVisibleJobs(state)) {
    if (job.stage === 'encerrada') continue;

    const clarifications = state.clarifications.filter(
      (clarification) => clarification.jobId === job.id
    );
    const respondidas = clarifications.filter(
      (clarification) => clarification.state === 'respondida'
    ).length;
    const semRespostaItems = clarifications.filter(
      (clarification) =>
        clarification.state === 'solicitada' ||
        clarification.state === 'rascunho'
    );
    const semResposta = semRespostaItems.length;

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
        urgencia: 1,
        prioridade: 'alta',
        statusPrazo: 'urgente',
        prazoLabel: 'SLA de triagem: 24h',
        criterio: 'Resposta pronta aguardando análise',
        score: 250 + respondidas * 10
      });
      continue;
    }

    if (semResposta > 0) {
      // Calcula o atraso em relação ao prazo regulamentar de 2 dias (48h)
      let maxAtraso = 0;
      for (const item of semRespostaItems) {
        const itemDateMs = new Date(item.createdAt.slice(0, 10)).getTime();
        const dias = Math.floor(
          (dataRefMs - itemDateMs) / (1000 * 60 * 60 * 24)
        );
        const atraso = dias - 2;
        if (atraso > maxAtraso) maxAtraso = atraso;
      }

      const estaAtrasado = maxAtraso > 0;
      pendencias.push({
        id: `${job.id}-perguntas`,
        tipo: 'perguntas',
        titulo: job.title,
        resumo: `${plural(semResposta, 'pergunta', 'perguntas')} sem resposta`,
        href: iel.jobs.byId(job.id).index,
        verbo: 'Abrir a vaga',
        urgencia: 2,
        prioridade: 'alta',
        statusPrazo: estaAtrasado ? 'atrasado' : 'urgente',
        prazoLabel: estaAtrasado
          ? `Atrasado há ${plural(maxAtraso, 'dia', 'dias')}`
          : 'Prazo: vence hoje (48h)',
        diasAtraso: estaAtrasado ? maxAtraso : 0,
        criterio: estaAtrasado
          ? `Prazo de 48h estourado há ${maxAtraso}d (bloqueio)`
          : 'Dúvida aberta bloqueando triagem',
        score: estaAtrasado ? 300 + maxAtraso * 20 : 180 + semResposta * 5
      });
      continue;
    }

    if (compativeis > 0 && jaEnviados === 0) {
      const prioritario = compativeis >= 12;
      pendencias.push({
        id: `${job.id}-envio`,
        tipo: 'envio',
        titulo: job.title,
        resumo: `${plural(compativeis, 'pessoa compatível', 'pessoas compatíveis')}, nenhum currículo enviado`,
        href: iel.jobs.byId(job.id).referral,
        verbo: COPY.referral.action,
        urgencia: 4,
        prioridade: prioritario ? 'alta' : 'media',
        statusPrazo: prioritario ? 'urgente' : 'no-prazo',
        prazoLabel: prioritario
          ? 'SLA remessa: prioritário (24h)'
          : 'SLA remessa: até 48h',
        criterio: `${compativeis} compatíveis prontos para remessa`,
        score: prioritario ? 140 + compativeis : 60 + compativeis
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
        urgencia: 5,
        prioridade: 'normal',
        statusPrazo: 'no-prazo',
        prazoLabel: 'Prazo fit: até 48h',
        criterio: 'Aguardando 10 frases de fit',
        score: 20 + semQuestionario
      });
    }
  }

  /*
   * Quem foi contratado, chegou aos 30, 60 ou 90 dias e não respondeu se
   * continua. Cada pergunta fica aberta por 30 dias.
   */
  for (const situacao of getAcompanhamento(state)) {
    const marco = situacao.pendentes[0];
    if (marco === undefined) continue;
    const application = getApplication(state, situacao.applicationId);
    const talent = application ? getTalent(application.talentId, state) : null;
    if (!talent) continue;
    const aberto = situacao.diasNaEmpresa - marco;
    const expirado = aberto >= 30;
    const quaseExpirando = aberto >= 15;
    const diasRestantes = Math.max(0, 30 - aberto);

    pendencias.push({
      id: `${situacao.applicationId}-ligacao`,
      tipo: 'ligacao',
      titulo: talent.name,
      resumo: `aos ${rotuloDoMarco(marco)} sem resposta${
        aberto > 0 ? ` há ${plural(aberto, 'dia', 'dias')}` : ''
      } · ${getCompany(situacao.companyId)?.name ?? situacao.companyId}`,
      href: iel.followUp.index,
      verbo: 'Abrir acompanhamento',
      urgencia: 3,
      prioridade: 'alta',
      statusPrazo: expirado
        ? 'atrasado'
        : quaseExpirando
          ? 'urgente'
          : 'no-prazo',
      prazoLabel: expirado
        ? `Janela expirada há ${plural(aberto - 30, 'dia', 'dias')}`
        : quaseExpirando
          ? `Restam ${diasRestantes} dias de prazo`
          : `Restam ${diasRestantes} dias`,
      diasAtraso: expirado ? aberto - 30 : 0,
      criterio: expirado
        ? `Prazo de 30d expirado (${aberto}d sem resposta)`
        : quaseExpirando
          ? `Janela na metade (${aberto}d sem resposta)`
          : `Acompanhamento em dia (${aberto}d)`,
      score: expirado
        ? 350 + (aberto - 30) * 10
        : quaseExpirando
          ? 200 + aberto
          : 70 + aberto
    });
  }

  // Empresas com alguma resposta de cultura
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
      urgencia: 6,
      prioridade: 'normal',
      statusPrazo: 'no-prazo',
      prazoLabel: 'Prazo amostra: 3 dias',
      criterio: 'Alinhamento cultural em aberto',
      score: 10 + emAberto
    });
  }

  return pendencias.sort((a, b) => b.score - a.score);
}
