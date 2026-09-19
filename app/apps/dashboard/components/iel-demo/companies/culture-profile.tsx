'use client';

import {
  CULTURE_RESPONDENT_LABEL,
  MIN_TEAM_RESPONSES
} from '@/features/iel-demo/analysis/culture';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  CULTURE_AXIS_STATE_LABEL,
  getCultureReading,
  type CultureAxisReading,
  type CultureAxisState
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';

import { Button, cn, FilterNativeSelect, toast } from '@workspace/ui';

import { Chip, InfoHint, Panel, PanelHeader, SourceDot } from '../shared/ui';

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

function AxisBlock({
  entry,
  companyId
}: {
  entry: CultureAxisReading;
  companyId: string;
}) {
  return (
    <li className="py-3.5">
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
      </div>

      {entry.voices.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {entry.voices.map((voice) => (
            <li
              key={voice.respondent}
              className="flex flex-wrap items-baseline gap-x-2 text-xs"
            >
              <span className="w-28 shrink-0 text-muted-foreground">
                {CULTURE_RESPONDENT_LABEL[voice.respondent]}
              </span>
              <span className="text-foreground/85">{voice.optionLabel}</span>
              {voice.respondent === 'equipe' ? (
                <span className="text-muted-foreground tabular-nums">
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

  const answered = reading.filter(
    (entry) => entry.state !== 'sem-resposta'
  ).length;
  const diverging = reading.filter(
    (entry) => entry.state === 'divergente'
  ).length;

  return (
    <Panel>
      <PanelHeader
        eyebrow="Voz da empresa"
        title="Traçado cultural declarado"
        hint="O que a empresa responde sobre como se trabalha nela, nos mesmos eixos usados para ler a aderência dos candidatos. Descreve prática de trabalho, nunca traço das pessoas."
        meta={
          <>
            {answered} de {reading.length} eixos com resposta
            {diverging > 0
              ? ` · ${diverging} com divergência entre gestão e equipe`
              : ''}
            .
          </>
        }
      />
      <ul className="mt-4 divide-y divide-border">
        {reading.map((entry) => (
          <AxisBlock
            key={entry.question.axisId}
            entry={entry}
            companyId={companyId}
          />
        ))}
      </ul>

      <p className="mt-4 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
        As respostas da equipe são agregadas e não identificam quem respondeu. A
        proposta da análise não substitui a resposta da empresa: ela reduz o
        tempo de preenchimento e fica sujeita a confirmação.
      </p>
    </Panel>
  );
}
