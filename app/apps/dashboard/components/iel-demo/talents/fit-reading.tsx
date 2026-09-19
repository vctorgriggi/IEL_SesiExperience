'use client';

import {
  ADHERENCE_THRESHOLD,
  formatAdherence,
  type AdherenceAxisEntry
} from '@/features/iel-demo/analysis/adherence';
import { getCultureQuestion } from '@/features/iel-demo/analysis/culture';
import { getFitInsights } from '@/features/iel-demo/analysis/fit-insights';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getAdherence,
  getAxisWeights,
  getCompany,
  getCultureReading,
  getFitReading,
  type CultureAxisReading,
  type FitReadingEntry
} from '@/features/iel-demo/state/selectors';
import type { Application, Job } from '@/features/iel-demo/types';

import { AdherenceRing } from '../instruments/adherence-ring';
import { FitAxisSlider } from '../instruments/fit-axis-slider';
import { CriterionStateHeadline } from '../shared/criterion-state-badge';
import {
  Chip,
  formatDate,
  Hero,
  InfoHint,
  Panel,
  SourceDot
} from '../shared/ui';
import { FitInsights } from './fit-insights';
import { FitRadar } from './fit-radar';

const CONDITION_STATUS_LABEL: Record<string, string> = {
  confirmado: 'confirmado pelo gestor',
  'da-descricao': 'da descrição da vaga',
  'a-confirmar': 'a confirmar'
};

/** Como o corte de 35% se lê na tela, sem transformar ausência em reprovação. */
type CompatibilityState = 'compativel' | 'abaixo' | 'sem-base';

const COMPATIBILITY_LABEL: Record<CompatibilityState, string> = {
  compativel: `Compatível (≥ ${ADHERENCE_THRESHOLD}%)`,
  abaixo: 'Abaixo do corte',
  'sem-base': 'Sem base'
};

const COMPATIBILITY_TONE: Record<
  CompatibilityState,
  'positivo' | 'atencao' | 'neutro'
> = {
  compativel: 'positivo',
  abaixo: 'atencao',
  'sem-base': 'neutro'
};

const MISSING_LABEL: Record<string, string> = {
  empresa: 'A equipe ainda não informou.',
  candidato: 'A pessoa ainda não declarou.',
  ambos: 'Nenhum dos dois lados informou.'
};

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
  culture,
  adherenceAxis
}: {
  entry: FitReadingEntry;
  culture: CultureAxisReading | undefined;
  /** O eixo como o motor de aderência o mediu, ou `undefined` sem medida. */
  adherenceAxis: AdherenceAxisEntry | undefined;
}) {
  return (
    <li className="px-5 py-1 first:pt-3 last:pb-4">
      <FitAxisSlider
        label={entry.axis.label}
        poles={toPoles(entry.axis.id)}
        companyValue={adherenceAxis?.companyMean ?? null}
        candidateValue={adherenceAxis?.candidateValue ?? null}
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
export function FitReading({
  job,
  talentId,
  application
}: {
  job: Job;
  talentId: string;
  /** A candidatura que dá contexto: a aderência é medida por candidatura. */
  application: Application;
}) {
  const { state } = useIelDemo();
  const reading = getFitReading(state, job, talentId);
  const company = getCompany(job.companyId);
  const culture = getCultureReading(state, job.companyId);
  const insights = getFitInsights(reading, getAxisWeights(state, job));
  const adherence = getAdherence(state, application.id);
  const compatibility: CompatibilityState =
    adherence?.compatible === true
      ? 'compativel'
      : adherence?.compatible === false
        ? 'abaixo'
        : 'sem-base';

  // As figuras do herói vêm da mesma conta que o anel: o questionário. A
  // leitura textual (preferência × condição informada) fica nos trilhos, um
  // a um — mostrar as duas contagens lado a lado confundia na apresentação.
  const measuredAxes = adherence?.coverage.answeredAxes ?? 0;
  const totalAxes = adherence?.coverage.totalAxes ?? 5;
  const missingCompanyProfile =
    adherence?.byAxis.filter((axis) => axis.companyMean === null).length ?? 0;
  const missingCandidateAnswer =
    adherence?.byAxis.filter(
      (axis) => axis.companyMean !== null && axis.candidateValue === null
    ).length ?? totalAxes;

  return (
    <div className="space-y-4">
      <Hero
        as="h2"
        eyebrow="Aderência ao contexto de trabalho"
        title={company?.name ?? 'Empresa'}
        description="Compara o que a equipe informou sobre como trabalha com o que a pessoa declarou esperar, nos mesmos eixos. Não aplica avaliação nova nem produz nota: descreve condições de trabalho, não traços de personalidade."
        figures={[
          {
            label: 'Eixos medidos',
            value: `${measuredAxes}/${totalAxes}`,
            hint: 'Eixos em que a empresa fechou perfil e a pessoa respondeu.'
          },
          {
            label: 'Sem perfil da empresa',
            value: missingCompanyProfile,
            tone: missingCompanyProfile > 0 ? 'atencao' : 'default',
            hint:
              missingCompanyProfile > 0
                ? 'Menos de 3 respostas da equipe nestes eixos.'
                : undefined
          },
          {
            label: 'Sem resposta da pessoa',
            value: missingCandidateAnswer,
            tone: missingCandidateAnswer > 0 ? 'atencao' : 'default',
            hint:
              missingCandidateAnswer > 0
                ? 'O questionário na candidatura fecha estes eixos.'
                : undefined
          }
        ]}
        aside={
          <div className="flex flex-col items-center gap-3">
            {/*
              O anel recebe o percentual arredondado, como `formatAdherence`
              o escreve: a conta tem casas decimais, a leitura não — uma casa
              decimal aqui sugeriria precisão que a escala ordinal não tem.
            */}
            <AdherenceRing
              value={
                adherence?.total === null || adherence?.total === undefined
                  ? null
                  : Math.round(adherence.total)
              }
              threshold={ADHERENCE_THRESHOLD}
              size="lg"
            />

            {/*
              O denominador junto do número. Um total de 80% sobre dois eixos
              não é a mesma coisa que 80% sobre cinco, e quem lê a tela precisa
              ver a diferença sem abrir a lista.
            */}
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">
                {formatAdherence(adherence?.total ?? null)}
              </span>{' '}
              sobre {adherence?.coverage.answeredAxes ?? 0} de{' '}
              {adherence?.coverage.totalAxes ?? 5} eixos
            </p>

            <Chip tone={COMPATIBILITY_TONE[compatibility]}>
              {COMPATIBILITY_LABEL[compatibility]}
            </Chip>

            {/*
              As duas medidas ficam lado a lado e não se somam. Somá-las
              exigiria decidir quanto cada uma vale, e ninguém decidiu isso.
            */}
            <p className="max-w-[20rem] text-center text-[11px] leading-relaxed text-muted-foreground">
              Fit responde “estou disposto(a) a…”; o técnico vem do Empregare:{' '}
              <span className="font-medium text-foreground">
                {application.technicalMatch === null ||
                application.technicalMatch === undefined
                  ? 'sem dados'
                  : `${application.technicalMatch}%`}
              </span>
              .
            </p>
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
              adherenceAxis={adherence?.byAxis.find(
                (axis) => axis.axisId === entry.axis.id
              )}
            />
          ))}
        </ul>
        <p className="border-t border-border px-5 py-3 text-[11px] leading-relaxed text-muted-foreground">
          A posição da equipe é a média do traçado da empresa neste eixo; a da
          pessoa é a alternativa que ela escolheu no questionário de fit. Onde
          falta um lado, aquele marcador não entra no trilho.
        </p>
      </Panel>
    </div>
  );
}
