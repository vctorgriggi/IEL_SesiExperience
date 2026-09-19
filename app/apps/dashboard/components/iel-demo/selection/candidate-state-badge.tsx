'use client';

import { ADHERENCE_THRESHOLD } from '@/features/iel-demo/analysis/adherence';
import type { JobRankingEntry } from '@/features/iel-demo/state/selectors';
import { RESCUE_TECHNICAL_CEILING } from '@/features/iel-demo/state/selectors';
import { Activity, CircleCheck, CircleDashed, Loader, X } from 'lucide-react';

import { Badge } from '@workspace/ui/shadcn/badge';

/**
 * Uma linha da lista diz o estado em palavra, nunca só em cor.
 *
 * A ordem das perguntas é a da decisão de quem lê: primeiro se a pessoa
 * respondeu (silêncio não é nota baixa), depois se ela é um resgate — alguém
 * que o filtro técnico da origem descartaria e o encontro com a empresa
 * recupera —, depois em quantos dos cinco pontos a medida foi possível, e só
 * então o veredito.
 */
export type CandidateState =
  | 'sem-resposta'
  | 'resgate'
  | 'parcial'
  | 'combina'
  | 'abaixo';

/** Em quantos dos cinco pontos a **pessoa** respondeu. */
export function respondidosPelaPessoa(entry: JobRankingEntry): number {
  return entry.adherence.byAxis.filter((axis) => axis.candidateValue !== null)
    .length;
}

export function readCandidateState(entry: JobRankingEntry): CandidateState {
  const { adherence, technicalMatch } = entry;

  if (adherence.total === null) return 'sem-resposta';

  if (
    technicalMatch !== null &&
    technicalMatch < RESCUE_TECHNICAL_CEILING &&
    adherence.total >= ADHERENCE_THRESHOLD
  ) {
    return 'resgate';
  }

  // O que falta aqui é resposta da pessoa, não do outro lado: um ponto que a
  // empresa ainda não fechou é pendência da empresa, e o cartão do perfil já
  // cobra isso. Contar os dois na mesma etiqueta faria toda a lista parecer
  // incompleta por causa de uma consulta que ninguém pediu a esta pessoa.
  if (respondidosPelaPessoa(entry) < adherence.coverage.totalAxes) {
    return 'parcial';
  }

  return adherence.compatible ? 'combina' : 'abaixo';
}

export function CandidateStateBadge({ entry }: { entry: JobRankingEntry }) {
  const estado = readCandidateState(entry);
  const { totalAxes } = entry.adherence.coverage;
  const respondidos = respondidosPelaPessoa(entry);

  if (estado === 'sem-resposta') {
    return (
      <Badge
        variant="outline"
        className="px-1.5 text-muted-foreground"
      >
        <CircleDashed className="text-muted-foreground" />
        Ainda não respondeu
      </Badge>
    );
  }

  if (estado === 'resgate') {
    return (
      <Badge
        variant="outline"
        className="px-1.5 text-muted-foreground"
      >
        <Activity className="text-[hsl(var(--brand-accent))]" />
        Resgate
      </Badge>
    );
  }

  if (estado === 'parcial') {
    return (
      <Badge
        variant="outline"
        className="px-1.5 text-muted-foreground"
      >
        <Loader className="text-muted-foreground" />
        {respondidos} de {totalAxes} pontos
      </Badge>
    );
  }

  if (estado === 'abaixo') {
    return (
      <Badge
        variant="outline"
        className="px-1.5 text-muted-foreground"
      >
        <X className="text-destructive" />
        Abaixo de {ADHERENCE_THRESHOLD}%
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="px-1.5 text-muted-foreground"
    >
      <CircleCheck className="fill-green-500 stroke-background dark:fill-green-400" />
      Combina
    </Badge>
  );
}
