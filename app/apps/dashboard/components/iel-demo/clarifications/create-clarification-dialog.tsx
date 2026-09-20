'use client';

import { useEffect, useMemo, useState } from 'react';
import { suggestQuestion } from '@/features/iel-demo/analysis/assistant';
import { findClarificationTemplate } from '@/features/iel-demo/fixtures';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import type { CreateClarificationInput } from '@/features/iel-demo/state/reducer';
import { getTalent, getTeam } from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import type {
  Application,
  ClarificationEffect,
  ClarificationRecipient,
  ClarificationRecipientKind,
  Job,
  JobCriterion
} from '@/features/iel-demo/types';

import {
  Alert,
  Button,
  Dialog,
  FilterNativeSelect,
  Textarea,
  toast
} from '@workspace/ui';

type CreateClarificationDialogProps = {
  job: Job;
  criterion: JobCriterion;
  /** Candidatura de origem; nulo quando a pergunta é só sobre a equipe. */
  application: Application | null;
  visible: boolean;
  onHide: () => void;
  onCreated?: (clarificationId: string) => void;
};

function buildRecipient(
  kind: ClarificationRecipientKind,
  job: Job,
  application: Application | null,
  teamManager: { name: string; email: string; teamId: string } | null
): ClarificationRecipient | null {
  if (kind === 'gestor') {
    if (!teamManager) return null;
    return {
      kind: 'gestor',
      name: teamManager.name,
      role: `Gestor(a) da equipe — ${job.title}`,
      email: teamManager.email,
      companyId: job.companyId,
      teamId: teamManager.teamId,
      talentId: null
    };
  }

  if (!application) return null;
  const talent = getTalent(application.talentId);
  if (!talent) return null;

  return {
    kind: 'candidato',
    name: talent.name,
    role: `Candidato(a) — ${job.title}`,
    email: talent.email,
    companyId: null,
    teamId: null,
    talentId: talent.id
  };
}

/**
 * Criação de solicitação de esclarecimento: destinatário, pergunta revisável e
 * indicação explícita do que será compartilhado.
 */
export function CreateClarificationDialog({
  job,
  criterion,
  application,
  visible,
  onHide,
  onCreated
}: CreateClarificationDialogProps) {
  const { state, dispatch } = useIelDemo();
  const team = getTeam(state, job.teamId);

  const defaultKind: ClarificationRecipientKind =
    criterion.dimension === 'organizacional' || !application
      ? 'gestor'
      : 'candidato';

  const [recipientKind, setRecipientKind] =
    useState<ClarificationRecipientKind>(defaultKind);
  const [question, setQuestion] = useState('');
  const [sharedInfo, setSharedInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const template = useMemo(
    () => findClarificationTemplate(job.id, criterion.id, recipientKind),
    [job.id, criterion.id, recipientKind]
  );

  useEffect(() => {
    if (!visible) return;
    setQuestion(
      template?.suggestedQuestion ??
        suggestQuestion(job, criterion, recipientKind)
    );
    setSharedInfo(
      template?.suggestedSharedInfo ??
        (recipientKind === 'gestor'
          ? 'Título da vaga, turno e o critério em análise. Nenhum nome de candidato e nenhuma anotação interna.'
          : 'Empresa, título da vaga e o motivo da pergunta. Nada sobre outros candidatos ou avaliações internas.')
    );
  }, [visible, template, job, criterion, recipientKind]);

  const recipient = buildRecipient(
    recipientKind,
    job,
    application,
    team
      ? { name: team.managerName, email: team.managerEmail, teamId: team.id }
      : null
  );

  function handleSubmit(asDraft: boolean) {
    if (!recipient) {
      toast.error('Destinatário indisponível para este critério.');
      return;
    }
    if (question.trim().length < 10) {
      toast.error('Escreva a pergunta antes de enviar.');
      return;
    }

    const effects: ClarificationEffect[] = (() => {
      if (recipientKind === 'gestor') {
        return template?.teamEffects ?? [];
      }
      if (!application) return [];
      if (template?.selfEffect) {
        return [
          {
            applicationId: application.id,
            criterionId: criterion.id,
            suggestedState: template.selfEffect.suggestedState,
            note: template.selfEffect.note
          }
        ];
      }
      return [
        {
          applicationId: application.id,
          criterionId: criterion.id,
          suggestedState: 'a-esclarecer',
          note: 'Resposta recebida. O estado final do critério é decidido pelo analista ao incorporar.'
        }
      ];
    })();

    const input: CreateClarificationInput = {
      jobId: job.id,
      applicationId:
        recipientKind === 'candidato' ? (application?.id ?? null) : null,
      criterionId: criterion.id,
      recipient,
      question: question.trim(),
      sharedInfo: sharedInfo.trim(),
      reason:
        template?.reason ??
        `Critério "${criterion.label}" sem informação suficiente para concluir.`,
      preparedAnswer: template?.preparedAnswer ?? null,
      effects,
      teamConditionUpdate: template?.teamConditionUpdate ?? null,
      asDraft
    };

    setSubmitting(true);
    const at = nowIso();
    dispatch({ type: 'create-clarification', input, at });
    setSubmitting(false);
    onHide();
    toast.success(
      asDraft
        ? 'Rascunho salvo em Pendências.'
        : 'Solicitação registrada e enviada.'
    );
    onCreated?.('novo');
  }

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      size="lg"
      header="Solicitar esclarecimento"
      description={`${job.title} · critério “${criterion.label}”`}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onHide}
          >
            Cancelar
          </Button>
          <Button
            variant="outline"
            loading={submitting}
            onClick={() => handleSubmit(true)}
          >
            Salvar rascunho
          </Button>
          <Button
            loading={submitting}
            onClick={() => handleSubmit(false)}
          >
            Enviar solicitação
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="clarification-recipient"
            className="block text-sm font-medium text-foreground"
          >
            Destinatário
          </label>
          <FilterNativeSelect
            id="clarification-recipient"
            value={recipientKind}
            onValueChange={(value) =>
              setRecipientKind(value as ClarificationRecipientKind)
            }
          >
            <option value="gestor">
              Gestor(a) da equipe{team ? ` — ${team.managerName}` : ''}
            </option>
            <option
              value="candidato"
              disabled={!application}
            >
              {application
                ? `Candidato(a) — ${getTalent(application.talentId)?.name}`
                : 'Candidato(a) — selecione uma candidatura'}
            </option>
          </FilterNativeSelect>
          {recipient ? (
            <p className="text-xs text-muted-foreground">
              {recipient.name} · {recipient.role} · {recipient.email}
            </p>
          ) : (
            <p className="text-xs text-destructive">
              Sem destinatário disponível para esta combinação.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="clarification-question"
            className="block text-sm font-medium text-foreground"
          >
            Pergunta (sugerida pela análise, revise antes de enviar)
          </label>
          <Textarea
            id="clarification-question"
            rows={3}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="clarification-shared"
            className="block text-sm font-medium text-foreground"
          >
            O que será compartilhado com o destinatário
          </label>
          <Textarea
            id="clarification-shared"
            rows={2}
            value={sharedInfo}
            onChange={(event) => setSharedInfo(event.target.value)}
          />
        </div>

        <Alert variant="default">
          A mensagem que chega a quem recebe fica em Pendências, na ação “Abrir
          experiência do destinatário”.
        </Alert>
      </div>
    </Dialog>
  );
}
