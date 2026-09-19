'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getClarification,
  getCompany,
  getCriterion,
  getJob,
  getTeam
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';

import { routes } from '@workspace/routes';
import { Alert, Button, Checkbox, Textarea, toast } from '@workspace/ui';

import { Chip, DemoDataBadge, Panel } from '../shared/ui';
import { TalentTransparency } from './talent-transparency';

/**
 * Experiência do destinatário (gestor ou candidato): contexto mínimo, pergunta,
 * resposta revisável e confirmação. Feita para funcionar bem no celular.
 */
export function RecipientExperienceScreen({
  clarificationId
}: {
  clarificationId: string;
}) {
  const { state, dispatch } = useIelDemo();
  const [answer, setAnswer] = useState('');
  const [declined, setDeclined] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const iel = routes.dashboard.iel;

  const clarification = getClarification(state, clarificationId);

  useEffect(() => {
    if (clarification?.preparedAnswer) {
      setAnswer(clarification.preparedAnswer);
    }
  }, [clarification?.preparedAnswer]);

  if (!clarification) {
    return (
      <Alert variant="destructive">
        Solicitação não encontrada.{' '}
        <Link
          className="underline"
          href={iel.clarifications.index}
        >
          Voltar para pendências
        </Link>
        .
      </Alert>
    );
  }

  const job = getJob(clarification.jobId);
  const company = job ? getCompany(job.companyId) : null;
  const team = job ? getTeam(state, job.teamId) : null;
  const criterion = job ? getCriterion(job, clarification.criterionId) : null;
  const isManager = clarification.recipient.kind === 'gestor';
  const alreadyAnswered = clarification.state !== 'solicitada';

  if (submitted || alreadyAnswered) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Panel className="flex flex-col gap-3">
          <DemoDataBadge />
          <h1 className="text-lg font-semibold text-foreground">
            {clarification.state === 'incorporada'
              ? 'Resposta já incorporada à análise'
              : 'Resposta registrada'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Obrigado. A resposta abaixo ficou registrada e aparece no painel do
            analista do IEL. Nenhuma mensagem foi enviada fora deste ambiente.
          </p>
          <div className="rounded-[var(--control-radius)] border border-border bg-muted/50 p-3">
            <p className="text-sm text-foreground">“{clarification.answer}”</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={iel.clarifications.index}>
              <Button variant="outline">
                Voltar ao roteiro da demonstração
              </Button>
            </Link>
            {job ? (
              <Link href={iel.jobs.byId(job.id).index}>
                <Button variant="ghost">Abrir a vaga como analista</Button>
              </Link>
            ) : null}
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {/*
        Antes de pedir que a pessoa responda, mostrar o que já está registrado
        sobre ela. As exigências normativas do desafio pedem transparência e
        controle de acesso, e uma pergunta feita sem esse contexto pede
        confiança sem oferecer nada em troca.
      */}
      {!isManager && clarification.recipient.talentId ? (
        <TalentTransparency talentId={clarification.recipient.talentId} />
      ) : null}

      <Panel className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <DemoDataBadge />
          <Chip tone="info">
            {isManager ? 'Visão do gestor da empresa' : 'Visão do candidato'}
          </Chip>
        </div>

        <h1 className="text-lg font-semibold text-foreground">
          {isManager
            ? `Uma pergunta sobre a equipe da vaga ${job?.title}`
            : `Uma pergunta sobre sua candidatura em ${company?.name}`}
        </h1>

        <dl className="space-y-1 text-sm">
          <div className="flex flex-wrap gap-1">
            <dt className="font-medium text-foreground">Empresa:</dt>
            <dd className="text-muted-foreground">{company?.name}</dd>
          </div>
          <div className="flex flex-wrap gap-1">
            <dt className="font-medium text-foreground">Vaga:</dt>
            <dd className="text-muted-foreground">
              {job?.title} · {job?.workShift}
            </dd>
          </div>
          {isManager && team ? (
            <div className="flex flex-wrap gap-1">
              <dt className="font-medium text-foreground">Equipe:</dt>
              <dd className="text-muted-foreground">{team.name}</dd>
            </div>
          ) : null}
        </dl>

        <div className="rounded-[var(--control-radius)] border border-border bg-muted/50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Por que estamos perguntando
          </p>
          <p className="text-sm text-foreground">{clarification.reason}</p>
          {criterion ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Critério em análise: {criterion.label}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">
            O que foi compartilhado com você: {clarification.sharedInfo}
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            {clarification.question}
          </h2>
          <label
            htmlFor="recipient-answer"
            className="block text-sm font-medium text-foreground"
          >
            Sua resposta
          </label>
          <Textarea
            id="recipient-answer"
            rows={5}
            value={declined ? '' : answer}
            disabled={declined}
            onChange={(event) => setAnswer(event.target.value)}
            helperText="Você pode editar o texto antes de confirmar."
          />
          <div className="flex items-start gap-2">
            <Checkbox
              inputId="recipient-declined"
              checked={declined}
              onCheckedChange={setDeclined}
              className="mt-1"
            />
            <label
              htmlFor="recipient-declined"
              className="text-sm text-muted-foreground"
            >
              Não sei responder ou prefiro não responder agora.
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            className="sm:flex-1"
            disabled={!declined && answer.trim().length < 3}
            onClick={() => {
              dispatch({
                type: 'answer-clarification',
                clarificationId: clarification.id,
                answer: answer.trim(),
                declined,
                at: nowIso()
              });
              setSubmitted(true);
              toast.success(
                declined
                  ? 'Registramos que a informação segue indisponível.'
                  : 'Resposta enviada para a análise do IEL.'
              );
            }}
          >
            Confirmar resposta
          </Button>
          <Link
            href={iel.clarifications.index}
            className="sm:flex-1"
          >
            <Button
              variant="outline"
              className="w-full"
            >
              Sair sem responder
            </Button>
          </Link>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Se você disser que não sabe, a informação continua marcada como
          indisponível: não existe penalidade automática nem resposta inventada.
        </p>
      </Panel>
    </div>
  );
}
