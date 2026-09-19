'use client';

import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getCompany,
  getCultureReading,
  getFitReading,
  type CultureAxisReading,
  type FitReadingEntry
} from '@/features/iel-demo/state/selectors';
import type { CriterionState, Job } from '@/features/iel-demo/types';

import { cn } from '@workspace/ui';

import { CriterionStateHeadline } from '../shared/criterion-state-badge';
import {
  formatDate,
  InfoHint,
  Panel,
  PanelHeader,
  SourceDot
} from '../shared/ui';

const CONDITION_STATUS_LABEL: Record<string, string> = {
  confirmado: 'confirmado pelo gestor',
  'da-descricao': 'da descrição da vaga',
  'a-confirmar': 'a confirmar'
};

const MISSING_LABEL: Record<string, string> = {
  empresa: 'A equipe ainda não informou.',
  candidato: 'A pessoa ainda não declarou.',
  ambos: 'Nenhum dos dois lados informou.'
};

/** Cor do eixo central, que carrega o estado do encontro entre os dois lados. */
const SPINE_CLASS: Record<CriterionState, string> = {
  alinhamento: 'bg-success',
  'a-esclarecer': 'bg-warning',
  divergencia: 'bg-destructive',
  'sem-informacao': 'bg-border',
  'nao-se-aplica': 'bg-border'
};

function SideText({
  align,
  value,
  origin,
  sourceId,
  updatedAt,
  missing
}: {
  align: 'left' | 'right';
  value?: string;
  origin?: string;
  sourceId?: string;
  updatedAt?: string;
  missing?: string;
}) {
  const alignment = align === 'right' ? 'text-right' : 'text-left';
  const rowAlignment = align === 'right' ? 'justify-end' : 'justify-start';

  if (!value) {
    return (
      <p
        className={cn(
          'inline-flex items-center gap-1.5 rounded-[var(--control-radius)] border border-dashed border-border px-2.5 py-1 text-xs leading-relaxed text-muted-foreground',
          align === 'right' ? 'float-right' : ''
        )}
      >
        {missing}
      </p>
    );
  }

  return (
    <>
      <p className={cn('text-sm leading-relaxed text-foreground', alignment)}>
        {value}
      </p>
      <p
        className={cn(
          'mt-1.5 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground',
          rowAlignment
        )}
      >
        {sourceId ? <SourceDot sourceId={sourceId} /> : null}
        {origin}
        {updatedAt ? <span>· {formatDate(updatedAt)}</span> : null}
      </p>
    </>
  );
}

/**
 * Um eixo: a equipe de um lado, a pessoa do outro, e no meio o estado do
 * encontro entre os dois.
 *
 * A forma é a afirmação. Enquanto o fit era uma lista como qualquer outra,
 * nada na tela dizia que ali havia duas partes se medindo — e é justamente
 * isso que o desafio pede para tornar legível.
 */
function AxisRow({
  entry,
  culture
}: {
  entry: FitReadingEntry;
  culture: CultureAxisReading | undefined;
}) {
  return (
    <li className="py-6 first:pt-1 last:pb-1">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h3 className="iel-display text-base text-foreground">
          {entry.axis.label}
        </h3>
        <InfoHint label={entry.axis.description} />
        <CriterionStateHeadline
          state={entry.state}
          className="ml-auto"
        />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
        <div className="min-w-0 pr-5">
          <p className="iel-eyebrow mb-1.5 text-right">A equipe informa</p>
          <SideText
            align="right"
            value={entry.condition?.value}
            origin={
              entry.condition
                ? CONDITION_STATUS_LABEL[entry.condition.status]
                : undefined
            }
            updatedAt={entry.condition?.updatedAt}
            missing={
              entry.missingSide === 'empresa' || entry.missingSide === 'ambos'
                ? MISSING_LABEL.empresa
                : undefined
            }
          />
        </div>

        {/* Eixo central: a única coluna colorida da linha. */}
        <div
          aria-hidden="true"
          className="relative flex w-0 flex-col items-center"
        >
          <span className="w-px flex-1 bg-border" />
          <span
            className={cn(
              'my-1.5 size-2.5 shrink-0 rounded-full ring-4 ring-card',
              SPINE_CLASS[entry.state]
            )}
          />
          <span className="w-px flex-1 bg-border" />
        </div>

        <div className="min-w-0 pl-5">
          <p className="iel-eyebrow mb-1.5">A pessoa declara</p>
          <SideText
            align="left"
            value={entry.preference?.value}
            origin={entry.preference?.origin}
            sourceId={entry.preference?.sourceId}
            updatedAt={entry.preference?.updatedAt}
            missing={
              entry.missingSide === 'candidato' || entry.missingSide === 'ambos'
                ? MISSING_LABEL.candidato
                : undefined
            }
          />
        </div>
      </div>

      {culture?.state === 'divergente' ? (
        <p className="mt-3 border-l-2 border-destructive/40 pl-3 text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-destructive">
            A empresa se descreve de outro jeito neste eixo.
          </span>{' '}
          {culture.voices
            .map(
              (voice) =>
                `${voice.respondent === 'equipe' ? 'a equipe' : 'a gestão'} responde “${voice.optionLabel}”`
            )
            .join(', e ')}
          . A condição acima é a praticada nesta equipe — é ela que a pessoa
          encontra no turno.
        </p>
      ) : null}
    </li>
  );
}

/**
 * Aderência ao contexto de trabalho.
 *
 * O enunciado dedica uma página ao fit cultural e conclui que o desafio é
 * ampliá-lo e trazê-lo para dentro da jornada, no lugar de uma avaliação
 * externa cara que não escala. Aqui isso aparece sem aplicar avaliação nova:
 * os dois lados já informaram algo, nos mesmos eixos, e a tela mostra o
 * encontro entre eles — inclusive onde um dos lados está vazio.
 */
export function FitReading({ job, talentId }: { job: Job; talentId: string }) {
  const { state } = useIelDemo();
  const reading = getFitReading(state, job, talentId);
  const company = getCompany(job.companyId);
  const culture = getCultureReading(state, job.companyId);

  const withBothSides = reading.filter(
    (entry) => entry.missingSide === null
  ).length;
  const missingTalentSide = reading.filter(
    (entry) =>
      entry.missingSide === 'candidato' || entry.missingSide === 'ambos'
  ).length;

  return (
    <Panel padding="lg">
      <PanelHeader
        eyebrow="Aderência ao contexto de trabalho"
        title={company?.name ?? 'Empresa'}
        hint="Compara o que a equipe informou sobre como trabalha com o que a pessoa declarou esperar, nos mesmos eixos. Não aplica avaliação nova nem produz nota: descreve condições de trabalho, não traços de personalidade."
        meta={
          <>
            {withBothSides} de {reading.length} eixos com os dois lados
            informados
            {missingTalentSide > 0
              ? ` · falta o lado da pessoa em ${missingTalentSide}`
              : ''}
            .
          </>
        }
      />

      <ul className="mt-5 divide-y divide-border">
        {reading.map((entry) => (
          <AxisRow
            key={entry.axis.id}
            entry={entry}
            culture={culture.find(
              (item) => item.question.axisId === entry.axis.id
            )}
          />
        ))}
      </ul>
    </Panel>
  );
}
