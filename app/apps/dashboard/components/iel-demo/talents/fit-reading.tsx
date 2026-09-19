'use client';

import { getCultureQuestion } from '@/features/iel-demo/analysis/culture';
import { getFitInsights } from '@/features/iel-demo/analysis/fit-insights';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getAxisWeights,
  getCompany,
  getCultureReading,
  getFitReading,
  type CultureAxisReading,
  type FitReadingEntry
} from '@/features/iel-demo/state/selectors';
import type { Job } from '@/features/iel-demo/types';

import { AdherenceRing } from '../instruments/adherence-ring';
import { FitAxisSlider } from '../instruments/fit-axis-slider';
import { CriterionStateHeadline } from '../shared/criterion-state-badge';
import { formatDate, Hero, InfoHint, Panel, SourceDot } from '../shared/ui';
import { FitInsights } from './fit-insights';
import { FitRadar } from './fit-radar';

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

/**
 * Corte de triagem da vaga, em pontos percentuais.
 *
 * TODO(getAdherence): o corte é parâmetro da vaga e vai chegar junto do
 * percentual, pelo mesmo seletor. Até lá fica a constante do combinado (35)
 * num lugar só, para não se espalhar pela tela.
 */
const ADHERENCE_THRESHOLD = 35;

/**
 * Posição de cada lado no eixo, **provisória**.
 *
 * O motor de aderência vai devolver a posição ordinal real (1..3) que cada
 * lado ocupa no eixo — a mesma escala que `CULTURE_QUESTIONS` já usa para as
 * respostas da empresa. Enquanto ele não existe, a única informação
 * disponível aqui é o estado do encontro entre os dois lados, e este
 * mapeamento o projeta de volta em posições:
 *
 * - alinhamento → os dois no mesmo degrau (2);
 * - divergência → polos opostos (1 e 3), porque é a distância que a leitura
 *   afirma;
 * - a esclarecer → degraus adjacentes (2 e 3): há diferença, mas ela ainda
 *   não foi confirmada por quem poderia confirmar;
 * - lado faltando → `null` naquele lado, sempre. Nunca uma posição inventada,
 *   e nunca o degrau mínimo: ausência não é extremo.
 *
 * É uma projeção, não uma medida. Quando `getAdherence` chegar, esta função
 * sai inteira e as posições passam a vir do seletor.
 */
function toAxisPositions(entry: FitReadingEntry): {
  companyValue: number | null;
  candidateValue: number | null;
} {
  const hasCompany =
    entry.missingSide !== 'empresa' && entry.missingSide !== 'ambos';
  const hasCandidate =
    entry.missingSide !== 'candidato' && entry.missingSide !== 'ambos';

  if (!hasCompany || !hasCandidate) {
    return {
      companyValue: hasCompany ? 2 : null,
      candidateValue: hasCandidate ? 2 : null
    };
  }

  switch (entry.state) {
    case 'divergencia':
      return { companyValue: 1, candidateValue: 3 };
    case 'a-esclarecer':
      return { companyValue: 2, candidateValue: 3 };
    case 'alinhamento':
      return { companyValue: 2, candidateValue: 2 };
    default:
      return { companyValue: null, candidateValue: null };
  }
}

/**
 * Polos nomeados do eixo, tirados do próprio questionário da empresa: a
 * alternativa de valor 1 e a de valor 3. Assim o trilho fala a língua que a
 * empresa já respondeu, em vez de um "baixo/alto" inventado na tela.
 */
function toPoles(axisId: FitReadingEntry['axis']['id']): [string, string] {
  const question = getCultureQuestion(axisId);
  if (!question) return ['menos', 'mais'];
  const low = question.options.find((option) => option.value === 1);
  const high = question.options.find((option) => option.value === 3);
  return [low?.label ?? 'menos', high?.label ?? 'mais'];
}

/** Um lado do eixo, em texto, com a origem do que foi informado. */
function SideDetail({
  title,
  value,
  origin,
  sourceId,
  updatedAt,
  missing
}: {
  title: string;
  value?: string;
  origin?: string;
  sourceId?: string;
  updatedAt?: string;
  missing?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="iel-eyebrow">{title}</p>
      {value ? (
        <>
          <p className="mt-1 text-sm leading-relaxed text-foreground">
            {value}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
            {sourceId ? <SourceDot sourceId={sourceId} /> : null}
            {origin}
            {updatedAt ? <span>· {formatDate(updatedAt)}</span> : null}
          </p>
        </>
      ) : (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {missing}
        </p>
      )}
    </div>
  );
}

/**
 * Um eixo: o trilho com os dois marcadores e, abaixo, o que cada lado disse.
 *
 * A forma é a afirmação. Enquanto o fit era uma lista de parágrafos, a
 * distância entre os dois lados existia no texto e não na tela — e é
 * justamente a distância que o analista precisa ver antes de ler qualquer
 * frase.
 */
function AxisRow({
  entry,
  culture
}: {
  entry: FitReadingEntry;
  culture: CultureAxisReading | undefined;
}) {
  const positions = toAxisPositions(entry);

  return (
    <li className="px-5 py-1 first:pt-3 last:pb-4">
      <FitAxisSlider
        label={entry.axis.label}
        poles={toPoles(entry.axis.id)}
        companyValue={positions.companyValue}
        candidateValue={positions.candidateValue}
        min={1}
        max={3}
        weight={entry.weight}
        state={entry.state}
      />

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <CriterionStateHeadline state={entry.state} />
        <InfoHint label={entry.axis.description} />
      </div>

      <div className="mt-3 grid gap-x-6 gap-y-3 border-l-2 border-border pl-4 sm:grid-cols-2">
        <SideDetail
          title="A equipe informa"
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
        <SideDetail
          title="A pessoa declara"
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
 *
 * A leitura abre como instrumento: o anel com o percentual e o corte, o
 * radar por dimensão e os callouts do que exige conversa. A lista dos eixos
 * vem depois, densa, e é onde a afirmação de cada eixo pode ser conferida
 * contra a origem do dado.
 */
export function FitReading({ job, talentId }: { job: Job; talentId: string }) {
  const { state } = useIelDemo();
  const reading = getFitReading(state, job, talentId);
  const company = getCompany(job.companyId);
  const culture = getCultureReading(state, job.companyId);
  const insights = getFitInsights(reading, getAxisWeights(state, job));

  const withBothSides = reading.filter(
    (entry) => entry.missingSide === null
  ).length;
  const missingTalentSide = reading.filter(
    (entry) =>
      entry.missingSide === 'candidato' || entry.missingSide === 'ambos'
  ).length;

  return (
    <div className="space-y-4">
      <Hero
        as="h2"
        eyebrow="Aderência ao contexto de trabalho"
        title={company?.name ?? 'Empresa'}
        description="Compara o que a equipe informou sobre como trabalha com o que a pessoa declarou esperar, nos mesmos eixos. Não aplica avaliação nova nem produz nota: descreve condições de trabalho, não traços de personalidade."
        figures={[
          {
            label: 'Eixos com os dois lados',
            value: `${withBothSides}/${reading.length}`
          },
          {
            label: 'Falta o lado da pessoa',
            value: missingTalentSide,
            tone: missingTalentSide > 0 ? 'atencao' : 'default',
            hint:
              missingTalentSide > 0
                ? 'Uma coleta dirigida fecha a leitura destes eixos.'
                : undefined
          }
        ]}
        aside={
          <div className="flex justify-center">
            {/* TODO(getAdherence): o percentual e o corte da vaga vêm do
                motor de aderência. Até lá o anel fica vazio de propósito —
                desenhar 0% aqui seria transformar ausência em resultado. */}
            <AdherenceRing
              value={null}
              threshold={ADHERENCE_THRESHOLD}
              size="lg"
            />
          </div>
        }
      >
        <div className="grid gap-6 border-t border-border pt-6 lg:grid-cols-2">
          <FitRadar reading={reading} />
          <FitInsights insights={insights} />
        </div>
      </Hero>

      {/* Lista densa: rente à página, porque pertence à leitura acima. */}
      <Panel
        elevation={1}
        padding="none"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-5 py-3">
          <h3 className="iel-display text-[0.9375rem] text-foreground">
            Os cinco eixos, um a um
          </h3>
          <p className="text-xs text-muted-foreground">
            Quadrado violeta: a equipe · círculo azul: a pessoa
          </p>
        </div>
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
        <p className="border-t border-border px-5 py-3 text-[11px] leading-relaxed text-muted-foreground">
          As posições no trilho são uma projeção provisória do estado de cada
          eixo, não uma medida: o motor de aderência ainda não devolve a posição
          ordinal real de cada lado.
        </p>
      </Panel>
    </div>
  );
}
