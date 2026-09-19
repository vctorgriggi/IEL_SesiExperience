'use client';

import Link from 'next/link';
import { ADHERENCE_THRESHOLD } from '@/features/iel-demo/analysis/adherence';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  CANDIDATE_FIT_DEADLINE_DAYS,
  getCompanyCultureProfile,
  getCultureSampleProgress,
  getJobRanking,
  getReferralListSelection,
  REFERRAL_LIMIT
} from '@/features/iel-demo/state/selectors';
import type { Job } from '@/features/iel-demo/types';
import { CircleAlert, Clock, TrendingUp } from 'lucide-react';

import { routes } from '@workspace/routes';
import { Badge } from '@workspace/ui/shadcn/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';

import { formatarDataCurta } from '../shared/datas';

/** Data de referência mais N dias, no formato curto da tela. */
function prazoEm(base: string, dias: number): string {
  const data = new Date(`${base.slice(0, 10)}T12:00:00.000Z`);
  if (Number.isNaN(data.getTime())) return base;
  data.setUTCDate(data.getUTCDate() + dias);
  return formatarDataCurta(data.toISOString().slice(0, 10));
}

/**
 * Os quatro números que abrem a vaga.
 *
 * O rótulo é curto de propósito: com o selo ocupando o canto direito do
 * cartão, uma descrição longa quebrava em duas linhas e desalinhava os quatro
 * números. Quem lê já tem o contexto da vaga no cabeçalho — "Compatíveis"
 * basta, e o rodapé do cartão diz o resto.
 *
 * Nenhum deles é um indicador de desempenho: os quatro são pendências. Quantos
 * já dá para enviar, quantos ainda não responderam, quantos estão marcados e
 * o quanto da empresa já foi descrito. Quem abre a tela precisa saber o que
 * falta para fechar a remessa, e não como a vaga vai.
 */
export function JobSectionCards({ job }: { job: Job }) {
  const { state } = useIelDemo();
  const iel = routes.dashboard.iel;

  const ranking = getJobRanking(state, job.id);
  const responderam = ranking.filter(
    (entry) => entry.adherence.total !== null
  ).length;
  const combinam = ranking.filter(
    (entry) => entry.adherence.compatible === true
  ).length;
  const semResposta = ranking.length - responderam;

  const marcados = getReferralListSelection(state, job.id).length;
  const faltamParaFechar = Math.max(0, REFERRAL_LIMIT - marcados);

  const amostra = getCultureSampleProgress(state, job.companyId);
  const perfil = getCompanyCultureProfile(state, job.companyId);
  const pontosAbertos = perfil.filter((axis) => !axis.ready).length;
  const faltamResponder = amostra.total - amostra.answered;

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/vaga:grid-cols-2 @5xl/vaga:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Compatíveis</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {combinam}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />≥ {ADHERENCE_THRESHOLD}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Acima do mínimo do IEL
          </div>
          <div className="text-muted-foreground">
            de {responderam} que responderam
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Sem resposta</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {semResposta}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Clock />
              {plural(CANDIDATE_FIT_DEADLINE_DAYS, 'dia', 'dias')}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Prazo de resposta termina{' '}
            {prazoEm(job.updatedAt, CANDIDATE_FIT_DEADLINE_DAYS)}
          </div>
          <div className="text-muted-foreground">
            quem não responde sai do processo
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Marcados</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {marcados}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              de {REFERRAL_LIMIT}
            </span>
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {faltamParaFechar === 0
              ? 'Remessa fechada'
              : `Faltam ${faltamParaFechar} para fechar a remessa`}
          </div>
          <div className="text-muted-foreground">
            máximo de {REFERRAL_LIMIT} currículos por vaga
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Perfil da empresa</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {amostra.answered}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              de {amostra.total}
            </span>
          </CardTitle>
          {pontosAbertos > 0 ? (
            <CardAction>
              <Badge variant="outline">
                <CircleAlert className="text-[hsl(var(--brand-accent))]" />
                {pontosAbertos} abertos
              </Badge>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {faltamResponder === 0
              ? 'Todos os colaboradores responderam'
              : `${plural(faltamResponder, 'colaborador ainda não respondeu', 'colaboradores ainda não responderam')}`}
          </div>
          <div className="text-muted-foreground">
            {amostra.deadline
              ? `prazo até ${formatarDataCurta(amostra.deadline)} · `
              : null}
            <Link
              href={iel.companies.byId(job.companyId)}
              className="text-foreground underline underline-offset-[3px]"
            >
              cobrar
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
