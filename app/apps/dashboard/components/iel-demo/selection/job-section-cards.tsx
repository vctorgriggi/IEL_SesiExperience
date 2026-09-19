'use client';

import { ADHERENCE_THRESHOLD } from '@/features/iel-demo/analysis/adherence';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  CANDIDATE_FIT_DEADLINE_DAYS,
  getJobRanking,
  getReferralListSelection,
  getRescueCandidates,
  REFERRAL_LIMIT,
  RESCUE_TECHNICAL_CEILING
} from '@/features/iel-demo/state/selectors';
import type { Job } from '@/features/iel-demo/types';
import { Activity, Clock, TrendingUp } from 'lucide-react';

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
 * Os quatro números que abrem a vaga — todos **desta vaga**.
 *
 * O rótulo é curto de propósito: com o selo ocupando o canto direito do
 * cartão, uma descrição longa quebrava em duas linhas e desalinhava os quatro
 * números. Quem lê já tem o contexto da vaga no cabeçalho — "Compatíveis"
 * basta, e o rodapé do cartão diz o resto.
 *
 * Nenhum deles é um indicador de desempenho: os quatro são pendências. Quantos
 * já dá para enviar, quantos ainda não responderam, quantos estão marcados
 * (o limite de 5 é por vaga, R6) e quantos o filtro técnico descartaria mas
 * combinam com a empresa. Quem abre a tela precisa saber o que falta para
 * fechar a remessa, e não como a vaga vai.
 *
 * O andamento da consulta à equipe já esteve aqui como quarto cartão, e saiu:
 * "7 de 10 colaboradores responderam" é dado da empresa, igual em todas as
 * vagas dela, e "cobrar" é ação da tela da empresa. Na vaga ele virou uma
 * linha de contexto abaixo do subtítulo, com link para a empresa.
 */
export function JobSectionCards({
  job,
  onOpenRescue
}: {
  job: Job;
  /** Leva a tabela de candidatos para a aba Resgate. */
  onOpenRescue: () => void;
}) {
  const { state } = useIelDemo();

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

  const resgate = getRescueCandidates(state, job.id).length;

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

      <Card
        className="@container/card cursor-pointer transition-colors hover:border-foreground/20 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        role="button"
        tabIndex={0}
        aria-label={`Ver ${plural(resgate, 'pessoa', 'pessoas')} na aba Resgate`}
        onClick={onOpenRescue}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpenRescue();
          }
        }}
      >
        <CardHeader>
          <CardDescription>Resgate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {resgate}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              {resgate === 1 ? 'pessoa' : 'pessoas'}
            </span>
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Activity />
              combinam
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Abaixo de {RESCUE_TECHNICAL_CEILING}% nos requisitos
          </div>
          <div className="text-muted-foreground">
            {resgate === 0
              ? 'ninguém para rever agora'
              : 'vale uma segunda olhada'}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
