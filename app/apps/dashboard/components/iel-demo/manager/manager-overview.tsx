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

import { routes } from '@workspace/routes';
import { Alert, Button, MetricCard } from '@workspace/ui';

import {
  Chip,
  formatDate,
  IelPageHeader,
  Panel,
  PanelHeader
} from '../shared/ui';

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
    <div className="space-y-6">
      <IelPageHeader
        eyebrow={`${company.sector} · ${company.location}`}
        title={`${company.name} — painel da empresa`}
        description="Suas vagas, os perfis que o IEL encaminhou e as perguntas dirigidas à sua equipe."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          title="Vagas da empresa"
          value={jobs.length}
        />
        <MetricCard
          title="Perfis compartilhados"
          value={sharedProfiles.length}
        />
        <MetricCard
          title="Retornos pendentes"
          value={pendingDecisions}
        />
      </section>

      {questions.length > 0 ? (
        <Panel className="flex flex-col gap-3">
          <PanelHeader
            eyebrow="Aguardando você"
            title="Perguntas do IEL sobre a sua equipe"
          />
          <ul className="space-y-2">
            {questions.map((clarification) => (
              <li
                key={clarification.id}
                className="flex flex-col gap-2 rounded-[var(--control-radius)] border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm text-foreground">
                  {clarification.question}
                </p>
                <Link href={iel.clarifications.respond(clarification.id)}>
                  <Button size="sm">Responder</Button>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel className="flex flex-col gap-3">
        <PanelHeader
          eyebrow="Do IEL para você"
          title="Perfis encaminhados pelo IEL"
        />
        {sharedProfiles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum perfil compartilhado até agora. Quando o IEL registrar um
            encaminhamento, ele aparece aqui com as evidências autorizadas.
          </p>
        ) : (
          <ul className="space-y-2">
            {referrals.map((referral) =>
              referral.items.map((item) => {
                const application = getApplication(state, item.applicationId);
                const talent = application
                  ? getTalent(application.talentId)
                  : null;
                return (
                  <li
                    key={`${referral.id}-${item.applicationId}`}
                    className="flex flex-col gap-2 rounded-[var(--control-radius)] border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {talent?.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.summary}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Chip
                        tone={
                          item.managerDecision === 'quero-entrevistar'
                            ? 'positivo'
                            : item.managerDecision === 'nao-avancar'
                              ? 'conflito'
                              : 'atencao'
                        }
                      >
                        {item.managerDecision === 'quero-entrevistar'
                          ? 'Quero entrevistar'
                          : item.managerDecision === 'nao-avancar'
                            ? 'Não avançar'
                            : 'Retorno pendente'}
                      </Chip>
                      <Link href={iel.referrals.byId(referral.id)}>
                        <Button size="sm">Abrir</Button>
                      </Link>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </Panel>

      <Panel className="flex flex-col gap-3">
        <PanelHeader
          eyebrow="Condições de trabalho"
          title="Contexto registrado das suas equipes"
        />
        <ul className="space-y-2">
          {teams.map((team) => (
            <li
              key={team.id}
              className="rounded-[var(--control-radius)] border border-border p-3"
            >
              <p className="text-sm font-medium text-foreground">{team.name}</p>
              <p className="text-xs text-muted-foreground">{team.routine}</p>
              <ul className="mt-2 space-y-1">
                {team.conditions.map((condition) => (
                  <li
                    key={condition.id}
                    className="text-xs text-muted-foreground"
                  >
                    <span className="font-medium text-foreground/80">
                      {condition.label}:
                    </span>{' '}
                    {condition.value} ·{' '}
                    {condition.status === 'confirmado'
                      ? 'confirmado por você'
                      : condition.status === 'da-descricao'
                        ? 'origem: descrição da vaga'
                        : 'a confirmar'}{' '}
                    · {formatDate(condition.updatedAt)}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <Link href={iel.companies.byId(company.id)}>
          <Button
            size="sm"
            variant="outline"
          >
            Ver contexto completo
          </Button>
        </Link>
      </Panel>
    </div>
  );
}
