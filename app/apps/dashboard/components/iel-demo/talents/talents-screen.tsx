'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { DEMO_TALENTS } from '@/features/iel-demo/fixtures';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplicationsByTalent,
  getAssessments,
  getCompany,
  getJob
} from '@/features/iel-demo/state/selectors';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { routes } from '@workspace/routes';
import {
  Alert,
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@workspace/ui';

import { Chip, IelPageHeader, Panel } from '../shared/ui';

export function TalentsScreen() {
  const { state, persona } = useIelDemo();
  const [search, setSearch] = useState('');
  const iel = routes.dashboard.iel;

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return DEMO_TALENTS.filter(
      (talent) =>
        !term ||
        talent.name.toLowerCase().includes(term) ||
        talent.headline.toLowerCase().includes(term)
    ).map((talent) => ({
      talent,
      applications: getApplicationsByTalent(state, talent.id),
      assessments: getAssessments(talent.id)
    }));
  }, [state, search]);

  if (persona.kind === 'gestor') {
    return (
      <Alert variant="warning">
        A base de talentos do IEL não é visível para o perfil de gestor. A
        empresa acessa apenas os perfis compartilhados em um encaminhamento.{' '}
        <Link
          className="underline"
          href={iel.referrals.index}
        >
          Ver perfis encaminhados
        </Link>
        .
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <IelPageHeader
        eyebrow="Perfis autorizados na base demo"
        title="Talentos"
        description="Uma linha por pessoa. As candidaturas são vínculos desse perfil com vagas."
      />

      <Panel padding="sm">
        <Input
          label="Buscar talento"
          placeholder="Ex.: Ana, estoque, documentos"
          value={search}
          leftIcon={
            <HugeiconsIcon
              icon={Search01Icon}
              size={16}
            />
          }
          onChange={(event) => setSearch(event.target.value)}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          {rows.length} de {DEMO_TALENTS.length} talentos ·{' '}
          {state.applications.length} candidaturas na base.
        </p>
      </Panel>

      <Panel padding="none">
        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <h3 className="iel-display text-base text-foreground">
              Nenhum talento encontrado
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Ajuste a busca para ver os perfis da base de demonstração.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Pessoa</TableHead>
                  <TableHead scope="col">Resumo profissional</TableHead>
                  <TableHead scope="col">Candidaturas</TableHead>
                  <TableHead scope="col">Avaliação externa</TableHead>
                  <TableHead scope="col" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ talent, applications, assessments }) => (
                  <TableRow key={talent.id}>
                    <TableCell className="align-top">
                      <p className="text-sm font-medium text-foreground">
                        {talent.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {talent.city}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-96 align-top">
                      <p className="text-sm text-foreground">
                        {talent.headline}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {talent.summary}
                      </p>
                    </TableCell>
                    <TableCell className="align-top">
                      <ul className="space-y-1">
                        {applications.map((application) => {
                          const job = getJob(application.jobId);
                          const company = job
                            ? getCompany(job.companyId)
                            : null;
                          return (
                            <li key={application.id}>
                              <Link
                                className="text-xs underline decoration-dotted"
                                href={iel.talents
                                  .byId(talent.id)
                                  .inJob(application.jobId)}
                              >
                                {job?.title} — {company?.name}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </TableCell>
                    <TableCell className="align-top">
                      {assessments.length === 0 ? (
                        <span className="text-xs text-muted-foreground">
                          Avaliação não disponível
                        </span>
                      ) : (
                        <Chip tone="info">
                          {plural(
                            assessments.length,
                            'resultado',
                            'resultados'
                          )}{' '}
                          de origem
                        </Chip>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <Link href={iel.talents.byId(talent.id).index}>
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          Abrir perfil
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>
    </div>
  );
}
