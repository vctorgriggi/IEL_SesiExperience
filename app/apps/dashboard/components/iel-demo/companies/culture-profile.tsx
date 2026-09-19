'use client';

import { useState } from 'react';
import {
  CULTURE_SCALE_MAX,
  CULTURE_SCALE_MIN,
  getCultureOptionValue,
  MIN_TEAM_RESPONSES
} from '@/features/iel-demo/analysis/culture';
import { COPY, type EstadoDeLeitura } from '@/features/iel-demo/copy';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  AXIS_WEIGHT_LABEL,
  CULTURE_DISPLAY_RESPONDENT_LABEL,
  getAxisWeights,
  getCompanyCultureProfile,
  getCultureDisplayVoices,
  getCultureReading,
  getCultureSampleProgress,
  getJob,
  MIN_ROLE_RESPONSES_TO_SHOW,
  type CompanyCultureAxisProfile,
  type CultureAxisReading,
  type CultureDisplayRespondent,
  type CultureDisplayVoice,
  type CultureDisplayVoices,
  type CultureSampleProgress
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import {
  AlertCircle,
  ChevronDown,
  CircleCheck,
  CircleDashed,
  X
} from 'lucide-react';

import { toast } from '@workspace/ui';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@workspace/ui/shadcn/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@workspace/ui/shadcn/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@workspace/ui/shadcn/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@workspace/ui/shadcn/tooltip';

import {
  BADGE_DE_ESTADO,
  TONS_DA_EMPRESA,
  type EstadoDeCor
} from '../metricas/cores';

/**
 * Como a empresa trabalha, em cinco linhas de tabela.
 *
 * Uma linha por ponto do dia a dia, e em cada linha três coisas: o que a
 * equipe diz (a alternativa que a média descreve), o trilho em que gestão,
 * equipe e média ocupam posições diferentes, e quantas respostas sustentam
 * aquilo. A dispersão da equipe é a faixa clara em volta do marcador — uma
 * equipe rachada e uma equipe unânime deixam de ter o mesmo desenho.
 *
 * A mesma tabela serve a tela da empresa e a aba "Como a empresa trabalha" da
 * vaga; com `jobId`, cada ponto ganha o peso que aquela vaga declarou, porque
 * é esse peso que muda o percentual que a mesa de seleção mostra ao lado.
 *
 * O trilho nunca desenha uma pessoa: os marcadores vêm de
 * `getCultureDisplayVoices`, que junta gestão e RH quando um deles é uma
 * pessoa só e esconde a equipe abaixo do mínimo de respostas.
 */

/** Marcador de cada grupo no trilho. Quadrado para gestão/RH, círculo para equipe. */
const RESPONDENT_MARK: Record<CultureDisplayRespondent, string> = {
  gestao: cn('rounded-[3px]', TONS_DA_EMPRESA.gestao),
  rh: cn('rounded-[3px]', TONS_DA_EMPRESA.gestao),
  lideranca: cn('rounded-[3px]', TONS_DA_EMPRESA.gestao),
  equipe: cn('rounded-full', TONS_DA_EMPRESA.equipe)
};

/**
 * O estado da linha, em palavra comum.
 *
 * Quatro estados e nada além: a equipe respondeu o bastante e as leituras
 * coincidem (combina), gestão e equipe dizem coisas diferentes (difere),
 * faltam respostas, ou ninguém respondeu. Silêncio não é amostra
 * insuficiente, e o glossário tem palavra para cada um.
 */
function readRowState(
  entry: CultureAxisReading,
  profile: CompanyCultureAxisProfile | undefined
): EstadoDeLeitura {
  if (entry.voices.length === 0) return 'sem-resposta';
  if (entry.state === 'divergente') return 'difere';
  if (profile?.ready && entry.state === 'convergente') return 'combina';
  return 'faltando';
}

const ESTADO_ICON: Record<EstadoDeLeitura, typeof CircleCheck> = {
  combina: CircleCheck,
  difere: X,
  faltando: AlertCircle,
  'sem-resposta': CircleDashed
};

/** Estado → tom: fundo tingido, texto e ícone no mesmo tom, sempre com a palavra. */
const ESTADO_TOM: Record<EstadoDeLeitura, EstadoDeCor> = {
  combina: 'combina',
  difere: 'difere',
  faltando: 'atencao',
  'sem-resposta': 'neutro'
};

function EstadoBadge({ estado }: { estado: EstadoDeLeitura }) {
  const Icon = ESTADO_ICON[estado];
  return (
    <Badge
      variant="outline"
      className={cn('gap-1.5', BADGE_DE_ESTADO[ESTADO_TOM[estado]])}
    >
      <Icon
        aria-hidden="true"
        className="size-3"
      />
      {COPY.estado(estado)}
    </Badge>
  );
}

/** A alternativa que a média descreve: a mais próxima do valor médio. */
function meanOptionLabel(
  entry: CultureAxisReading,
  mean: number
): string | null {
  const options = entry.question.options;
  const nearest = options.reduce<(typeof options)[number] | null>(
    (melhor, option) =>
      melhor === null ||
      Math.abs(option.value - mean) < Math.abs(melhor.value - mean)
        ? option
        : melhor,
    null
  );
  return nearest?.label ?? null;
}

/**
 * O trilho do ponto: gestão ■, equipe ● e a média ◆ entre os dois polos.
 *
 * A média só aparece quando o perfil fecha naquele ponto. Abaixo do mínimo de
 * respostas da equipe, uma média seria o retrato de duas pessoas apresentado
 * como "a empresa".
 */
function AxisTrack({
  entry,
  display,
  profile
}: {
  entry: CultureAxisReading;
  display: CultureDisplayVoices;
  profile: CompanyCultureAxisProfile | undefined;
}) {
  const marks = display.voices
    .map((voice) => ({
      voice,
      value: getCultureOptionValue(entry.question.axisId, voice.optionId)
    }))
    .filter(
      (mark): mark is { voice: CultureDisplayVoice; value: 1 | 2 | 3 } =>
        mark.value !== null
    );

  const percentOf = (value: number) =>
    ((value - CULTURE_SCALE_MIN) / (CULTURE_SCALE_MAX - CULTURE_SCALE_MIN)) *
    100;

  const mean = profile?.ready ? (profile.mean ?? null) : null;

  const descricao =
    marks.length === 0
      ? entry.voices.length === 0
        ? 'Ninguém respondeu este ponto.'
        : 'Poucas respostas por grupo para mostrar sem identificar ninguém.'
      : marks
          .map(
            (mark) =>
              `${CULTURE_DISPLAY_RESPONDENT_LABEL[mark.voice.respondent]}: ${mark.voice.optionLabel}`
          )
          .join('. ');

  return (
    <div
      role="img"
      aria-label={descricao}
      className="relative h-4 w-full min-w-[120px]"
    >
      {/* Os marcadores vivem numa faixa recuada: no 0% e no 100% metade do
          quadrado ficaria fora da coluna. */}
      <div className="absolute inset-x-2 inset-y-0">
        <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" />

        {marks.map((mark) => {
          // Dispersão: quanto da consulta ficou fora da alternativa mais votada.
          // Só a equipe responde em conjunto, então só ela tem faixa.
          const spread =
            mark.voice.respondent === 'equipe' && mark.voice.total > 0
              ? 1 - mark.voice.count / mark.voice.total
              : 0;

          return (
            <span
              key={mark.voice.respondent}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${percentOf(mark.value)}%` }}
            >
              {spread > 0 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute left-1/2 top-1/2 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full',
                    TONS_DA_EMPRESA.dispersao
                  )}
                  style={{ width: `${16 + spread * 44}px` }}
                />
              ) : null}
              <span
                aria-hidden="true"
                className={cn(
                  'relative block size-3 ring-2 ring-background',
                  RESPONDENT_MARK[mark.voice.respondent]
                )}
              />
            </span>
          );
        })}

        {mean !== null ? (
          <span
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${percentOf(mean)}%` }}
          >
            <span
              aria-hidden="true"
              className={cn(
                'block size-3 rotate-45 ring-2 ring-background',
                TONS_DA_EMPRESA.media
              )}
            />
          </span>
        ) : null}
      </div>
    </div>
  );
}

/**
 * "7 de 10 da equipe": só respostas de equipe, as que fecham o ponto.
 *
 * O denominador é o de convites **de equipe**. Antes era o total de convites,
 * gestão e RH incluídos, e a célula dizia "4 de 6 responderam" numa empresa em
 * que as quatro pessoas da equipe já tinham respondido — dois números de
 * unidades diferentes na mesma fração.
 */
function respondentsLabel(
  entry: CultureAxisReading,
  progress: CultureSampleProgress
): string {
  const equipe = entry.voices.find((voice) => voice.respondent === 'equipe');
  const respondidas = equipe?.total ?? 0;
  const total = Math.max(progress.byRole.equipe.total, respondidas);
  return `${respondidas} de ${total} da equipe`;
}

/** Proposta da análise: pré-preenchida, com o trecho que a sustenta. */
function SuggestionRow({
  entry,
  companyId
}: {
  entry: CultureAxisReading;
  companyId: string;
}) {
  const { dispatch } = useIelDemo();
  const suggestion = entry.pendingSuggestion;
  if (!suggestion) return null;

  const sugerida = entry.question.options.find(
    (option) => option.id === suggestion.optionId
  );

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-sm font-medium">
          {COPY.axis(entry.question.axisId)}
        </p>
        <p className="text-sm text-muted-foreground">
          {sugerida?.label ?? suggestion.optionId}
        </p>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="text-left text-xs text-muted-foreground underline underline-offset-4">
              vem de: {suggestion.sourceLabel}
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              “{suggestion.excerpt}”
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => {
            dispatch({
              type: 'answer-culture',
              companyId,
              axisId: entry.question.axisId,
              optionId: suggestion.optionId,
              at: nowIso()
            });
            toast.success('Resposta confirmada pela empresa.');
          }}
        >
          Confirmar
        </Button>
        <Select
          value=""
          onValueChange={(value) => {
            if (!value) return;
            dispatch({
              type: 'answer-culture',
              companyId,
              axisId: entry.question.axisId,
              optionId: value,
              at: nowIso()
            });
            toast.info('Resposta corrigida pela empresa.');
          }}
        >
          <SelectTrigger
            size="sm"
            className="w-[15rem]"
            aria-label={`Corrigir ${COPY.axis(entry.question.axisId)}`}
          >
            <SelectValue placeholder="Corrigir para…" />
          </SelectTrigger>
          <SelectContent>
            {entry.question.options
              .filter((option) => option.id !== suggestion.optionId)
              .map((option) => (
                <SelectItem
                  key={option.id}
                  value={option.id}
                >
                  {option.label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/** Legenda do trilho: sem ela os três marcadores são três pontinhos. */
function TrackLegend({ withheld }: { withheld: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span
          className={cn('size-2.5 rounded-[2px]', TONS_DA_EMPRESA.gestao)}
        />
        gestão/RH
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className={cn('size-2.5 rounded-full', TONS_DA_EMPRESA.equipe)} />
        equipe
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className={cn('size-2.5 rotate-45', TONS_DA_EMPRESA.media)} />
        média
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className={cn('h-2.5 w-5 rounded-full', TONS_DA_EMPRESA.dispersao)}
        />
        dispersão da equipe
      </span>
      {withheld ? (
        <span>
          · grupo com menos de {MIN_ROLE_RESPONSES_TO_SHOW} respostas (equipe:{' '}
          {MIN_TEAM_RESPONSES}) não aparece sozinho, só na média
        </span>
      ) : null}
    </div>
  );
}

/**
 * Os cinco pontos do dia a dia da empresa, como tabela.
 *
 * Reutilizada pela tela da vaga: `jobId` acrescenta o peso que aquela vaga
 * declarou para cada ponto — é o peso que explica por que dois candidatos com
 * as mesmas respostas têm percentuais diferentes em vagas diferentes.
 */
export function CompanyCultureTable({
  companyId,
  jobId
}: {
  companyId: string;
  jobId?: string;
}) {
  const { state, persona } = useIelDemo();
  const [sugestoesAbertas, setSugestoesAbertas] = useState(false);

  const reading = getCultureReading(state, companyId);
  const profile = getCompanyCultureProfile(state, companyId);
  const progress = getCultureSampleProgress(state, companyId);

  const job = jobId ? getJob(jobId) : null;
  const weights = job ? getAxisWeights(state, job) : null;

  const sugestoes = reading.filter((entry) => entry.pendingSuggestion !== null);
  // Confirmar ou corrigir uma sugestão é responder pela empresa: quem faz isso
  // é o analista com o gestor ao lado, na tela da empresa — não a vaga, que
  // só lê a cultura com os próprios pesos, nem a tela que o candidato abre.
  const podeResponder = persona.kind !== 'candidato' && !jobId;

  const displays = new Map(
    reading.map((entry) => [
      entry.question.axisId,
      getCultureDisplayVoices(state, companyId, entry.question.axisId)
    ])
  );
  const algumOculto = [...displays.values()].some(
    (display) => display.withheld > 0
  );

  return (
    <div className="flex flex-col gap-4">
      {sugestoes.length > 0 && podeResponder ? (
        <Collapsible
          open={sugestoesAbertas}
          onOpenChange={setSugestoesAbertas}
          className="rounded-lg border"
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 p-3 text-left">
            <span className="text-sm font-medium">
              {plural(
                sugestoes.length,
                'sugestão para confirmar',
                'sugestões para confirmar'
              )}
            </span>
            <ChevronDown
              className={cn(
                'size-4 shrink-0 text-muted-foreground transition-transform',
                sugestoesAbertas && 'rotate-180'
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-2 border-t p-3">
            <p className="text-xs text-muted-foreground">
              Montadas a partir de texto que a empresa já escreveu. Não valem
              como resposta até alguém confirmar.
            </p>
            {sugestoes.map((entry) => (
              <SuggestionRow
                key={entry.question.axisId}
                entry={entry}
                companyId={companyId}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      ) : null}

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableCaption className="sr-only">
            Como a empresa trabalha, ponto a ponto: o que a equipe diz, a
            leitura por grupo, quantas respostas e o estado de cada ponto
          </TableCaption>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead
                scope="col"
                className="w-[14rem]"
              >
                Ponto do dia a dia
              </TableHead>
              <TableHead scope="col">A equipe diz</TableHead>
              <TableHead
                scope="col"
                className="w-[9rem]"
              >
                Leitura
              </TableHead>
              <TableHead
                scope="col"
                className="w-[10rem]"
              >
                Respostas
              </TableHead>
              <TableHead
                scope="col"
                className="w-[12rem]"
              >
                Estado
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reading.map((entry) => {
              const axisProfile = profile.find(
                (axis) => axis.axisId === entry.question.axisId
              );
              const mean = axisProfile?.ready
                ? (axisProfile.mean ?? null)
                : null;
              const peso = weights?.[entry.question.axisId];

              return (
                <TableRow key={entry.question.axisId}>
                  <TableCell className="align-middle">
                    <span className="font-medium">
                      {COPY.axis(entry.question.axisId)}
                    </span>
                    {peso ? (
                      <span className="block text-xs text-muted-foreground">
                        {AXIS_WEIGHT_LABEL[peso]} nesta vaga
                      </span>
                    ) : null}
                  </TableCell>
                  {/*
                   * Um travessão não diz de quem é a falta. Abaixo do mínimo
                   * de respostas a célula escreve o motivo: a consulta existe,
                   * só ainda não sustenta uma leitura da equipe.
                   */}
                  <TableCell className="align-middle text-muted-foreground">
                    {(mean === null ? null : meanOptionLabel(entry, mean)) ??
                      'sem respostas suficientes'}
                  </TableCell>
                  <TableCell className="align-middle">
                    <AxisTrack
                      entry={entry}
                      display={
                        displays.get(entry.question.axisId) ?? {
                          voices: [],
                          withheld: 0
                        }
                      }
                      profile={axisProfile}
                    />
                  </TableCell>
                  <TableCell className="align-middle tabular-nums text-muted-foreground">
                    {respondentsLabel(entry, progress)}
                  </TableCell>
                  <TableCell className="align-middle">
                    <EstadoBadge estado={readRowState(entry, axisProfile)} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          {/*
           * A legenda do trilho fica no rodapé da tabela, uma vez: ela
           * explica uma coluna, e repetir os três símbolos em cada linha
           * ocuparia mais espaço do que o dado que eles marcam.
           */}
          <TableFooter className="bg-transparent">
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={5}
                className="py-2"
              >
                <TrackLegend withheld={algumOculto} />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
