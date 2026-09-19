'use client';

import { ADHERENCE_THRESHOLD } from '@/features/iel-demo/analysis/adherence';
import type { JobRankingEntry } from '@/features/iel-demo/state/selectors';
import { RESCUE_TECHNICAL_CEILING } from '@/features/iel-demo/state/selectors';
import { Activity, CircleCheck, CircleDashed, Loader, X } from 'lucide-react';

import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';

import { BADGE_DE_ESTADO, type EstadoDeCor } from '../metricas/cores';

/**
 * Uma linha da lista diz o estado em palavra, nunca só em cor.
 *
 * A ordem das perguntas é a da decisão de quem lê: primeiro se a pessoa
 * respondeu (silêncio não é nota baixa), depois se ela é um resgate — alguém
 * que o filtro técnico da origem descartaria e o encontro com a empresa
 * recupera —, depois em quantos dos 10 temas a medida foi possível, e só
 * então o veredito.
 */
export type CandidateState =
  | 'sem-resposta'
  | 'resgate'
  | 'parcial'
  | 'combina'
  | 'abaixo';

/** Em quantos dos 10 temas a **pessoa** respondeu. */
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

/** Estado na lista → tom do badge (fundo tingido, texto e ícone no mesmo tom). */
const TOM_DO_ESTADO: Record<CandidateState, EstadoDeCor> = {
  'sem-resposta': 'neutro',
  resgate: 'atencao',
  parcial: 'neutro',
  abaixo: 'atencao',
  combina: 'combina'
};

const ICONE_DO_ESTADO: Record<CandidateState, typeof CircleCheck> = {
  'sem-resposta': CircleDashed,
  resgate: Activity,
  parcial: Loader,
  abaixo: X,
  combina: CircleCheck
};

export function CandidateStateBadge({ entry }: { entry: JobRankingEntry }) {
  const estado = readCandidateState(entry);
  const { totalAxes } = entry.adherence.coverage;
  const respondidos = respondidosPelaPessoa(entry);
  const Icone = ICONE_DO_ESTADO[estado];

  const rotulo: Record<CandidateState, string> = {
    'sem-resposta': 'Ainda não respondeu',
    resgate: 'Resgate',
    parcial: `${respondidos} de ${totalAxes} pontos`,
    abaixo: `Abaixo de ${ADHERENCE_THRESHOLD}%`,
    combina: 'Combina'
  };

  return (
    <Badge
      variant="outline"
      className={cn('px-1.5', BADGE_DE_ESTADO[TOM_DO_ESTADO[estado]])}
    >
      <Icone aria-hidden="true" />
      {rotulo[estado]}
    </Badge>
  );
}
