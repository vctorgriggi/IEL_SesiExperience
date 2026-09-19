'use client';

import {
  FIT_AXES,
  getFitAxis,
  type FitAxisId
} from '@/features/iel-demo/analysis/fit-axes';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  AXIS_WEIGHT_LABEL,
  getAxisWeight,
  getJob,
  getPendingAxisWeightSuggestion,
  getWeightLearning
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import type { AxisWeight } from '@/features/iel-demo/types';

import { Button, FilterNativeSelect, toast } from '@workspace/ui';

import { Chip, InfoHint, Panel, PanelHeader, SourceDot } from '../shared/ui';

const WEIGHT_OPTIONS: AxisWeight[] = ['alto', 'medio', 'baixo'];

const WEIGHT_TONE: Record<AxisWeight, 'info' | 'neutro'> = {
  alto: 'info',
  medio: 'neutro',
  baixo: 'neutro'
};

/**
 * Prioridades declaradas para uma vaga.
 *
 * O mesmo eixo não pesa igual em toda vaga, e a empresa é quem sabe qual
 * deles decide a rotina dela. Sem esta tela, ou os cinco eixos valem o mesmo
 * — e o que a empresa considera crítico desaparece no meio — ou o produto
 * arbitra uma ponderação que ninguém declarou.
 *
 * Duas fontes alimentam a decisão, e nenhuma delas decide sozinha: a análise
 * assistida propõe a partir do texto da própria vaga, e os processos já
 * encerrados apontam padrões. Em ambos os casos a proposta fica pendente até
 * alguém confirmar. A referência de mercado ajusta pesos sozinha; aqui não,
 * porque o enunciado exige supervisão humana e porque um peso que mudou sem
 * autor é um peso que ninguém consegue explicar depois.
 */
export function AxisWeights({ jobId }: { jobId: string }) {
  const { state, dispatch } = useIelDemo();
  const job = getJob(jobId);
  if (!job) return null;

  const learning = getWeightLearning(state, jobId);

  function setWeight(axisId: FitAxisId, weight: AxisWeight, message: string) {
    dispatch({
      type: 'set-axis-weight',
      jobId,
      axisId,
      weight,
      at: nowIso()
    });
    toast.success(message);
  }

  const highCount = FIT_AXES.filter(
    (axis) => getAxisWeight(job, axis.id, state) === 'alto'
  ).length;

  return (
    <Panel>
      <PanelHeader
        eyebrow="Definido pela empresa"
        title="Prioridades desta vaga"
        hint="O peso diz quais eixos do contexto de trabalho decidem esta vaga. Ordena a leitura e a atenção do analista; não vira nota, percentual nem ordenação de pessoas."
        meta={
          <>
            {highCount} de {FIT_AXES.length}{' '}
            {highCount === 1 ? 'eixo marcado' : 'eixos marcados'} como
            prioritários.
          </>
        }
      />

      {learning.length > 0 ? (
        <div className="mt-4 space-y-2">
          {learning.map((entry) => (
            <div
              key={entry.axisId}
              className="rounded-[var(--control-radius)] border border-dashed border-warning/50 bg-warning/[0.05] p-3"
            >
              <p className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-warning">
                Padrão observado nos processos desta vaga
                <InfoHint label="Identificado a partir dos encaminhamentos já decididos pela empresa. A central aponta o padrão e propõe; o peso só muda quando alguém confirma." />
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                Em {entry.occurrences}{' '}
                {entry.occurrences === 1
                  ? 'encaminhamento que não avançou'
                  : 'encaminhamentos que não avançaram'}
                , havia divergência em{' '}
                {getFitAxis(entry.axisId).label.toLowerCase()}. Proposta: elevar
                o peso para Alto.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {entry.rationale}
              </p>
              <Button
                size="sm"
                className="mt-2.5"
                onClick={() =>
                  setWeight(
                    entry.axisId,
                    entry.suggestedWeight,
                    'Peso elevado a partir do padrão observado.'
                  )
                }
              >
                Confirmar o ajuste
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      <ul className="mt-4 divide-y divide-border">
        {FIT_AXES.map((axis) => {
          const weight = getAxisWeight(job, axis.id, state);
          const suggestion = getPendingAxisWeightSuggestion(
            state,
            job,
            axis.id
          );

          return (
            <li
              key={axis.id}
              className="py-3.5"
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h4 className="text-sm font-medium text-foreground">
                  {axis.label}
                </h4>
                <InfoHint label={axis.description} />
                <Chip
                  tone={WEIGHT_TONE[weight]}
                  className="ml-auto"
                >
                  {AXIS_WEIGHT_LABEL[weight]}
                </Chip>
              </div>

              {suggestion ? (
                <div className="mt-2 rounded-[var(--control-radius)] border border-dashed border-info/40 bg-info/[0.04] p-3">
                  <p className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-info">
                    Proposta da análise assistida
                    <InfoHint label="Derivada do texto que a empresa já escreveu na descrição da vaga, para não exigir mais um formulário. Não vale como decisão até ser confirmada." />
                  </p>
                  <p className="mt-1.5 text-sm text-foreground">
                    {AXIS_WEIGHT_LABEL[suggestion.weight]}
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
                      onClick={() =>
                        setWeight(
                          axis.id,
                          suggestion.weight,
                          'Peso confirmado pela empresa.'
                        )
                      }
                    >
                      Confirmar
                    </Button>
                    <label
                      className="sr-only"
                      htmlFor={`peso-${axis.id}`}
                    >
                      Corrigir o peso proposto
                    </label>
                    <FilterNativeSelect
                      id={`peso-${axis.id}`}
                      className="h-8 w-48 text-xs"
                      value=""
                      onValueChange={(value) => {
                        if (!value) return;
                        setWeight(
                          axis.id,
                          value as AxisWeight,
                          'Peso corrigido pela empresa.'
                        );
                      }}
                    >
                      <option value="">Corrigir para…</option>
                      {WEIGHT_OPTIONS.filter(
                        (option) => option !== suggestion.weight
                      ).map((option) => (
                        <option
                          key={option}
                          value={option}
                        >
                          {AXIS_WEIGHT_LABEL[option]}
                        </option>
                      ))}
                    </FilterNativeSelect>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label
                    className="sr-only"
                    htmlFor={`peso-${axis.id}`}
                  >
                    Definir o peso de {axis.label}
                  </label>
                  <FilterNativeSelect
                    id={`peso-${axis.id}`}
                    className="h-8 w-48 text-xs"
                    value={weight}
                    onValueChange={(value) =>
                      setWeight(
                        axis.id,
                        value as AxisWeight,
                        'Peso definido pela empresa.'
                      )
                    }
                  >
                    {WEIGHT_OPTIONS.map((option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {AXIS_WEIGHT_LABEL[option]}
                      </option>
                    ))}
                  </FilterNativeSelect>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-4 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
        O peso é declarado pela empresa e serve para ordenar a atenção da
        análise. Ele não multiplica nada: não existe nota de aderência,
        percentual de compatibilidade nem ordenação de candidatos por qualidade.
      </p>
    </Panel>
  );
}
