'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  CLARIFICATION_STATE_LABEL,
  getApplication,
  getCompany,
  getCriterion,
  getJob,
  getTalent
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import type { Clarification } from '@/features/iel-demo/types';

import { routes } from '@workspace/routes';
import { Alert, Button, Card, FilterNativeSelect, toast } from '@workspace/ui';

import { Chip, formatDateTime, IelPageHeader } from '../shared/ui';
import { IncorporateClarificationDialog } from './incorporate-clarification-dialog';

type GroupBy = 'destinatario' | 'vaga';

function stateTone(clarification: Clarification) {
  switch (clarification.state) {
    case 'respondida':
      return 'info' as const;
    case 'incorporada':
      return 'positivo' as const;
    case 'cancelada':
      return 'neutro' as const;
    case 'rascunho':
      return 'neutro' as const;
    default:
      return 'atencao' as const;
  }
}

export function ClarificationsScreen() {
  const { state, dispatch, persona } = useIelDemo();
  const [groupBy, setGroupBy] = useState<GroupBy>('vaga');
  const [stateFilter, setStateFilter] = useState<string>('todas');
  const [incorporating, setIncorporating] = useState<Clarification | null>(
    null
  );
  const iel = routes.dashboard.iel;

  const visible = useMemo(() => {
    let items = state.clarifications;
    if (persona.kind === 'gestor' && persona.companyId) {
      items = items.filter(
        (clarification) =>
          clarification.recipient.kind === 'gestor' &&
          clarification.recipient.companyId === persona.companyId
      );
    }
    if (stateFilter !== 'todas') {
      items = items.filter(
        (clarification) => clarification.state === stateFilter
      );
    }
    return items;
  }, [state.clarifications, persona, stateFilter]);

  const groups = useMemo(() => {
    const map = new Map<string, Clarification[]>();
    for (const clarification of visible) {
      const job = getJob(clarification.jobId);
      const key =
        groupBy === 'vaga'
          ? `${job?.title ?? clarification.jobId} — ${getCompany(job?.companyId ?? '')?.name ?? ''}`
          : `${clarification.recipient.name} (${clarification.recipient.kind === 'gestor' ? 'gestor' : 'candidato'})`;
      map.set(key, [...(map.get(key) ?? []), clarification]);
    }
    return [...map.entries()];
  }, [visible, groupBy]);

  return (
    <div className="space-y-6">
      <IelPageHeader
        eyebrow={
          persona.kind === 'gestor'
            ? 'Perguntas do IEL para a sua equipe'
            : 'Solicitações e esclarecimentos'
        }
        title={persona.kind === 'gestor' ? 'Perguntas recebidas' : 'Pendências'}
        description="Cada solicitação registra destinatário, motivo, critério afetado e o que será compartilhado. O envio é simulado: a experiência do destinatário abre aqui mesmo."
        actions={
          persona.kind === 'analista' ? (
            <>
              <label
                className="sr-only"
                htmlFor="clarifications-group"
              >
                Agrupar por
              </label>
              <FilterNativeSelect
                id="clarifications-group"
                className="w-48"
                value={groupBy}
                onValueChange={(value) => setGroupBy(value as GroupBy)}
              >
                <option value="vaga">Agrupar por vaga</option>
                <option value="destinatario">Agrupar por destinatário</option>
              </FilterNativeSelect>
              <label
                className="sr-only"
                htmlFor="clarifications-state"
              >
                Filtrar por estado
              </label>
              <FilterNativeSelect
                id="clarifications-state"
                className="w-48"
                value={stateFilter}
                onValueChange={setStateFilter}
              >
                <option value="todas">Todos os estados</option>
                <option value="rascunho">Rascunho</option>
                <option value="solicitada">Solicitada</option>
                <option value="respondida">Respondida</option>
                <option value="incorporada">Incorporada</option>
                <option value="cancelada">Cancelada</option>
              </FilterNativeSelect>
            </>
          ) : null
        }
      />

      {visible.length === 0 ? (
        <Card padding="lg">
          <h3 className="text-base font-semibold text-foreground">
            Nenhuma solicitação com esse filtro
          </h3>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {persona.kind === 'gestor'
              ? 'Quando o IEL enviar uma pergunta sobre a sua equipe, ela aparece aqui.'
              : 'Crie uma solicitação a partir de um critério na mesa de seleção ou no contexto da empresa.'}
          </p>
          {persona.kind === 'analista' ? (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStateFilter('todas')}
              >
                Limpar filtro
              </Button>
            </div>
          ) : null}
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map(([groupLabel, items]) => (
            <section
              key={groupLabel}
              className="space-y-3"
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {groupLabel} · {items.length}
              </h2>
              <ul className="space-y-3">
                {items.map((clarification) => {
                  const job = getJob(clarification.jobId);
                  const criterion = job
                    ? getCriterion(job, clarification.criterionId)
                    : null;
                  const application = clarification.applicationId
                    ? getApplication(state, clarification.applicationId)
                    : null;
                  const talent = application
                    ? getTalent(application.talentId)
                    : null;

                  return (
                    <li key={clarification.id}>
                      <Card className="gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Chip tone={stateTone(clarification)}>
                            {CLARIFICATION_STATE_LABEL[clarification.state]}
                          </Chip>
                          <span className="text-xs text-muted-foreground">
                            {clarification.id} · {job?.title} · critério{' '}
                            {criterion?.label}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            Para: {clarification.recipient.name} —{' '}
                            {clarification.recipient.role}
                          </p>
                          <p className="text-sm text-foreground">
                            “{clarification.question}”
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Motivo: {clarification.reason}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Será compartilhado: {clarification.sharedInfo}
                          </p>
                          {talent ? (
                            <p className="text-xs text-muted-foreground">
                              Candidatura afetada:{' '}
                              <Link
                                className="underline decoration-dotted"
                                href={iel.talents
                                  .byId(talent.id)
                                  .inJob(clarification.jobId)}
                              >
                                {talent.name}
                              </Link>
                            </p>
                          ) : null}
                          <p className="text-[11px] text-muted-foreground">
                            Criada em {formatDateTime(clarification.createdAt)}
                            {clarification.answeredAt
                              ? ` · respondida em ${formatDateTime(clarification.answeredAt)}`
                              : ''}
                            {clarification.incorporatedAt
                              ? ` · incorporada em ${formatDateTime(clarification.incorporatedAt)}`
                              : ''}
                          </p>
                        </div>

                        {clarification.answer ? (
                          <div className="rounded-[var(--control-radius)] border border-border bg-muted/50 p-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Resposta
                            </p>
                            <p className="text-sm text-foreground">
                              “{clarification.answer}”
                            </p>
                          </div>
                        ) : null}

                        <div className="flex flex-wrap gap-2">
                          {clarification.state === 'rascunho' &&
                          persona.kind === 'analista' ? (
                            <Button
                              size="sm"
                              onClick={() => {
                                dispatch({
                                  type: 'send-clarification',
                                  clarificationId: clarification.id,
                                  at: nowIso()
                                });
                                toast.success(
                                  'Solicitação enviada (envio simulado).'
                                );
                              }}
                            >
                              Enviar solicitação
                            </Button>
                          ) : null}

                          {clarification.state === 'solicitada' ? (
                            <Link
                              href={iel.clarifications.respond(
                                clarification.id
                              )}
                            >
                              <Button size="sm">
                                {persona.kind === 'gestor'
                                  ? 'Responder'
                                  : 'Abrir experiência do destinatário'}
                              </Button>
                            </Link>
                          ) : null}

                          {clarification.state === 'respondida' &&
                          persona.kind === 'analista' ? (
                            <Button
                              size="sm"
                              onClick={() => setIncorporating(clarification)}
                            >
                              Incorporar à análise
                            </Button>
                          ) : null}

                          {job && persona.kind === 'analista' ? (
                            <Link href={iel.jobs.byId(job.id).index}>
                              <Button
                                size="sm"
                                variant="outline"
                              >
                                Abrir a vaga
                              </Button>
                            </Link>
                          ) : null}

                          {(clarification.state === 'solicitada' ||
                            clarification.state === 'rascunho') &&
                          persona.kind === 'analista' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                dispatch({
                                  type: 'cancel-clarification',
                                  clarificationId: clarification.id,
                                  at: nowIso()
                                });
                                toast.success(
                                  'Solicitação cancelada. A análise não mudou.'
                                );
                              }}
                            >
                              Cancelar solicitação
                            </Button>
                          ) : null}
                        </div>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Alert variant="default">
        Nada é enviado por e-mail ou mensagem neste ambiente. “Abrir experiência
        do destinatário” mostra exatamente a tela que a pessoa veria.
      </Alert>

      {incorporating ? (
        <IncorporateClarificationDialog
          clarification={incorporating}
          visible
          onHide={() => setIncorporating(null)}
        />
      ) : null}
    </div>
  );
}
