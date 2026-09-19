'use client';

import Link from 'next/link';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  EXTERNAL_STAGE_LABEL,
  getReusedEvidences,
  getTalentJourney,
  JOURNEY_OUTCOME_LABEL,
  type JourneyEntry,
  type JourneyOutcome
} from '@/features/iel-demo/state/selectors';

import { routes } from '@workspace/routes';
import { Card, CardContent, CardHeader, CardTitle, cn } from '@workspace/ui';

import { Chip, formatDate, InfoHint, SourceDot } from '../shared/ui';

const OUTCOME_TONE: Record<
  JourneyOutcome,
  'neutro' | 'info' | 'positivo' | 'atencao'
> = {
  'em-analise': 'neutro',
  encaminhada: 'info',
  'quero-entrevistar': 'positivo',
  'nao-avancou': 'atencao'
};

/** Marcador da linha do tempo, com a cor do desfecho. */
const OUTCOME_DOT: Record<JourneyOutcome, string> = {
  'em-analise': 'border-2 border-muted-foreground/40 bg-background',
  encaminhada: 'bg-info',
  'quero-entrevistar': 'bg-success',
  'nao-avancou': 'bg-warning'
};

function JourneyRow({
  entry,
  talentId,
  isLast
}: {
  entry: JourneyEntry;
  talentId: string;
  isLast: boolean;
}) {
  const iel = routes.dashboard.iel;
  const openClarifications = entry.clarifications.filter(
    (clarification) =>
      clarification.state === 'solicitada' || clarification.state === 'rascunho'
  );

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {/* Fio da linha do tempo, interrompido no último item. */}
      {!isLast ? (
        <span
          aria-hidden="true"
          className="absolute left-[5px] top-4 h-full w-px bg-border"
        />
      ) : null}
      <span
        aria-hidden="true"
        className={cn(
          'relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full',
          OUTCOME_DOT[entry.outcome]
        )}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <Link
            href={iel.talents.byId(talentId).inJob(entry.application.jobId)}
            className="text-sm font-semibold text-foreground underline-offset-2 hover:underline"
          >
            {entry.job?.title ?? entry.application.jobId}
          </Link>
          <span className="text-xs text-muted-foreground">
            {entry.company?.name}
          </span>
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            inscrição em {formatDate(entry.application.appliedAt)}
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Chip tone={OUTCOME_TONE[entry.outcome]}>
            {JOURNEY_OUTCOME_LABEL[entry.outcome]}
          </Chip>
          <Chip>{EXTERNAL_STAGE_LABEL[entry.application.externalStage]}</Chip>
          {entry.coverage.total > 0 ? (
            <span className="text-xs tabular-nums text-muted-foreground">
              {entry.coverage.withInformation}/{entry.coverage.total} critérios
              com dados
            </span>
          ) : null}
        </div>

        {entry.managerNote ? (
          <p className="mt-1.5 border-l-2 border-border pl-3 text-xs leading-relaxed text-foreground/80">
            {entry.managerNote}
            {entry.decidedAt ? (
              <span className="text-muted-foreground">
                {' '}
                · {formatDate(entry.decidedAt)}
              </span>
            ) : null}
          </p>
        ) : null}

        {openClarifications.length > 0 ? (
          <p className="mt-1.5 text-xs text-warning">
            {plural(
              openClarifications.length,
              'esclarecimento',
              'esclarecimentos'
            )}{' '}
            em aberto neste processo
          </p>
        ) : null}
      </div>
    </li>
  );
}

/**
 * Percurso da pessoa entre processos.
 *
 * O enunciado aponta como efeito do problema a dificuldade de "transformar os
 * resultados dos processos em aprendizado": cada seleção se encerra e o que se
 * soube ali não alcança a próxima. Aqui as candidaturas da mesma pessoa ficam
 * em sequência, com o desfecho de cada uma e a justificativa que a empresa
 * registrou — e com os registros que já serviram a mais de um processo.
 */
export function TalentJourney({ talentId }: { talentId: string }) {
  const { state } = useIelDemo();
  const journey = getTalentJourney(state, talentId);
  const reused = getReusedEvidences(state, talentId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-base">
          Trajetória entre processos
          <InfoHint label="As candidaturas desta pessoa em ordem, com o desfecho de cada uma. O percurso é entre oportunidades; acompanhamento após a contratação está fora do escopo deste protótipo." />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-4">
        {journey.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma candidatura registrada para este perfil na base demo.
          </p>
        ) : (
          <ol className="space-y-0">
            {journey.map((entry, index) => (
              <JourneyRow
                key={entry.application.id}
                entry={entry}
                talentId={talentId}
                isLast={index === journey.length - 1}
              />
            ))}
          </ol>
        )}

        {reused.length > 0 ? (
          <div className="border-t border-border pt-4">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              Informação reaproveitada entre processos
              <InfoHint label="Registros coletados uma vez que sustentaram a análise em mais de uma vaga. A pessoa não precisou informar de novo; a leitura muda porque o contexto de cada vaga é outro." />
            </h3>
            <ul className="mt-2 space-y-2">
              {reused.map(({ evidence, jobs }) => (
                <li
                  key={evidence.id}
                  className="text-xs"
                >
                  <p className="flex items-start gap-1.5 text-foreground/85">
                    <SourceDot
                      sourceId={evidence.sourceId}
                      className="mt-1"
                    />
                    <span>{evidence.information}</span>
                  </p>
                  <p className="mt-0.5 pl-3.5 text-muted-foreground">
                    Usada em {jobs.map((job) => job.title).join(' · ')}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
