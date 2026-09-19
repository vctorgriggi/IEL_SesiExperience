'use client';

import {
  CULTURE_RESPONDENT_LABEL,
  CULTURE_SCALE_MAX,
  CULTURE_SCALE_MIN,
  getCultureOptionValue,
  MIN_TEAM_RESPONSES,
  type CultureRespondent
} from '@/features/iel-demo/analysis/culture';
import { CULTURE_INVITE_DEADLINE_DAYS } from '@/features/iel-demo/analysis/culture-invites';
import { COPY, type EstadoDeLeitura } from '@/features/iel-demo/copy';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getCompany,
  getCompanyCultureProfile,
  getCultureInvites,
  getCultureReading,
  getCultureSampleProgress,
  type CompanyCultureAxisProfile,
  type CultureAxisReading,
  type CultureSampleProgress
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';

import { Button, cn, FilterNativeSelect, toast } from '@workspace/ui';

import {
  Hero,
  HowItWorks,
  InfoHint,
  Panel,
  PanelHeader,
  SourceDot,
  SummaryRow,
  type HeroFigures
} from '../shared/ui';
import { CollapsibleSection } from '../talents/collapsible-section';

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
    <div className="rounded-[var(--control-radius)] border border-dashed border-info/40 bg-info/[0.04] p-3">
      <p className="text-sm font-medium text-foreground">
        {COPY.axis(entry.question.axisId)}
      </p>

      <p className="mt-1.5 text-sm text-foreground">
        Sugestão:{' '}
        {entry.question.options.find(
          (option) => option.id === suggestion.optionId
        )?.label ?? suggestion.optionId}
      </p>

      <p className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
        <SourceDot sourceId={suggestion.sourceId} />
        vem de: {suggestion.sourceLabel}
        <InfoHint
          label={`Trecho que sustenta a sugestão: “${suggestion.excerpt}”`}
        />
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
            toast.success('Resposta confirmada pela empresa.');
          }}
        >
          Confirmar
        </Button>

        <label
          className="sr-only"
          htmlFor={`correct-${entry.question.axisId}`}
        >
          Corrigir a sugestão de {COPY.axis(entry.question.axisId)}
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
            toast.info('Resposta corrigida pela empresa.');
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

/** Marcador de um papel no trilho do ponto. */
const RESPONDENT_MARK: Record<CultureRespondent, string> = {
  gestao: 'rounded-[3px] bg-chart-2',
  rh: 'rounded-[3px] bg-chart-3',
  equipe: 'rounded-full bg-chart-1'
};

/**
 * O ponto como instrumento, não como lista.
 *
 * Cada papel que respondeu ocupa a sua posição no trilho, entre os dois
 * polos que a própria empresa respondeu — e a distância entre gestão e
 * equipe passa a ser uma coisa que se vê. A dispersão da equipe é desenhada
 * como um rastro em volta do marcador: proporcional a quantas respostas
 * ficaram fora da alternativa mais votada. Uma equipe rachada e uma equipe
 * unânime deixam de ter o mesmo desenho.
 *
 * Vive no detalhe da linha, não na primeira dobra: quem abre a tela precisa
 * saber quantas respostas chegaram, e só depois de onde vem cada uma.
 */
function AxisTrack({
  entry,
  profile
}: {
  entry: CultureAxisReading;
  /** O ponto como média: o que o motor de aderência de fato compara. */
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
    Média do ponto.

    "O fit cultural é a média do que a empresa entende" (00:41:44) — e é essa
    média, não a resposta da gestão, que o motor de aderência compara com a do
    candidato. Desenhá-la aqui é o que torna a leitura conferível contra o
    percentual da outra tela.

    Quando faltam respostas (`ready` falso), não há losango: abaixo do mínimo
    de respostas da equipe, uma média seria o retrato de duas pessoas
    apresentado como "a empresa".
  */
  const meanValue = profile?.ready ? (profile.mean ?? null) : null;

  return (
    <div
      role="img"
      aria-label={description}
      className="mt-1 flex items-center gap-2.5"
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

          {/* Corda entre gestão e equipe: a diferença, desenhada. */}
          {marks.length > 1
            ? (() => {
                const values = marks.map((mark) => percentOf(mark.value));
                const start = Math.min(...values);
                const end = Math.max(...values);
                if (start === end) return null;
                return (
                  <span
                    aria-hidden="true"
                    className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-foreground/25"
                    style={{ left: `${start}%`, width: `${end - start}%` }}
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
                title={`Média da empresa neste ponto: ${formatMean(meanValue)}`}
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

/**
 * O estado da linha, em palavra comum.
 *
 * Só três coisas interessam a quem lê: a equipe respondeu o bastante e
 * gestão e equipe dizem a mesma coisa (combina), dizem coisas diferentes
 * (difere), ou ainda não há respostas que bastem (faltando). O quarto estado
 * — ninguém respondeu — continua separado porque silêncio não é o mesmo que
 * amostra insuficiente, e o glossário tem palavra para ele.
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
 * Uma frase por linha: o que a equipe diz e quantos responderam.
 *
 * O denominador é o tamanho da amostra convidada, e o numerador conta só as
 * respostas de **equipe** — as mesmas que decidem se o ponto fecha. Somar a
 * gestão aqui faria a linha dizer "8 de 10" numa consulta em que sete pessoas
 * responderam, e o número deixaria de bater com o do herói.
 */
function rowSummary(
  entry: CultureAxisReading,
  profile: CompanyCultureAxisProfile | undefined,
  progress: CultureSampleProgress
): string {
  const equipe = entry.voices.find((voice) => voice.respondent === 'equipe');
  const respondidas = equipe?.total ?? 0;
  const total = Math.max(progress.total, respondidas);
  const mean = profile?.ready ? (profile.mean ?? null) : null;

  if (mean === null) return COPY.missingAnswers(respondidas, total);

  const label = meanOptionLabel(entry, mean);
  return `A equipe diz: ${label ?? '—'}. ${respondidas} de ${total} responderam.`;
}

/** O prazo como número do herói: uma contagem, não uma data. */
function deadlineFigure(progress: CultureSampleProgress): {
  value: string;
  tone: 'default' | 'atencao';
} {
  const days = progress.daysLeft;
  if (days === null) return { value: 'sem prazo', tone: 'default' };
  if (progress.overdue) {
    const atraso = Math.abs(days);
    return {
      value: `vencido há ${plural(atraso, 'dia', 'dias')}`,
      tone: 'atencao'
    };
  }
  if (days <= 0) return { value: 'vence hoje', tone: 'atencao' };
  return {
    value: `em ${plural(days, 'dia', 'dias')}`,
    tone: days <= 1 ? 'atencao' : 'default'
  };
}

/**
 * Como se trabalha nesta empresa?
 *
 * A tela tinha cinco blocos de texto por ponto do dia a dia, um trilho
 * sempre aberto e a palavra "traçado" em todo lugar. Quem abria não sabia
 * dizer o que tinha de fazer. Agora abre com um número — quantas respostas
 * chegaram, de quantas foram pedidas — e um verbo: cobrar quem falta. Os
 * cinco pontos viraram cinco linhas de uma frase, e o instrumento (trilho,
 * dispersão, média) mudou para o detalhe de cada uma.
 */
export function CultureProfile({
  companyId,
  onInvite
}: {
  companyId: string;
  /**
   * Abre o formulário de convite, que vive na seção da amostra.
   *
   * `null` quando quem olha é a empresa: convidar e cobrar a amostra são
   * trabalho da analista do IEL, e o gestor vê só a leitura da própria
   * empresa (PRODUTO.md §5.1).
   */
  onInvite: (() => void) | null;
}) {
  const { state, dispatch } = useIelDemo();
  const company = getCompany(companyId);
  const reading = getCultureReading(state, companyId);
  const profile = getCompanyCultureProfile(state, companyId);
  const progress = getCultureSampleProgress(state, companyId);
  const invites = getCultureInvites(state, companyId);

  const emAberto = invites.filter((invite) => !invite.answeredAt);
  const suficientes = profile.filter(
    (axis) => axis.ready && axis.mean !== null
  ).length;
  const sugestoes = reading.filter((entry) => entry.pendingSuggestion !== null);
  const prazo = deadlineFigure(progress);

  const figures: HeroFigures = [
    {
      label: 'Responderam',
      value: `${progress.answered} de ${progress.total}`,
      tone: progress.ready ? 'default' : 'atencao'
    },
    { label: 'Prazo', value: prazo.value, tone: prazo.tone },
    {
      label: 'Pontos com resposta suficiente',
      value: `${suficientes}/${profile.length}`
    }
  ];

  const cobrar = () => {
    for (const invite of emAberto) {
      dispatch({
        type: 'resend-culture-invite',
        inviteId: invite.id,
        at: nowIso()
      });
    }
    toast.success(
      `${plural(emAberto.length, 'link reenviado', 'links reenviados')}, com mais ${CULTURE_INVITE_DEADLINE_DAYS} dias de prazo.`
    );
  };

  return (
    <div className="space-y-6">
      <Hero
        eyebrow={
          company ? `${company.sector} · ${company.location}` : undefined
        }
        title={company?.name ?? companyId}
        description="Como se trabalha aqui, segundo quem trabalha aqui."
        figures={figures}
        actions={
          onInvite === null ? null : (
            <>
              {emAberto.length > 0 ? (
                <Button
                  size="large"
                  onClick={cobrar}
                >
                  Cobrar quem falta ({emAberto.length})
                </Button>
              ) : null}
              <Button
                size={emAberto.length > 0 ? 'medium' : 'large'}
                variant={emAberto.length > 0 ? 'outline' : 'default'}
                onClick={onInvite}
              >
                Convidar colaboradores
              </Button>
            </>
          )
        }
      />

      <Panel
        elevation={1}
        padding="none"
        className="overflow-hidden"
      >
        <div className="px-5 pb-3 pt-4">
          <PanelHeader
            title="Como a empresa trabalha — os 5 pontos"
            hint={COPY.axes.hint}
            meta="Uma linha por ponto. Abra a linha para ver de onde vem a resposta."
          />
        </div>

        {sugestoes.length > 0 ? (
          <div className="border-t border-border px-5 py-4">
            <CollapsibleSection
              title={`${plural(sugestoes.length, 'sugestão para confirmar', 'sugestões para confirmar')}`}
              meta="Montadas a partir de texto que a empresa já escreveu. Não valem como resposta até alguém confirmar."
            >
              <div className="space-y-3">
                {sugestoes.map((entry) => (
                  <SuggestionBlock
                    key={entry.question.axisId}
                    entry={entry}
                    companyId={companyId}
                  />
                ))}
              </div>
            </CollapsibleSection>
          </div>
        ) : null}

        <ul className="border-t border-border px-4 pb-2">
          {reading.map((entry) => {
            const axisProfile = profile.find(
              (axis) => axis.axisId === entry.question.axisId
            );

            return (
              <li key={entry.question.axisId}>
                <SummaryRow
                  title={COPY.axis(entry.question.axisId)}
                  status={readRowState(entry, axisProfile)}
                  summary={rowSummary(entry, axisProfile, progress)}
                >
                  <div className="space-y-3">
                    <p className="iel-prose text-xs leading-relaxed text-muted-foreground">
                      {entry.question.prompt}
                    </p>

                    <AxisTrack
                      entry={entry}
                      profile={axisProfile}
                    />

                    {/* Os polos não cabem nas pontas em telas estreitas. */}
                    <p className="flex justify-between gap-3 text-[11px] leading-snug text-muted-foreground md:hidden">
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
                      <ul className="flex flex-wrap gap-x-5 gap-y-1">
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
                            <span className="text-foreground/85">
                              {voice.optionLabel}
                            </span>
                            {voice.respondent === 'equipe' ? (
                              <span className="tabular-nums text-muted-foreground">
                                {voice.count} de {voice.total} respostas
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </SummaryRow>
              </li>
            );
          })}
        </ul>
      </Panel>

      <HowItWorks title="Como o perfil da empresa é formado">
        <p>
          O perfil é a <strong>média</strong> das respostas da amostra de
          colaboradores, e não a resposta de uma pessoa. É essa média que o
          cálculo de “{COPY.fit.label.toLowerCase()}” compara com o que o
          candidato procura.
        </p>
        <p>
          Um ponto só fecha com pelo menos {MIN_TEAM_RESPONSES} respostas da
          equipe. Abaixo disso a tela diz que faltam respostas, em vez de tratar
          duas pessoas como “a equipe”. O RH sozinho não responde pela empresa.
        </p>
        <p>
          Cada pessoa convidada recebe um link próprio, sem login, válido por{' '}
          {CULTURE_INVITE_DEADLINE_DAYS} dias. Guardamos só nome e e-mail
          corporativo; as respostas entram agregadas e a empresa nunca vê quem
          respondeu o quê.
        </p>
        <p>
          Não é teste de personalidade e não produz nota: as perguntas descrevem
          prática de trabalho, e um extremo não é melhor que o outro.
        </p>
      </HowItWorks>
    </div>
  );
}
