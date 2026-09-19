'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getCandidateJobView,
  getClarification,
  getCompany,
  getCriterion,
  getJob,
  getTeam
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';

import { routes } from '@workspace/routes';
import { Textarea, toast } from '@workspace/ui';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';
import { Checkbox } from '@workspace/ui/shadcn/checkbox';
import { Label } from '@workspace/ui/shadcn/label';

import { TalentTransparency } from './talent-transparency';

/**
 * Experiência do destinatário (gestor ou candidato).
 *
 * Contexto mínimo, pergunta, resposta revisável e confirmação, no celular. O
 * recorte do contexto muda com quem recebe: o gestor vê a empresa e a equipe
 * porque são dele; o candidato vê atividade, segmento, localidade e turno —
 * nunca o nome da empresa (R5), que só aparece a partir da entrevista.
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
      <div className="mx-auto w-full max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Pergunta não encontrada</CardTitle>
            <CardDescription>
              Este link não corresponde a nenhuma pergunta em aberto.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="outline"
              asChild
            >
              <Link href={iel.clarifications.index}>Voltar para perguntas</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const job = getJob(clarification.jobId);
  const company = job ? getCompany(job.companyId) : null;
  const team = job ? getTeam(state, job.teamId) : null;
  const criterion = job ? getCriterion(job, clarification.criterionId) : null;
  const isManager = clarification.recipient.kind === 'gestor';
  const candidateView = clarification.applicationId
    ? getCandidateJobView(state, clarification.applicationId)
    : null;
  const alreadyAnswered = clarification.state !== 'solicitada';

  if (submitted || alreadyAnswered) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <Card>
          <CardHeader>
            <CardDescription>Dados de demonstração</CardDescription>
            <CardTitle className="text-lg">
              {clarification.state === 'incorporada'
                ? 'Resposta já incorporada à análise'
                : 'Resposta registrada'}
            </CardTitle>
            <CardDescription>
              Obrigado. A resposta abaixo ficou registrada e aparece para o
              analista do IEL. Nenhuma mensagem saiu deste ambiente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="rounded-lg border bg-muted/50 p-3 text-sm text-foreground">
              “{clarification.answer}”
            </p>
          </CardContent>
          <CardFooter className="gap-2">
            <Button
              variant="outline"
              asChild
            >
              <Link href={iel.clarifications.index}>Voltar às perguntas</Link>
            </Button>
            {job ? (
              <Button
                variant="ghost"
                asChild
              >
                <Link href={iel.jobs.byId(job.id).index}>
                  Abrir a vaga como analista
                </Link>
              </Button>
            ) : null}
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      {/*
        Antes de pedir que a pessoa responda, mostrar o que já está registrado
        sobre ela. As exigências normativas do desafio pedem transparência e
        controle de acesso, e uma pergunta feita sem esse contexto pede
        confiança sem oferecer nada em troca.
      */}
      {!isManager && clarification.recipient.talentId ? (
        <TalentTransparency talentId={clarification.recipient.talentId} />
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="text-muted-foreground"
            >
              Dados de demonstração
            </Badge>
            <Badge
              variant="outline"
              className="text-muted-foreground"
            >
              {isManager ? 'Visão do gestor' : 'Visão do candidato'}
            </Badge>
          </div>
          <CardTitle className="text-lg">
            {isManager
              ? `Uma pergunta sobre a equipe da vaga ${job?.title}`
              : `Uma pergunta sobre a sua candidatura`}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <dl className="space-y-1 text-sm">
            {isManager ? (
              <>
                <Linha
                  rotulo="Empresa"
                  valor={company?.name}
                />
                <Linha
                  rotulo="Vaga"
                  valor={job ? `${job.title} · ${job.workShift}` : undefined}
                />
                {team ? (
                  <Linha
                    rotulo="Equipe"
                    valor={team.name}
                  />
                ) : null}
              </>
            ) : (
              <>
                {/* R5: atividade, segmento, localidade e turno — nunca o nome
                    da empresa, que só aparece a partir da entrevista. */}
                <Linha
                  rotulo="Vaga"
                  valor={candidateView?.activity ?? job?.title}
                />
                <Linha
                  rotulo="Segmento"
                  valor={candidateView?.sector}
                />
                <Linha
                  rotulo="Onde"
                  valor={candidateView?.location}
                />
                <Linha
                  rotulo="Turno"
                  valor={candidateView?.shift ?? job?.workShift}
                />
              </>
            )}
          </dl>

          <div className="space-y-1 rounded-lg border bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Por que estamos perguntando
            </p>
            <p className="text-sm text-foreground">{clarification.reason}</p>
            {criterion ? (
              <p className="text-xs text-muted-foreground">
                Ponto em análise: {criterion.label}
              </p>
            ) : null}
            <p className="pt-1 text-xs text-muted-foreground">
              O que foi compartilhado com você: {clarification.sharedInfo}
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              {clarification.question}
            </h2>
            <Label htmlFor="recipient-answer">Sua resposta</Label>
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
                id="recipient-declined"
                checked={declined}
                onCheckedChange={(checked) => setDeclined(checked === true)}
                className="mt-1"
              />
              <Label
                htmlFor="recipient-declined"
                className="font-normal text-muted-foreground"
              >
                Não sei responder ou prefiro não responder agora.
              </Label>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex-col items-stretch gap-2 sm:flex-row">
          <Button
            size="lg"
            className="h-12 sm:h-9 sm:flex-1"
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
          <Button
            variant="outline"
            size="lg"
            className="h-12 sm:h-9 sm:flex-1"
            asChild
          >
            <Link href={iel.clarifications.index}>Sair sem responder</Link>
          </Button>
        </CardFooter>

        <CardContent>
          <p className="text-xs text-muted-foreground">
            Se você disser que não sabe, a informação continua marcada como
            indisponível: não existe penalidade automática nem resposta
            inventada.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor?: string }) {
  if (!valor) return null;
  return (
    <div className="flex flex-wrap gap-1">
      <dt className="font-medium text-foreground">{rotulo}:</dt>
      <dd className="text-muted-foreground">{valor}</dd>
    </div>
  );
}
