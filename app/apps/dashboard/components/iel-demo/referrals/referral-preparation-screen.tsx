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
import { Alert, Textarea, toast } from '@workspace/ui';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';
import { Label } from '@workspace/ui/shadcn/label';

import { usePageHeader } from '../layout/page-header-context';
import { ReferralPreviewDialog } from './referral-preview-dialog';
import { ReferralReportLink } from './report-link';

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

  /*
    O caminho é publicado antes de qualquer saída antecipada: `usePageHeader`
    é um hook, e a vaga inexistente não pode mudar a ordem das chamadas.
  */
  usePageHeader({
    breadcrumb: [
      { label: 'Vagas', href: iel.jobs.index },
      ...(job ? [{ label: job.title, href: iel.jobs.byId(job.id).index }] : []),
      { label: 'Envio' }
    ],
    actions: job ? (
      <Button
        variant="outline"
        size="sm"
        asChild
      >
        <Link href={iel.jobs.byId(job.id).index}>Voltar para a vaga</Link>
      </Button>
    ) : undefined
  });

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

  const cabecalho = (
    <div className="flex flex-col gap-1">
      <h1 className="text-xl font-semibold tracking-tight">
        Preparação do encaminhamento
      </h1>
      <p className="text-sm text-muted-foreground">
        {company?.name} · {job.title} — revise o que a empresa vai receber.
      </p>
    </div>
  );

  if (selected.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {cabecalho}
        <Card>
          <CardHeader>
            <CardTitle>A lista desta vaga está vazia</CardTitle>
            <CardDescription>
              Marque quem vai antes de preparar o envio.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="max-w-xl text-sm text-muted-foreground">
              Adicione candidaturas pelo ranking da vaga ou pelo perfil
              consolidado. A lista de encaminhamento é diferente da seleção
              temporária de comparação.
            </p>
            {existingReferral ? (
              <p className="text-sm text-muted-foreground">
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
          </CardContent>
        </Card>
        {existingReferral ? <ReferralReportLink jobId={job.id} /> : null}

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
    <div className="flex flex-col gap-4">
      {cabecalho}

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">
          {plural(selected.length, 'perfil', 'perfis')} na lista
        </Badge>
        {existingReferral ? (
          <Badge variant="outline">
            Já existe encaminhamento registrado nesta vaga
          </Badge>
        ) : null}
      </div>

      {existingReferral ? <ReferralReportLink jobId={job.id} /> : null}

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

      <Card>
        <CardHeader>
          <CardTitle>Mensagem para a empresa</CardTitle>
          <CardDescription>
            Texto sugerido pela análise assistida, revisável antes do registro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            aria-label="Mensagem para a empresa"
            rows={3}
            value={effectiveMessage}
            onChange={(event) => setMessage(event.target.value)}
          />
        </CardContent>
      </Card>

      <ul className="flex flex-col gap-4">
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
              <Card>
                <CardHeader>
                  <CardTitle>{talent?.name}</CardTitle>
                  <CardDescription>{item.summary}</CardDescription>
                  <CardAction>
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
                  </CardAction>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`justification-${item.applicationId}`}>
                      Justificativa do encaminhamento
                    </Label>
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

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
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
                      <p className="text-xs font-medium text-muted-foreground">
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
                    <p className="text-xs font-medium text-muted-foreground">
                      Evidências incluídas no retrato ({sharedEvidences.length})
                    </p>
                    <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                      {sharedEvidences.map((evidence) => (
                        <li key={evidence.id}>
                          “{evidence.information}” — {evidence.originLabel}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Notas internas do IEL não entram. Notas criadas depois do
                      registro não aparecem retroativamente para a empresa.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>

      <Card>
        <CardContent className="flex flex-col gap-3">
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
                        justifications[item.applicationId] ??
                        item.justification,
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
            <Button
              variant="outline"
              asChild
            >
              <Link href={iel.referrals.index}>Ver encaminhamentos</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

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
