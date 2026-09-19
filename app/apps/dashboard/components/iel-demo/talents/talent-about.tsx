'use client';

import { useState } from 'react';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplicationsByTalent,
  getAssessments,
  getEvidencesByTalent
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import type { Talent } from '@/features/iel-demo/types';

import { Button, Textarea, toast } from '@workspace/ui';

import { EvidenceCard } from '../shared/evidence-panel';
import { Chip, formatDate, SectionTitle } from '../shared/ui';
import { TalentJourney } from './talent-journey';

/**
 * Tudo o que descreve a pessoa e não responde "combina com esta empresa?".
 *
 * Contato, cidade, experiências, avaliações de origem, histórico em outras
 * vagas e as anotações internas moravam na primeira dobra, entre o número
 * principal e a lista dos cinco pontos. Nada disso ajuda a decidir o envio, e
 * tudo isso continua necessário quando a analista liga para a pessoa — então
 * fica aqui, a um clique, e não no caminho.
 */
export function TalentAbout({
  talent,
  jobId
}: {
  talent: Talent;
  /** Vaga em que a anotação nasce, quando o perfil foi aberto por uma. */
  jobId: string | null;
}) {
  const { state, dispatch } = useIelDemo();
  const [note, setNote] = useState('');

  const applications = getApplicationsByTalent(state, talent.id);
  const assessments = getAssessments(talent.id);
  const evidences = getEvidencesByTalent(state, talent.id);
  const shared = evidences.filter(
    (evidence) => evidence.visibility === 'compartilhavel'
  );
  const internal = evidences.filter(
    (evidence) => evidence.visibility === 'interno'
  );

  return (
    <div className="space-y-6">
      <section>
        <SectionTitle>Contato</SectionTitle>
        <ul className="mt-2 flex flex-wrap items-center gap-2">
          <li>
            <Chip>{talent.city}</Chip>
          </li>
          <li>
            <Chip>{talent.email}</Chip>
          </li>
          <li>
            <Chip tone="info">
              {plural(applications.length, 'candidatura', 'candidaturas')} na
              base
            </Chip>
          </li>
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          A mesma pessoa não é duplicada quando participa de mais de um
          processo.
        </p>
      </section>

      <section>
        <SectionTitle>Onde já trabalhou</SectionTitle>
        <ul className="mt-2 space-y-3">
          {talent.experiences.map((experience) => (
            <li
              key={experience.id}
              className="rounded-[var(--control-radius)] border border-border p-3"
            >
              <p className="text-sm font-medium text-foreground">
                {experience.role} — {experience.organization}
              </p>
              <p className="text-xs text-muted-foreground">
                {experience.period}
              </p>
              <p className="iel-prose mt-1 text-sm text-muted-foreground">
                {experience.activities}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <SectionTitle>O que ela diz saber fazer</SectionTitle>
          <ul className="mt-2 flex flex-wrap gap-1">
            {talent.declaredSkills.map((skill) => (
              <li key={skill}>
                <Chip>{skill}</Chip>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <SectionTitle>O que ela procura</SectionTitle>
          {talent.expectations.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Nada registrado até agora.
            </p>
          ) : (
            <ul className="iel-prose mt-2 list-inside list-disc text-sm text-muted-foreground">
              {talent.expectations.map((expectation) => (
                <li key={expectation}>{expectation}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <SectionTitle hint="Resultados que vieram de fora, com escala, método e data preservados. Nenhuma avaliação nova é aplicada aqui.">
          Avaliações que já existiam
        </SectionTitle>
        <div className="mt-2 space-y-3">
          {assessments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma avaliação disponível — o que não é nota zero.
            </p>
          ) : (
            assessments.map((assessment) => (
              <div
                key={assessment.id}
                className="space-y-2 rounded-[var(--control-radius)] border border-border p-3"
              >
                <p className="text-sm font-medium text-foreground">
                  {assessment.method}
                </p>
                <p className="text-xs text-muted-foreground">
                  Aplicada em {formatDate(assessment.appliedAt)} ·{' '}
                  {assessment.scale}
                </p>
                <ul className="space-y-1 text-sm text-foreground">
                  {assessment.results.map((result) => (
                    <li key={result.label}>
                      {result.label}: <strong>{result.value}</strong>
                    </li>
                  ))}
                </ul>
                <p className="iel-prose text-xs text-muted-foreground">
                  {assessment.note}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <TalentJourney talentId={talent.id} />

      <section>
        <SectionTitle hint="Informações compartilháveis usadas na análise.">
          De onde vêm os registros ({shared.length})
        </SectionTitle>
        <div className="mt-2 space-y-3">
          {shared.map((evidence) => (
            <EvidenceCard
              key={evidence.id}
              evidence={evidence}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle hint="Separadas dos dados compartilháveis: não entram no envio para a empresa.">
          Anotações do IEL
        </SectionTitle>
        <div className="mt-2 space-y-3">
          {internal.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma anotação registrada.
            </p>
          ) : (
            internal.map((item) => (
              <EvidenceCard
                key={item.id}
                evidence={item}
              />
            ))
          )}
          <div className="space-y-2">
            <label
              htmlFor="internal-note"
              className="block text-sm font-medium text-foreground"
            >
              Nova anotação
            </label>
            <Textarea
              id="internal-note"
              rows={3}
              value={note}
              placeholder="Ex.: confirmar o horário com ela antes de enviar."
              onChange={(event) => setNote(event.target.value)}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={note.trim().length === 0}
              onClick={() => {
                dispatch({
                  type: 'add-internal-note',
                  talentId: talent.id,
                  jobId: jobId ?? 'sem-vaga',
                  note: note.trim(),
                  at: nowIso()
                });
                setNote('');
                toast.success('Anotação registrada. Não vai para a empresa.');
              }}
            >
              Salvar anotação
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
