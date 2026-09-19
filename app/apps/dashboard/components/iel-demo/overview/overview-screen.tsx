'use client';

import Link from 'next/link';
import { COPY } from '@/features/iel-demo/copy';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
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
import { Button } from '@workspace/ui';

import { ManagerOverview } from '../manager/manager-overview';
import { Hero, HowItWorks, Panel, PanelHeader } from '../shared/ui';

/**
 * Uma coisa que precisa da analista hoje, com o verbo que a resolve.
 *
 * `urgencia` existe para ordenar a fila, e a ordem não é arbitrária: primeiro
 * o que já tem resposta esperando para ser usada, depois o que está parado à
 * espera de alguém, e por último o que só precisa de conferência. Quem abre a
 * tela de manhã deve conseguir descer a lista de cima para baixo.
 */
type Pendencia = {
  id: string;
  titulo: string;
  resumo: string;
  href: string;
  verbo: string;
  urgencia: number;
};

const ITENS_VISIVEIS = 5;

function montarPendencias(state: DemoState): Pendencia[] {
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

/**
 * A tela de abertura responde uma pergunta: o que precisa de mim hoje?
 *
 * Ela já foi um painel administrativo — cinco números no herói, distribuição
 * por etapa, cobertura por dimensão, atividade recente e a procedência dos
 * registros. Nada daquilo dizia por onde começar, e era isso que a analista
 * precisava. Ficou uma contagem e uma fila de no máximo cinco linhas, cada
 * uma com o verbo que a resolve.
 */
export function OverviewScreen() {
  const { state, persona } = useIelDemo();

  if (persona.kind === 'gestor') {
    return <ManagerOverview />;
  }

  const pendencias = montarPendencias(state);
  const visiveis = pendencias.slice(0, ITENS_VISIVEIS);
  const primeira = visiveis[0];

  return (
    <div className="space-y-6">
      <Hero
        eyebrow="IEL · Central de Seleção"
        title="O que precisa de mim hoje?"
        description="A fila do dia, na ordem em que compensa resolver."
        figures={[
          {
            label: 'Pendências',
            value: pendencias.length,
            tone: pendencias.length > 0 ? 'atencao' : 'default'
          }
        ]}
        actions={
          primeira ? (
            <Link href={primeira.href}>
              <Button size="large">{primeira.verbo}</Button>
            </Link>
          ) : null
        }
      />

      <Panel
        elevation={1}
        padding="none"
        className="overflow-hidden"
      >
        <div className="px-5 pb-3 pt-4">
          <PanelHeader title="Para resolver agora" />
        </div>

        {visiveis.length === 0 ? (
          <p className="iel-prose px-5 pb-5 text-sm text-muted-foreground">
            Nada em aberto. Quando chegar uma resposta ou uma vaga ficar parada,
            a linha aparece aqui.
          </p>
        ) : (
          <ul className="border-t border-border">
            {visiveis.map((pendencia) => (
              <li
                key={pendencia.id}
                className="iel-interactive flex flex-col gap-2 border-b border-border px-5 py-4 last:border-0 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <p className="iel-prose min-w-0 text-sm text-foreground">
                  <span className="font-semibold">{pendencia.titulo}:</span>{' '}
                  {pendencia.resumo}
                </p>
                <Link
                  href={pendencia.href}
                  className="shrink-0"
                >
                  <Button
                    size="sm"
                    variant="outline"
                  >
                    {pendencia.verbo}
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {pendencias.length > visiveis.length ? (
          <Link
            href={routes.dashboard.iel.jobs.index}
            className="iel-interactive block border-t border-border px-5 py-3 text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Ver as outras{' '}
            {plural(pendencias.length - visiveis.length, 'vaga', 'vagas')}
          </Link>
        ) : null}

        <div className="px-5 pb-4">
          <HowItWorks title="Como esta lista é montada">
            <p>
              Cada linha vem do estado atual de uma vaga ou de uma empresa, não
              de uma lista escrita à mão. A ordem é a mesma todo dia: primeiro o
              que já tem resposta esperando, depois o que está parado à espera
              de alguém, por último o que só precisa de conferência.
            </p>
            <p>
              Só aparecem as cinco primeiras. O resto está na lista de vagas,
              que tem busca e filtro.
            </p>
          </HowItWorks>
        </div>
      </Panel>
    </div>
  );
}
