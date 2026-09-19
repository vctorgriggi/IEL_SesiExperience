'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DEMO_COMPANIES } from '@/features/iel-demo/fixtures';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplicationsByJob,
  getClarificationsByJob,
  getCompany,
  getJobsByCompany,
  getTeamsByCompany,
  getVisibleCompanies,
  JOB_STAGE_LABEL
} from '@/features/iel-demo/state/selectors';
import type { JobCriterion } from '@/features/iel-demo/types';

import { routes } from '@workspace/routes';
import { Alert, Button } from '@workspace/ui';

import { CreateClarificationDialog } from '../clarifications/create-clarification-dialog';
import {
  Chip,
  formatDate,
  IelPageHeader,
  Panel,
  PanelHeader
} from '../shared/ui';
import { CollapsibleSection } from '../talents/collapsible-section';
import { CultureProfile } from './culture-profile';
import { CultureSampleSection } from './culture-sample';

export function CompaniesScreen() {
  const { state } = useIelDemo();
  const iel = routes.dashboard.iel;
  const companies = getVisibleCompanies(state);

  return (
    <div className="space-y-6">
      <IelPageHeader
        eyebrow="Empresas atendidas na base demo"
        title="Empresas"
        description="Descrição institucional e condições concretas de cada equipe."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {companies.map((company) => {
          const jobs = getJobsByCompany(company.id);
          const teams = getTeamsByCompany(state, company.id);
          const pendingConditions = teams.flatMap((team) =>
            team.conditions.filter(
              (condition) => condition.status !== 'confirmado'
            )
          );

          return (
            <Panel key={company.id}>
              <PanelHeader
                eyebrow={`${company.sector} · ${company.location}`}
                title={company.name}
              />
              <div className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  {company.institutionalDescription}
                </p>
                <div className="flex flex-wrap gap-1">
                  <Chip>{plural(jobs.length, 'vaga', 'vagas')}</Chip>
                  <Chip>{plural(teams.length, 'equipe', 'equipes')}</Chip>
                  <Chip
                    tone={pendingConditions.length > 0 ? 'atencao' : 'positivo'}
                  >
                    {pendingConditions.length > 0
                      ? `${plural(pendingConditions.length, 'condição', 'condições')} a confirmar`
                      : 'Condições confirmadas'}
                  </Chip>
                </div>
                <Link href={iel.companies.byId(company.id)}>
                  <Button
                    size="sm"
                    variant="outline"
                  >
                    Abrir contexto da empresa
                  </Button>
                </Link>
              </div>
            </Panel>
          );
        })}
      </div>

      <Panel padding="sm">
        <p className="text-xs text-muted-foreground">
          {DEMO_COMPANIES.length} empresas fictícias. Contatos usam o domínio
          example.com e nenhum dado pessoal real é armazenado.
        </p>
      </Panel>
    </div>
  );
}

export function CompanyDetailScreen({ companyId }: { companyId: string }) {
  const { state, persona } = useIelDemo();
  const [clarificationTarget, setClarificationTarget] = useState<{
    jobId: string;
    criterion: JobCriterion;
  } | null>(null);
  // O botão que abre o formulário de convite está no herói, e o formulário
  // fica na seção da amostra: quem guarda o estado é a tela que tem as duas.
  const [inviteFormOpen, setInviteFormOpen] = useState(false);
  const iel = routes.dashboard.iel;
  const company = getCompany(companyId);

  if (!company) {
    return <Alert variant="destructive">Empresa não encontrada.</Alert>;
  }

  if (
    persona.kind === 'gestor' &&
    persona.companyId &&
    persona.companyId !== company.id
  ) {
    return (
      <Alert variant="warning">
        Esta empresa está fora do escopo da persona selecionada. O gestor vê
        apenas a própria empresa.{' '}
        <Link
          className="underline"
          href={iel.companies.byId(persona.companyId)}
        >
          Abrir minha empresa
        </Link>
        .
      </Alert>
    );
  }

  const jobs = getJobsByCompany(company.id);
  const teams = getTeamsByCompany(state, company.id);
  const clarificationTargetJob = clarificationTarget
    ? jobs.find((job) => job.id === clarificationTarget.jobId)
    : null;

  const ehAnalista = persona.kind === 'analista';

  return (
    <div className="space-y-6">
      {ehAnalista ? (
        <Link
          href={iel.companies.index}
          className="inline-flex text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Voltar para empresas
        </Link>
      ) : null}

      {/*
        O herói da tela é a leitura da empresa: a pergunta ("como se trabalha
        nesta empresa?"), o número ("responderam X de N") e o verbo ("cobrar
        quem falta"). Contato, descrição institucional e data de atualização
        não ajudam a responder isso e desceram para a seção recolhida.
      */}
      <CultureProfile
        companyId={company.id}
        onInvite={
          ehAnalista
            ? () => {
                setInviteFormOpen(true);
                document
                  .getElementById('convidar-colaboradores')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            : null
        }
      />

      {ehAnalista ? (
        <div
          id="convidar-colaboradores"
          className="scroll-mt-6"
        >
          <CultureSampleSection
            companyId={company.id}
            formOpen={inviteFormOpen}
            onFormOpenChange={setInviteFormOpen}
          />
        </div>
      ) : null}

      <CollapsibleSection
        title="Contato"
        meta={`${company.sector} · ${company.location} · atualizado em ${formatDate(company.updatedAt)}`}
      >
        <div className="space-y-2">
          <p className="iel-prose text-sm leading-relaxed text-muted-foreground">
            {company.institutionalDescription}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Chip>{`Contato: ${company.contactName}`}</Chip>
            <Chip>{company.contactEmail}</Chip>
          </div>
          <p className="text-xs text-muted-foreground">
            Origem: Contexto da empresa — demonstração.
          </p>
        </div>
      </CollapsibleSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            eyebrow="Condições de trabalho"
            title="Equipes e condições"
            hint="Cada condição indica a origem e se foi confirmada pelo gestor."
          />
          <div className="mt-4 space-y-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="space-y-3 rounded-[var(--control-radius)] border border-border p-3"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {team.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {team.routine}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Responsável: {team.managerName} · {team.managerEmail}
                  </p>
                </div>
                <ul className="space-y-2">
                  {team.conditions.map((condition) => {
                    const relatedJob = jobs.find(
                      (job) => job.teamId === team.id
                    );
                    const relatedCriterion = relatedJob?.criteria.find(
                      (criterion) =>
                        criterion.dimension === 'organizacional' &&
                        condition.label
                          .toLowerCase()
                          .includes(
                            criterion.label.split(' ')[0]?.toLowerCase() ?? ''
                          )
                    );
                    return (
                      <li
                        key={condition.id}
                        className="space-y-1 border-t border-border pt-2 first:border-0 first:pt-0"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {condition.label}
                          </p>
                          <Chip
                            tone={
                              condition.status === 'confirmado'
                                ? 'positivo'
                                : condition.status === 'da-descricao'
                                  ? 'info'
                                  : 'atencao'
                            }
                          >
                            {condition.status === 'confirmado'
                              ? 'Confirmado pelo gestor'
                              : condition.status === 'da-descricao'
                                ? 'Origem: descrição da vaga'
                                : 'A confirmar'}
                          </Chip>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {condition.value}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {condition.origin} · {formatDate(condition.updatedAt)}
                        </p>
                        {persona.kind === 'analista' &&
                        condition.status !== 'confirmado' &&
                        relatedJob &&
                        relatedCriterion ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setClarificationTarget({
                                jobId: relatedJob.id,
                                criterion: relatedCriterion
                              })
                            }
                          >
                            Solicitar confirmação ao gestor
                          </Button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            eyebrow="Processos abertos"
            title="Vagas associadas"
          />
          <div className="mt-4 space-y-3">
            {jobs.map((job) => {
              const applications = getApplicationsByJob(state, job.id);
              const clarifications = getClarificationsByJob(
                state,
                job.id
              ).filter(
                (clarification) =>
                  clarification.state === 'solicitada' ||
                  clarification.state === 'respondida'
              );
              return (
                <div
                  key={job.id}
                  className="flex flex-col gap-2 rounded-[var(--control-radius)] border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {job.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {job.workShift} · {JOB_STAGE_LABEL[job.stage]}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Chip>{applications.length} candidaturas</Chip>
                      {clarifications.length > 0 ? (
                        <Chip tone="atencao">
                          {plural(
                            clarifications.length,
                            'pendência',
                            'pendências'
                          )}
                        </Chip>
                      ) : null}
                    </div>
                  </div>
                  <Link href={iel.jobs.byId(job.id).index}>
                    <Button size="sm">
                      {persona.kind === 'gestor' ? 'Ver vaga' : 'Abrir seleção'}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {clarificationTarget && clarificationTargetJob ? (
        <CreateClarificationDialog
          job={clarificationTargetJob}
          criterion={clarificationTarget.criterion}
          application={null}
          visible
          onHide={() => setClarificationTarget(null)}
        />
      ) : null}
    </div>
  );
}
