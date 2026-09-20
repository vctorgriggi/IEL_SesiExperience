'use client';

import Link from 'next/link';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplication,
  getCompany,
  getJobsByCompany,
  getReferralsByCompany,
  getTalent,
  getTeamsByCompany
} from '@/features/iel-demo/state/selectors';
import {
  IconAlertCircle,
  IconCircleCheck,
  IconCircleDashed
} from '@tabler/icons-react';

import { routes } from '@workspace/routes';
import { Alert } from '@workspace/ui';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';

import { formatarData } from '../shared/datas';

/**
 * O retorno da empresa, em uma palavra e um ícone.
 *
 * Cor nunca é o único canal: o estado vem escrito ao lado do ícone, porque
 * quem não distingue verde de vermelho continua precisando da informação.
 */
function DecisaoBadge({
  decision
}: {
  decision: 'quero-entrevistar' | 'nao-avancar' | 'pendente';
}) {
  if (decision === 'quero-entrevistar') {
    return (
      <Badge
        variant="outline"
        className="text-muted-foreground"
      >
        <IconCircleCheck className="text-success" />
        Quero entrevistar
      </Badge>
    );
  }
  if (decision === 'nao-avancar') {
    return (
      <Badge
        variant="outline"
        className="text-muted-foreground"
      >
        <IconCircleDashed className="text-muted-foreground" />
        Não avançar
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="text-muted-foreground"
    >
      <IconAlertCircle className="text-[hsl(var(--brand-accent))]" />
      Retorno pendente
    </Badge>
  );
}

/** Painel da empresa: só a própria empresa e o que o IEL compartilhou. */
export function ManagerOverview() {
  const { state, persona } = useIelDemo();
  const iel = routes.dashboard.iel;
  const company = persona.companyId ? getCompany(persona.companyId) : null;

  if (!company) {
    return (
      <Alert variant="destructive">Empresa da persona não encontrada.</Alert>
    );
  }

  const jobs = getJobsByCompany(company.id);
  const referrals = getReferralsByCompany(state, company.id);
  const sharedProfiles = referrals.flatMap((referral) => referral.items);
  const pendingDecisions = sharedProfiles.filter(
    (item) => item.managerDecision === 'pendente'
  ).length;
  const questions = state.clarifications.filter(
    (clarification) =>
      clarification.recipient.kind === 'gestor' &&
      clarification.recipient.companyId === company.id &&
      clarification.state === 'solicitada'
  );
  const teams = getTeamsByCompany(state, company.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">{company.name}</h1>
        <p className="text-sm text-muted-foreground">
          {company.sector} · {company.location} — suas vagas, os perfis que o
          IEL encaminhou e as perguntas dirigidas à sua equipe.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Vagas da empresa</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {jobs.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Perfis compartilhados</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {sharedProfiles.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Retornos pendentes</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {pendingDecisions}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {questions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Perguntas do IEL sobre a sua equipe</CardTitle>
            <CardDescription>
              Aguardando você. Cada resposta entra na leitura da vaga a que
              pertence.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {questions.map((clarification) => (
                <li
                  key={clarification.id}
                  className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-sm">{clarification.question}</p>
                  <Button
                    size="sm"
                    asChild
                  >
                    <Link href={iel.clarifications.respond(clarification.id)}>
                      Responder
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Perfis encaminhados pelo IEL</CardTitle>
          <CardDescription>
            Do IEL para você, com as evidências autorizadas pela pessoa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sharedProfiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum perfil compartilhado até agora. Quando o IEL registrar um
              encaminhamento, ele aparece aqui com as evidências autorizadas.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {referrals.map((referral) =>
                referral.items.map((item) => {
                  const application = getApplication(state, item.applicationId);
                  const talent = application
                    ? getTalent(application.talentId)
                    : null;
                  return (
                    <li
                      key={`${referral.id}-${item.applicationId}`}
                      className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {talent?.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.summary}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <DecisaoBadge decision={item.managerDecision} />
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <Link href={iel.referrals.byId(referral.id)}>
                            Abrir
                          </Link>
                        </Button>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contexto registrado das suas equipes</CardTitle>
          <CardDescription>
            Condições de trabalho já descritas — é o que o IEL usa para comparar
            com o que a pessoa procura.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2">
            {teams.map((team) => (
              <li
                key={team.id}
                className="rounded-md border p-3"
              >
                <p className="text-sm font-medium">{team.name}</p>
                <p className="text-xs text-muted-foreground">{team.routine}</p>
                <ul className="mt-2 flex flex-col gap-1">
                  {team.conditions.map((condition) => (
                    <li
                      key={condition.id}
                      className="text-xs text-muted-foreground"
                    >
                      <span className="font-medium text-foreground">
                        {condition.label}:
                      </span>{' '}
                      {condition.value} ·{' '}
                      {condition.status === 'confirmado'
                        ? 'confirmado por você'
                        : condition.status === 'da-descricao'
                          ? 'origem: descrição da vaga'
                          : 'a confirmar'}{' '}
                      · {formatarData(condition.updatedAt)}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <div>
            <Button
              size="sm"
              variant="outline"
              asChild
            >
              <Link href={iel.companies.byId(company.id)}>
                Ver contexto completo
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
