'use client';

import { useState } from 'react';
import Link from 'next/link';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplication,
  getCompany,
  getEvidencesByIds,
  getJob,
  getReferral,
  getReferralsByCompany,
  getRegisteredReferrals,
  getTalent,
  REFERRAL_STAGE_LABEL
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import type { ReferralItem } from '@/features/iel-demo/types';

import { routes } from '@workspace/routes';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Textarea,
  toast
} from '@workspace/ui';

import { Chip, formatDateTime, IelPageHeader } from '../shared/ui';

function decisionChip(item: ReferralItem) {
  if (item.managerDecision === 'quero-entrevistar') {
    return <Chip tone="positivo">Empresa quer entrevistar</Chip>;
  }
  if (item.managerDecision === 'nao-avancar') {
    return <Chip tone="conflito">Empresa não vai avançar</Chip>;
  }
  return <Chip tone="atencao">Aguardando retorno da empresa</Chip>;
}

export function ReferralsScreen() {
  const { state, persona } = useIelDemo();
  const iel = routes.dashboard.iel;

  const referrals =
    persona.kind === 'gestor' && persona.companyId
      ? getReferralsByCompany(state, persona.companyId)
      : getRegisteredReferrals(state);

  return (
    <div className="space-y-6">
      <IelPageHeader
        eyebrow={
          persona.kind === 'gestor'
            ? `${persona.label} — apenas os perfis compartilhados com a sua empresa`
            : 'Encaminhamentos registrados'
        }
        title={
          persona.kind === 'gestor' ? 'Perfis encaminhados' : 'Encaminhamentos'
        }
        description="Cada registro guarda um retrato das informações no momento do encaminhamento."
      />

      {referrals.length === 0 ? (
        <Card padding="lg">
          <h3 className="text-base font-semibold text-foreground">
            Nenhum encaminhamento registrado
          </h3>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {persona.kind === 'gestor'
              ? 'Quando o IEL compartilhar perfis para uma vaga da sua empresa, eles aparecem aqui com as evidências autorizadas.'
              : 'Prepare um encaminhamento a partir da lista de uma vaga para registrar o compartilhamento com a empresa.'}
          </p>
        </Card>
      ) : (
        <ul className="space-y-4">
          {referrals.map((referral) => {
            const job = getJob(referral.jobId);
            const company = getCompany(referral.companyId);
            const pending = referral.items.filter(
              (item) => item.managerDecision === 'pendente'
            ).length;

            return (
              <li key={referral.id}>
                <Card className="gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-foreground">
                        {job?.title} — {company?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {referral.id} · registrado em{' '}
                        {referral.createdAt
                          ? formatDateTime(referral.createdAt)
                          : '—'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Chip>
                        {plural(referral.items.length, 'perfil', 'perfis')}
                      </Chip>
                      {pending > 0 ? (
                        <Chip tone="atencao">{pending} aguardando retorno</Chip>
                      ) : (
                        <Chip tone="positivo">Retornos registrados</Chip>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {referral.items.map((item) => {
                      const application = getApplication(
                        state,
                        item.applicationId
                      );
                      const talent = application
                        ? getTalent(application.talentId)
                        : null;
                      return (
                        <li
                          key={item.applicationId}
                          className="flex flex-wrap items-center gap-2 text-sm"
                        >
                          <span className="text-foreground">
                            {talent?.name}
                          </span>
                          {decisionChip(item)}
                        </li>
                      );
                    })}
                  </ul>
                  <Link href={iel.referrals.byId(referral.id)}>
                    <Button size="sm">
                      {persona.kind === 'gestor'
                        ? 'Abrir lista encaminhada'
                        : 'Ver encaminhamento e retornos'}
                    </Button>
                  </Link>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Alert variant="default">
        “Quero entrevistar” registra a intenção da empresa e atualiza o
        histórico. Nenhuma reunião é agendada e nenhuma contratação é
        automatizada nesta demonstração.
      </Alert>
    </div>
  );
}

export function ReferralDetailScreen({ referralId }: { referralId: string }) {
  const { state, dispatch, persona } = useIelDemo();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const iel = routes.dashboard.iel;

  const referral = getReferral(state, referralId);

  if (!referral || referral.state !== 'registrado') {
    return <Alert variant="destructive">Encaminhamento não encontrado.</Alert>;
  }

  const job = getJob(referral.jobId);
  const company = getCompany(referral.companyId);

  if (
    persona.kind === 'gestor' &&
    persona.companyId &&
    persona.companyId !== referral.companyId
  ) {
    return (
      <Alert variant="warning">
        Este encaminhamento é de outra empresa e está fora do escopo desta
        persona.{' '}
        <Link
          className="underline"
          href={iel.referrals.index}
        >
          Ver os encaminhamentos da minha empresa
        </Link>
        .
      </Alert>
    );
  }

  const isManager = persona.kind === 'gestor';

  return (
    <div className="space-y-6">
      <IelPageHeader
        eyebrow={`${company?.name} · ${job?.title}`}
        title={
          isManager
            ? 'Perfis compartilhados pelo IEL'
            : `Encaminhamento ${referral.id}`
        }
        description={referral.message}
        actions={
          <Link href={iel.referrals.index}>
            <Button variant="outline">Voltar</Button>
          </Link>
        }
      >
        <p className="text-xs text-muted-foreground">
          Snapshot registrado em{' '}
          {referral.createdAt ? formatDateTime(referral.createdAt) : '—'}. Notas
          internas do IEL e dados de outras empresas não fazem parte deste
          conteúdo.
        </p>
      </IelPageHeader>

      <ul className="space-y-4">
        {referral.items.map((item) => {
          const application = getApplication(state, item.applicationId);
          const talent = application ? getTalent(application.talentId) : null;
          const evidences = getEvidencesByIds(state, item.sharedEvidenceIds);
          const note = notes[item.applicationId] ?? '';

          return (
            <li key={item.applicationId}>
              <Card className="gap-3">
                <CardHeader className="gap-1 p-0">
                  <CardTitle className="text-base">{talent?.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {item.summary}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {decisionChip(item)}
                    {application ? (
                      <Chip>
                        {REFERRAL_STAGE_LABEL[application.referralStage]}
                      </Chip>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 p-0">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Justificativa do IEL
                    </p>
                    <p className="text-sm text-foreground">
                      {item.justification}
                    </p>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Pontos de atenção
                      </p>
                      {item.attentionPoints.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Nenhum ponto pendente.
                        </p>
                      ) : (
                        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
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
                        <p className="text-sm text-muted-foreground">
                          Sem perguntas pendentes.
                        </p>
                      ) : (
                        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                          {item.suggestedQuestions.map((question) => (
                            <li key={question}>{question}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Evidências compartilhadas ({evidences.length})
                    </p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {evidences.map((evidence) => (
                        <li key={evidence.id}>
                          “{evidence.information}” — {evidence.originLabel}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {item.managerNote ? (
                    <div className="rounded-[var(--control-radius)] border border-border bg-muted/50 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Retorno da empresa
                      </p>
                      <p className="text-sm text-foreground">
                        {item.managerNote}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.decidedAt ? formatDateTime(item.decidedAt) : ''}
                      </p>
                    </div>
                  ) : null}

                  {isManager && item.managerDecision === 'pendente' ? (
                    <div className="space-y-2 border-t border-border pt-3">
                      <label
                        htmlFor={`manager-note-${item.applicationId}`}
                        className="block text-sm font-medium text-foreground"
                      >
                        Observação operacional (obrigatória para “Não avançar”)
                      </label>
                      <Textarea
                        id={`manager-note-${item.applicationId}`}
                        rows={2}
                        value={note}
                        onChange={(event) =>
                          setNotes((current) => ({
                            ...current,
                            [item.applicationId]: event.target.value
                          }))
                        }
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            dispatch({
                              type: 'manager-decision',
                              referralId: referral.id,
                              applicationId: item.applicationId,
                              decision: 'quero-entrevistar',
                              note,
                              at: nowIso()
                            });
                            toast.success(
                              'Interesse registrado. Nenhuma reunião foi agendada nesta demonstração.'
                            );
                          }}
                        >
                          Quero entrevistar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={note.trim().length === 0}
                          onClick={() => {
                            dispatch({
                              type: 'manager-clarification-request',
                              referralId: referral.id,
                              applicationId: item.applicationId,
                              question: note,
                              at: nowIso()
                            });
                            toast.success(
                              'Pedido de esclarecimento registrado para o IEL. A candidatura segue encaminhada.'
                            );
                          }}
                        >
                          Solicitar esclarecimento ao IEL
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={note.trim().length === 0}
                          onClick={() => {
                            dispatch({
                              type: 'manager-decision',
                              referralId: referral.id,
                              applicationId: item.applicationId,
                              decision: 'nao-avancar',
                              note,
                              at: nowIso()
                            });
                            toast.success(
                              'Decisão registrada com a justificativa informada.'
                            );
                          }}
                        >
                          Não avançar
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {!isManager ? (
                    <Link
                      href={
                        application
                          ? iel.talents
                              .byId(application.talentId)
                              .inJob(referral.jobId)
                          : iel.talents.index
                      }
                    >
                      <Button
                        size="sm"
                        variant="outline"
                      >
                        Abrir perfil completo (visão IEL)
                      </Button>
                    </Link>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>

      {isManager ? (
        <Alert variant="default">
          Você vê apenas o conteúdo compartilhado neste encaminhamento.
          Avaliações internas, notas do analista e candidaturas de outras
          empresas não são exibidas.
        </Alert>
      ) : null}

      {null}
    </div>
  );
}
