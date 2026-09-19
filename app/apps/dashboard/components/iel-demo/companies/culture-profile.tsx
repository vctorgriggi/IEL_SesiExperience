'use client';

import {
  CULTURE_RESPONDENT_LABEL,
  CULTURE_SCALE_MAX,
  CULTURE_SCALE_MIN,
  getCultureOptionValue,
  MIN_TEAM_RESPONSES,
  type CultureRespondent
} from '@/features/iel-demo/analysis/culture';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  CULTURE_AXIS_STATE_LABEL,
  getCompanyCultureProfile,
  getCultureReading,
  type CompanyCultureAxisProfile,
  type CultureAxisReading,
  type CultureAxisState
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';

import { Button, cn, FilterNativeSelect, toast } from '@workspace/ui';

import { Chip, Hero, InfoHint, SourceDot } from '../shared/ui';

const STATE_TONE: Record<
  CultureAxisState,
  'neutro' | 'info' | 'positivo' | 'atencao' | 'conflito'
> = {
  convergente: 'positivo',
  divergente: 'conflito',
  'apenas-gestao': 'atencao',
  'consulta-insuficiente': 'atencao',
  'sem-resposta': 'neutro'
};

const STATE_NOTE: Record<CultureAxisState, string> = {
  convergente: 'Gestão e equipe descrevem a mesma prática.',
  divergente:
    'A prática descrita pela gestão não é a que a equipe relata. A diferença fica registrada: é ela que a pessoa vai encontrar no dia a dia.',
  'apenas-gestao':
    'Só há a versão de quem gere a área. Uma resposta única não sustenta a leitura sozinha.',
  'consulta-insuficiente': `A consulta à equipe tem menos de ${MIN_TEAM_RESPONSES} respostas. Poucas respostas não são "a equipe".`,
  'sem-resposta': 'Nenhum papel respondeu este eixo ainda.'
};

/** Proposta da análise: pré-preenchida, com o trecho que a sustenta. */
function SuggestionBlock({
  entry,
  companyId
}: {
  entry: CultureAxisReading;
  companyId: string;
}) {
  const { dispatch } = useIelDemo();
  const suggestion = entry.pendingSuggestion;
  if (!suggestion) return null;

  return (
    <div className="mt-2 rounded-[var(--control-radius)] border border-dashed border-info/40 bg-info/[0.04] p-3">
      <p className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-info">
        Proposta da análise assistida
        <InfoHint label="Montada a partir de texto que a empresa já escreveu, para não exigir que alguém preencha um questionário do zero. Não vale como resposta até ser confirmada." />
      </p>

      <p className="mt-1.5 text-sm text-foreground">
        {entry.question.options.find(
          (option) => option.id === suggestion.optionId
        )?.label ?? suggestion.optionId}
      </p>

      <blockquote className="mt-1.5 border-l-2 border-border pl-2.5 text-xs italic leading-relaxed text-muted-foreground">
        “{suggestion.excerpt}”
      </blockquote>
      <p className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
        <SourceDot sourceId={suggestion.sourceId} />
        {suggestion.sourceLabel}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
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
            toast.success('Traçado confirmado pela empresa.');
          }}
        >
          Confirmar
        </Button>

        <label
          className="sr-only"
          htmlFor={`correct-${entry.question.axisId}`}
        >
          Corrigir a proposta
        </label>
        <FilterNativeSelect
          id={`correct-${entry.question.axisId}`}
          className="h-8 w-64 text-xs"
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
            toast.info('Traçado corrigido pela empresa.');
          }}
        >
          <option value="">Corrigir para…</option>
          {entry.question.options
            .filter((option) => option.id !== suggestion.optionId)
            .map((option) => (
              <option
                key={option.id}
                value={option.id}
              >
                {option.label}
              </option>
            ))}
        </FilterNativeSelect>
      </div>
    </div>
  );
}

/** A média como a tela escreve: uma casa decimal, vírgula. */
function formatMean(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
}

/** Marcador de um papel no trilho do eixo. */
const RESPONDENT_MARK: Record<CultureRespondent, string> = {
  gestao: 'rounded-[3px] bg-chart-2',
  rh: 'rounded-[3px] bg-chart-3',
  equipe: 'rounded-full bg-chart-1'
};

/**
 * O eixo como instrumento, não como lista.
 *
 * Cada papel que respondeu ocupa a sua posição no trilho, entre os dois
 * polos que a própria empresa respondeu — e a distância entre gestão e
 * equipe passa a ser uma coisa que se vê. A dispersão da equipe é desenhada
 * como um rastro em volta do marcador: proporcional a quantas respostas
 * ficaram fora da alternativa mais votada. Uma equipe rachada e uma equipe
 * unânime deixam de ter o mesmo desenho.
 */
function AxisTrack({
  entry,
  profile
}: {
  entry: CultureAxisReading;
  /** O eixo como média: o que o motor de aderência de fato compara. */
  profile: CompanyCultureAxisProfile | undefined;
}) {
  const low = entry.question.options.find(
    (option) => option.value === CULTURE_SCALE_MIN
  );
  const high = entry.question.options.find(
    (option) => option.value === CULTURE_SCALE_MAX
  );

  const marks = entry.voices
    .map((voice) => ({
      voice,
      value: getCultureOptionValue(entry.question.axisId, voice.optionId)
    }))
    .filter(
      (
        mark
      ): mark is { voice: (typeof entry.voices)[number]; value: 1 | 2 | 3 } =>
        mark.value !== null
    );

  const percentOf = (value: number) =>
    ((value - CULTURE_SCALE_MIN) / (CULTURE_SCALE_MAX - CULTURE_SCALE_MIN)) *
    100;

  const description =
    marks.length === 0
      ? `${entry.question.prompt} Ninguém respondeu ainda.`
      : `${entry.question.prompt} ${marks
          .map(
            (mark) =>
              `${CULTURE_RESPONDENT_LABEL[mark.voice.respondent]}: ${mark.voice.optionLabel}`
          )
          .join('. ')}.`;

  /*
    Média do eixo.

    "O fit cultural é a média do que a empresa entende" (00:41:44) — e é essa
    média, não a resposta da gestão, que o motor de aderência compara com a do
    candidato. Desenhá-la aqui é o que torna o traçado conferível contra o
    percentual da outra tela.

    Quando o perfil não fecha (`ready` falso), não há losango: abaixo do
    mínimo de respostas da equipe, uma média seria o retrato de duas pessoas
    apresentado como "a empresa".
  */
  const meanValue = profile?.ready ? (profile.mean ?? null) : null;

  return (
    <div
      role="img"
      aria-label={description}
      className="mt-3 flex items-center gap-2.5"
    >
      <p className="hidden w-[9rem] shrink-0 text-right text-[11px] leading-snug text-muted-foreground md:block">
        {low?.label}
      </p>

      <div className="relative h-10 min-w-0 flex-1">
        <div className="absolute inset-y-0 left-3 right-3">
          <span
            aria-hidden="true"
            className={cn(
              'absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-[var(--radius-pill)]',
              entry.state === 'divergente' ? 'bg-destructive/20' : 'bg-muted'
            )}
          />
          {entry.question.options.map((option) => (
            <span
              key={option.id}
              aria-hidden="true"
              className="absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/20"
              style={{ left: `${percentOf(option.value)}%` }}
            />
          ))}

          {/* Corda entre gestão e equipe: a divergência, desenhada. */}
          {marks.length > 1
            ? (() => {
                const values = marks.map((mark) => percentOf(mark.value));
                const low = Math.min(...values);
                const high = Math.max(...values);
                if (low === high) return null;
                return (
                  <span
                    aria-hidden="true"
                    className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-foreground/25"
                    style={{ left: `${low}%`, width: `${high - low}%` }}
                  />
                );
              })()
            : null}

          {marks.length === 0 ? (
            <span className="absolute inset-0 flex items-center justify-center text-[11px] text-muted-foreground">
              ninguém respondeu
            </span>
          ) : null}

          {marks.map((mark) => {
            // Dispersão: quanto da consulta ficou fora da alternativa mais
            // votada. Só a equipe tem consulta agregada.
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
                    title={`${Math.round(spread * 100)}% da equipe respondeu outra alternativa`}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-chart-1/20"
                    style={{
                      width: `${14 + spread * 40}px`,
                      height: `${14 + spread * 40}px`
                    }}
                  />
                ) : null}
                <span
                  aria-hidden="true"
                  className={cn(
                    'relative block size-3.5 ring-2 ring-card',
                    RESPONDENT_MARK[mark.voice.respondent]
                  )}
                />
              </span>
            );
          })}

          {meanValue !== null ? (
            <span
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${percentOf(meanValue)}%` }}
            >
              <span
                aria-hidden="true"
                title={`Média da empresa neste eixo: ${formatMean(meanValue)}`}
                className="block size-3 rotate-45 bg-foreground/75 ring-2 ring-card"
              />
            </span>
          ) : null}
        </div>
      </div>

      <p className="hidden w-[9rem] shrink-0 text-[11px] leading-snug text-muted-foreground md:block">
        {high?.label}
      </p>
    </div>
  );
}

function AxisBlock({
  entry,
  companyId,
  profile
}: {
  entry: CultureAxisReading;
  companyId: string;
  profile: CompanyCultureAxisProfile | undefined;
}) {
  return (
    <li className="py-4">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h4 className="text-sm font-medium text-foreground">
          {entry.question.prompt}
        </h4>
        <Chip
          tone={STATE_TONE[entry.state]}
          className="ml-auto"
        >
          {CULTURE_AXIS_STATE_LABEL[entry.state]}
        </Chip>
        {profile?.ready === false ? (
          <Chip tone="atencao">
            perfil não fecha — menos de {MIN_TEAM_RESPONSES} respostas da equipe
          </Chip>
        ) : profile?.mean !== null && profile?.mean !== undefined ? (
          <span className="flex items-baseline gap-1.5 text-xs text-muted-foreground">
            <span
              aria-hidden="true"
              className="size-2 shrink-0 translate-y-px rotate-45 bg-foreground/75"
            />
            média: {formatMean(profile.mean)}
          </span>
        ) : null}
      </div>

      <AxisTrack
        entry={entry}
        profile={profile}
      />

      {/* Os polos não cabem nas pontas em telas estreitas. */}
      <p className="mt-1.5 flex justify-between gap-3 text-[11px] leading-snug text-muted-foreground md:hidden">
        <span className="min-w-0">
          {
            entry.question.options.find(
              (option) => option.value === CULTURE_SCALE_MIN
            )?.label
          }
        </span>
        <span className="min-w-0 text-right">
          {
            entry.question.options.find(
              (option) => option.value === CULTURE_SCALE_MAX
            )?.label
          }
        </span>
      </p>

      {entry.voices.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
          {entry.voices.map((voice) => (
            <li
              key={voice.respondent}
              className="flex items-baseline gap-1.5 text-xs"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'size-2 shrink-0 translate-y-px',
                  RESPONDENT_MARK[voice.respondent]
                )}
              />
              <span className="text-muted-foreground">
                {CULTURE_RESPONDENT_LABEL[voice.respondent]}
              </span>
              <span className="text-foreground/85">{voice.optionLabel}</span>
              {voice.respondent === 'equipe' ? (
                <span className="tabular-nums text-muted-foreground">
                  {voice.count} de {voice.total} respostas
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <p
        className={cn(
          'mt-1.5 text-xs leading-relaxed',
          entry.state === 'divergente'
            ? 'text-destructive'
            : 'text-muted-foreground'
        )}
      >
        {STATE_NOTE[entry.state]}
      </p>

      <SuggestionBlock
        entry={entry}
        companyId={companyId}
      />
    </li>
  );
}

/**
 * Traçado cultural declarado pela empresa.
 *
 * Existe para dar ao fit um lado com que comparar o candidato. O enunciado
 * diz que o fit cultural funciona mas custa caro, demora e não escala — então
 * aqui ele não é uma avaliação aplicada de fora: a análise propõe a partir do
 * que a empresa já escreveu, a empresa confirma num clique, e a consulta à
 * equipe entra agregada para que o retrato não seja o de uma pessoa só.
 */
export function CultureProfile({ companyId }: { companyId: string }) {
  const { state } = useIelDemo();
  const reading = getCultureReading(state, companyId);
  const profile = getCompanyCultureProfile(state, companyId);

  const answered = reading.filter(
    (entry) => entry.state !== 'sem-resposta'
  ).length;
  const diverging = reading.filter(
    (entry) => entry.state === 'divergente'
  ).length;

  return (
    <Hero
      as="h2"
      eyebrow="Voz da empresa"
      title="Traçado cultural declarado"
      description="O que a empresa responde sobre como se trabalha nela, nos mesmos eixos usados para ler a aderência dos candidatos. Descreve prática de trabalho, nunca traço das pessoas."
      figures={[
        {
          label: 'Eixos com resposta',
          value: `${answered}/${reading.length}`
        },
        {
          label: 'Gestão e equipe divergem',
          value: diverging,
          tone: diverging > 0 ? 'atencao' : 'default',
          hint:
            diverging > 0
              ? 'A diferença fica registrada: é ela que a pessoa encontra no dia a dia.'
              : undefined
        }
      ]}
      aside={
        <div className="rounded-[var(--card-radius)] border border-border bg-card/70 p-4">
          <p className="iel-eyebrow">Como ler o traçado</p>
          <ul className="mt-2.5 space-y-2 text-xs leading-relaxed text-muted-foreground">
            <li className="flex items-baseline gap-2">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 translate-y-px rounded-[3px] bg-chart-2"
              />
              Onde a gestão (e o RH) posicionam a prática.
            </li>
            <li className="flex items-baseline gap-2">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 translate-y-px rounded-full bg-chart-1"
              />
              Onde a equipe posiciona, com o rastro em volta proporcional a
              quanto a consulta se dispersou.
            </li>
            <li className="flex items-baseline gap-2">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 translate-y-px rotate-45 bg-foreground/75"
              />
              A média da empresa no eixo — é ela que o cálculo de aderência
              compara com a resposta do candidato. Enquanto o perfil não fecha,
              ela não é desenhada.
            </li>
            <li>
              Os extremos do trilho são as próprias alternativas do
              questionário. Um extremo não é melhor que o outro: é outra
              condição de trabalho.
            </li>
          </ul>
        </div>
      }
    >
      <ul className="divide-y divide-border border-t border-border">
        {reading.map((entry) => (
          <AxisBlock
            key={entry.question.axisId}
            entry={entry}
            companyId={companyId}
            profile={profile.find(
              (axis) => axis.axisId === entry.question.axisId
            )}
          />
        ))}
      </ul>

      <p className="border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
        As respostas da equipe são agregadas e não identificam quem respondeu. A
        proposta da análise não substitui a resposta da empresa: ela reduz o
        tempo de preenchimento e fica sujeita a confirmação.
      </p>
    </Hero>
  );
}
