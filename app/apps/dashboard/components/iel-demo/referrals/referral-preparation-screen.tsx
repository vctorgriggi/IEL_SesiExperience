'use client';

import { useState } from 'react';
import Link from 'next/link';
import { buildReferralDraft } from '@/features/iel-demo/analysis/assistant';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplication,
  getCompany,
  getEvidencesByIds,
  getJob,
  getReferralListSelection,
  getTalent
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';

import { routes } from '@workspace/routes';
import { Alert, Button, Textarea, toast } from '@workspace/ui';

import { Chip, IelPageHeader, Panel, PanelHeader } from '../shared/ui';
import { ReferralPreviewDialog } from './referral-preview-dialog';

export function ReferralPreparationScreen({ jobId }: { jobId: string }) {
  const { state, dispatch, persona } = useIelDemo();
  const iel = routes.dashboard.iel;
  const job = getJob(jobId);
  const [justifications, setJustifications] = useState<Record<string, string>>(
    {}
  );
  const [message, setMessage] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  if (!job) return <Alert variant="destructive">Vaga não encontrada.</Alert>;

  if (persona.kind !== 'analista') {
    return (
      <Alert variant="warning">
        A preparação do encaminhamento é uma etapa do analista do IEL. Troque a
        persona na barra de demonstração para continuar.
      </Alert>
    );
  }

  const company = getCompany(job.companyId);
  const selected = getReferralListSelection(state, job.id);
  const draft = buildReferralDraft(state, job, selected);
  const existingReferral = state.referrals.find(
    (referral) => referral.jobId === job.id && referral.state === 'registrado'
  );

  const effectiveMessage = message ?? draft.message;

  if (selected.length === 0) {
    return (
      <div className="space-y-6">
        <IelPageHeader
          eyebrow={`${company?.name} · ${job.title}`}
          title="Preparação do encaminhamento"
          description="Reúna candidatos de uma vaga, revise os resumos e registre o encaminhamento."
          actions={
            <Link href={iel.jobs.byId(job.id).index}>
              <Button variant="outline">Voltar para a mesa de seleção</Button>
            </Link>
          }
        />
        <Panel padding="lg">
          <PanelHeader
            eyebrow="Lista vazia"
            title="A lista desta vaga está vazia"
          />
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Adicione candidaturas pela matriz de seleção ou pelo perfil
            consolidado. A lista de encaminhamento é diferente da seleção
            temporária de comparação.
          </p>
          {existingReferral ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Esta vaga já tem um encaminhamento registrado com{' '}
              {plural(existingReferral.items.length, 'perfil', 'perfis')}.{' '}
              <Link
                className="underline"
                href={iel.referrals.byId(existingReferral.id)}
              >
                Ver encaminhamento
              </Link>
              .
            </p>
          ) : null}
        </Panel>
        {registered && existingReferral ? (
          <Alert variant="success">
            Encaminhamento registrado. “Atualização externa não enviada —
            demonstração”: o sistema de recrutamento original não foi alterado.
            Troque a persona para a empresa e registre o interesse em entrevista
            em{' '}
            <Link
              className="underline"
              href={iel.referrals.byId(existingReferral.id)}
            >
              {existingReferral.id}
            </Link>
            .
          </Alert>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <IelPageHeader
        eyebrow={`${company?.name} · ${job.title}`}
        title="Preparação do encaminhamento"
        description="Revise o que a empresa vai receber."
        actions={
          <Link href={iel.jobs.byId(job.id).index}>
            <Button variant="outline">Voltar para a mesa de seleção</Button>
          </Link>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="info">
            {plural(selected.length, 'perfil', 'perfis')} na lista
          </Chip>
          {existingReferral ? (
            <Chip tone="atencao">
              Já existe encaminhamento registrado nesta vaga
            </Chip>
          ) : null}
        </div>
      </IelPageHeader>

      {registered && existingReferral ? (
        <Alert variant="success">
          Encaminhamento registrado. “Atualização externa não enviada —
          demonstração”: o sistema de recrutamento original não foi alterado.{' '}
          <Link
            className="underline"
            href={iel.referrals.byId(existingReferral.id)}
          >
            Abrir o encaminhamento
          </Link>{' '}
          ou troque a persona para a empresa e registre o interesse em
          entrevista.
        </Alert>
      ) : null}

      {existingReferral ? (
        <Alert variant="info">
          Registrar de novo não duplica os perfis já compartilhados: as decisões
          da empresa são preservadas e só os novos perfis são acrescentados.
        </Alert>
      ) : null}

      <Panel>
        <PanelHeader
          eyebrow="Comunicação"
          title="Mensagem para a empresa"
          hint="Texto sugerido pela análise assistida, revisável antes do registro."
        />
        <div className="mt-4">
          <Textarea
            aria-label="Mensagem para a empresa"
            rows={3}
            value={effectiveMessage}
            onChange={(event) => setMessage(event.target.value)}
          />
        </div>
      </Panel>

      <ul className="space-y-4">
        {draft.items.map((item) => {
          const application = getApplication(state, item.applicationId);
          const talent = application ? getTalent(application.talentId) : null;
          const sharedEvidences = getEvidencesByIds(
            state,
            item.sharedEvidenceIds
          );
          const justification =
            justifications[item.applicationId] ?? item.justification;

          return (
            <li key={item.applicationId}>
              <Panel className="flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-foreground">
                      {talent?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.summary}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      dispatch({
                        type: 'remove-from-referral-list',
                        jobId: job.id,
                        applicationId: item.applicationId,
                        at: nowIso()
                      });
                      toast.success('Perfil removido da lista.');
                    }}
                  >
                    Remover da lista
                  </Button>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor={`justification-${item.applicationId}`}
                    className="block text-sm font-medium text-foreground"
                  >
                    Justificativa do encaminhamento
                  </label>
                  <Textarea
                    id={`justification-${item.applicationId}`}
                    rows={2}
                    value={justification}
                    onChange={(event) =>
                      setJustifications((current) => ({
                        ...current,
                        [item.applicationId]: event.target.value
                      }))
                    }
                    error={
                      justification.trim().length === 0
                        ? 'Escreva uma justificativa antes de registrar.'
                        : undefined
                    }
                  />
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Pontos de atenção compartilhados
                    </p>
                    {item.attentionPoints.length === 0 ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Nenhum ponto pendente registrado.
                      </p>
                    ) : (
                      <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                        {item.attentionPoints.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Perguntas sugeridas para a entrevista
                    </p>
                    {item.suggestedQuestions.length === 0 ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Sem perguntas pendentes.
                      </p>
                    ) : (
                      <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                        {item.suggestedQuestions.map((question) => (
                          <li key={question}>{question}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Evidências incluídas no snapshot ({sharedEvidences.length})
                  </p>
                  <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                    {sharedEvidences.map((evidence) => (
                      <li key={evidence.id}>
                        “{evidence.information}” — {evidence.originLabel}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Notas internas do IEL não entram. Notas criadas depois do
                    registro não aparecem retroativamente para a empresa.
                  </p>
                </div>
              </Panel>
            </li>
          );
        })}
      </ul>

      <Panel className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Preparar a lista, encaminhar para análise e contratar são ações
          diferentes. Registrar o encaminhamento apenas compartilha as
          informações com a empresa e registra o estado.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={draft.items.some(
              (item) =>
                (
                  justifications[item.applicationId] ?? item.justification
                ).trim().length === 0
            )}
            onClick={() => {
              const at = nowIso();
              dispatch({
                type: 'register-referral',
                at,
                input: {
                  jobId: job.id,
                  companyId: job.companyId,
                  message: effectiveMessage,
                  items: draft.items.map((item) => ({
                    applicationId: item.applicationId,
                    justification:
                      justifications[item.applicationId] ?? item.justification,
                    sharedEvidenceIds: item.sharedEvidenceIds,
                    summary: item.summary,
                    attentionPoints: item.attentionPoints,
                    suggestedQuestions: item.suggestedQuestions
                  }))
                }
              });
              setRegistered(true);
              toast.success(
                'Encaminhamento registrado no ambiente local. Nenhuma atualização foi enviada para fora.'
              );
            }}
          >
            Registrar encaminhamento
          </Button>
          <Button
            variant="outline"
            onClick={() => setPreviewing(true)}
          >
            Pré-visualizar o que a empresa recebe
          </Button>
          <Link href={iel.referrals.index}>
            <Button variant="outline">Ver encaminhamentos</Button>
          </Link>
        </div>
      </Panel>

      <ReferralPreviewDialog
        job={job}
        message={effectiveMessage}
        items={draft.items}
        justifications={justifications}
        visible={previewing}
        onHide={() => setPreviewing(false)}
      />
    </div>
  );
}
