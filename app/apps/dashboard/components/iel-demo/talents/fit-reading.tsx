'use client';

import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getCompany,
  getCultureReading,
  getFitReading,
  type CultureAxisReading,
  type FitReadingEntry
} from '@/features/iel-demo/state/selectors';
import type { Job } from '@/features/iel-demo/types';

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui';

import {
  CriterionStateDot,
  CriterionStateHeadline
} from '../shared/criterion-state-badge';
import { formatDate, InfoHint, SourceDot } from '../shared/ui';

const CONDITION_STATUS_LABEL: Record<string, string> = {
  confirmado: 'confirmado pelo gestor',
  'da-descricao': 'da descrição da vaga',
  'a-confirmar': 'a confirmar'
};

const MISSING_LABEL: Record<string, string> = {
  empresa: 'A equipe ainda não informou esta condição.',
  candidato: 'A pessoa ainda não declarou nada neste eixo.',
  ambos: 'Nenhum dos dois lados informou este eixo.'
};

function Side({
  role,
  value,
  origin,
  sourceId,
  updatedAt,
  note
}: {
  role: string;
  value?: string;
  origin?: string;
  sourceId?: string;
  updatedAt?: string;
  note?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {role}
      </p>
      {value ? (
        <>
          <p className="mt-0.5 text-xs leading-relaxed text-foreground/85">
            {value}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
            {sourceId ? <SourceDot sourceId={sourceId} /> : null}
            {origin}
            {updatedAt ? <span>· {formatDate(updatedAt)}</span> : null}
          </p>
        </>
      ) : (
        <p className="mt-0.5 text-xs italic leading-relaxed text-muted-foreground">
          {note}
        </p>
      )}
    </div>
  );
}

function AxisRow({
  entry,
  culture
}: {
  entry: FitReadingEntry;
  culture: CultureAxisReading | undefined;
}) {
  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <CriterionStateDot state={entry.state} />
        <h4 className="text-sm font-medium text-foreground">
          {entry.axis.label}
        </h4>
        <InfoHint label={entry.axis.description} />
        <CriterionStateHeadline
          state={entry.state}
          className="ml-auto"
        />
      </div>

      <div className="mt-2 grid gap-3 pl-4 sm:grid-cols-2">
        <Side
          role="A equipe informa"
          value={entry.condition?.value}
          origin={
            entry.condition
              ? CONDITION_STATUS_LABEL[entry.condition.status]
              : undefined
          }
          updatedAt={entry.condition?.updatedAt}
          note={
            entry.missingSide === 'empresa' || entry.missingSide === 'ambos'
              ? MISSING_LABEL.empresa
              : undefined
          }
        />
        <Side
          role="A pessoa declara"
          value={entry.preference?.value}
          origin={entry.preference?.origin}
          sourceId={entry.preference?.sourceId}
          updatedAt={entry.preference?.updatedAt}
          note={
            entry.missingSide === 'candidato' || entry.missingSide === 'ambos'
              ? MISSING_LABEL.candidato
              : undefined
          }
        />
      </div>

      {culture?.state === 'divergente' ? (
        <p className="mt-2 ml-4 border-l-2 border-destructive/40 pl-3 text-xs leading-relaxed text-muted-foreground">
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
 * encontro entre eles — inclusive onde um dos lados está vazio, que é o que
 * uma coleta dirigida iria buscar.
 *
 * Os eixos descrevem condições de trabalho, não traços de personalidade. O
 * enunciado veda usar dados de saúde na seleção e manda tratar bem-estar pela
 * perspectiva do ambiente e das relações de trabalho.
 */
export function FitReading({ job, talentId }: { job: Job; talentId: string }) {
  const { state } = useIelDemo();
  const reading = getFitReading(state, job, talentId);
  const company = getCompany(job.companyId);
  // O briefing separa a descrição institucional das condições da equipe e
  // destaca justamente quando elas não coincidem.
  const culture = getCultureReading(state, job.companyId);

  const withBothSides = reading.filter(
    (entry) => entry.missingSide === null
  ).length;
  const missingTalentSide = reading.filter(
    (entry) =>
      entry.missingSide === 'candidato' || entry.missingSide === 'ambos'
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-base">
          Aderência ao contexto — {company?.name}
          <InfoHint label="Compara o que a equipe informou sobre como trabalha com o que a pessoa declarou esperar, nos mesmos eixos. Não aplica avaliação nova nem produz nota: descreve condições de trabalho, não traços de personalidade." />
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {withBothSides} de {reading.length} eixos com os dois lados informados
          {missingTalentSide > 0
            ? ` · falta o lado da pessoa em ${missingTalentSide}`
            : ''}
          .
        </p>
      </CardHeader>
      <CardContent className="pt-2">
        <ul className="divide-y divide-border">
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
      </CardContent>
    </Card>
  );
}
