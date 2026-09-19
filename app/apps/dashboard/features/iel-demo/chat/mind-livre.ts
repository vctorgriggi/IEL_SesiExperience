/**
 * Pergunta livre do Mind: o contexto que acompanha a pergunta da analista.
 *
 * O modelo (quando ligado) não lê o estado da demonstração: ele só vê o que
 * este módulo monta, a partir dos mesmos seletores da tela da vaga — o % de
 * combina, o % de requisitos, os temas em que cada pessoa combina ou difere
 * e as pendências. Nome e cidade vão só até o servidor, para ele saber o que
 * apagar: `ai/pseudonimizar.ts` troca tudo por "Pessoa A", "a empresa" e
 * afins antes de qualquer provedor externo.
 *
 * Fica fora de `mind.ts` de propósito: a pergunta sugerida continua na regra
 * fixa, sem depender deste contrato.
 */

import type { AssistantContexto } from '../ai/types';
import { MAX_CONTEXTO_CANDIDATOS } from '../ai/types';
import { AXIS_LABEL } from '../copy';
import { getCompany, getJob, getJobRanking } from '../state/selectors';
import type { DemoState } from '../types';

export function montarContextoLivre(
  state: DemoState,
  jobId: string,
  selecionadas: string[],
  pendencias: string[] = []
): AssistantContexto {
  const job = getJob(jobId);
  const empresa = job ? getCompany(job.companyId) : null;
  const ranking = getJobRanking(state, jobId);

  // As selecionadas primeiro, depois as demais na ordem da tela.
  const ordenado = [
    ...ranking.filter((entry) => selecionadas.includes(entry.application.id)),
    ...ranking.filter((entry) => !selecionadas.includes(entry.application.id))
  ].slice(0, MAX_CONTEXTO_CANDIDATOS);

  return {
    vaga: job
      ? {
          titulo: job.title,
          requisitos: job.essentialRequirements.slice(0, 30)
        }
      : undefined,
    empresa: empresa?.name,
    candidatos: ordenado.map((entry) => ({
      applicationId: entry.application.id,
      talentId: entry.application.talentId,
      nome: entry.talent?.name,
      cidade: entry.talent?.city,
      combina: entry.adherence.total,
      requisitos: entry.technicalMatch,
      temas: entry.adherence.byAxis.map((eixo) => ({
        tema: AXIS_LABEL[eixo.axisId] ?? String(eixo.axisId),
        combina: eixo.adherence
      }))
    })),
    pendencias: pendencias.slice(0, 10)
  };
}
