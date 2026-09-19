'use client';

import Link from 'next/link';
import {
  CRITERION_STATE_META,
  getCriterionAnalysis
} from '@/features/iel-demo/analysis/criterion-states';
import { FIT_AXES } from '@/features/iel-demo/analysis/fit-axes';
import { COPY } from '@/features/iel-demo/copy';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getComparisonSelection,
  getFitReading,
  getJob,
  getJobRanking,
  getReferralListSelection,
  REFERRAL_LIMIT
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';

import { routes } from '@workspace/routes';
import { Alert, toast } from '@workspace/ui';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@workspace/ui/shadcn/table';

import { usePageHeader } from '../layout/page-header-context';
import { CandidateStateBadge } from './candidate-state-badge';

/**
 * Duas a quatro pessoas, lado a lado, na mesma vaga.
 *
 * A comparação é por coluna porque a pergunta é por linha: em que ponto elas
 * diferem? Uma lista por pessoa obrigaria a guardar o valor de uma para
 * comparar com o da outra; a tabela põe as duas no mesmo olhar.
 */
export function ComparisonScreen({ jobId }: { jobId: string }) {
  const { state, dispatch } = useIelDemo();
  const iel = routes.dashboard.iel;
  const job = getJob(jobId);

  usePageHeader({
    breadcrumb: [
      { label: 'Vagas', href: iel.jobs.index },
      {
        label: job?.title ?? 'Vaga',
        href: job ? iel.jobs.byId(job.id).index : undefined
      },
      { label: 'Comparar' }
    ]
  });

  if (!job) {
    return <Alert variant="destructive">Vaga não encontrada.</Alert>;
  }

  const selecionadas = getComparisonSelection(state, job.id);
  const referralList = getReferralListSelection(state, job.id);
  const entradas = getJobRanking(state, job.id).filter((entry) =>
    selecionadas.includes(entry.application.id)
  );

  if (entradas.length < 2) {
    return (
      <Alert variant="default">
        Marque de duas a quatro pessoas na lista da vaga para compará-las.{' '}
        <Link
          className="underline"
          href={iel.jobs.byId(job.id).index}
        >
          Voltar para a vaga
        </Link>
        .
      </Alert>
    );
  }

  const marcar = (applicationId: string, nome: string) => {
    if (referralList.includes(applicationId)) {
      dispatch({
        type: 'remove-from-referral-list',
        jobId: job.id,
        applicationId,
        at: nowIso()
      });
      return;
    }
    if (referralList.length >= REFERRAL_LIMIT) {
      toast.error(COPY.referral.limit);
      return;
    }
    dispatch({
      type: 'add-to-referral-list',
      jobId: job.id,
      applicationId,
      at: nowIso()
    });
    toast.success(`${nome} entrou na lista desta vaga.`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">
          Comparar {entradas.length} pessoas
        </h1>
        <p className="text-sm text-muted-foreground">
          {job.title} · a mesma leitura, linha a linha
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="w-[240px]">Leitura</TableHead>
              {entradas.map((entry) => (
                <TableHead key={entry.application.id}>
                  {entry.talent?.name ?? 'Pessoa fora da base'}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">{COPY.fit.label}</TableCell>
              {entradas.map((entry) => (
                <TableCell
                  key={entry.application.id}
                  className="text-base font-semibold tabular-nums"
                >
                  {entry.adherence.total === null
                    ? '—'
                    : `${Math.round(entry.adherence.total)}%`}
                </TableCell>
              ))}
            </TableRow>

            <TableRow>
              <TableCell className="font-medium">
                {COPY.technical.label}
              </TableCell>
              {entradas.map((entry) => (
                <TableCell
                  key={entry.application.id}
                  className="tabular-nums"
                >
                  {entry.technicalMatch === null
                    ? '—'
                    : `${entry.technicalMatch}%`}
                </TableCell>
              ))}
            </TableRow>

            <TableRow>
              <TableCell className="font-medium">Estado</TableCell>
              {entradas.map((entry) => (
                <TableCell key={entry.application.id}>
                  <CandidateStateBadge entry={entry} />
                </TableCell>
              ))}
            </TableRow>

            {FIT_AXES.map((axis) => (
              <TableRow key={axis.id}>
                <TableCell className="whitespace-normal text-muted-foreground">
                  {axis.label}
                </TableCell>
                {entradas.map((entry) => {
                  const leitura = entry.talent
                    ? getFitReading(state, job, entry.talent.id).find(
                        (item) => item.axis.id === axis.id
                      )
                    : undefined;
                  return (
                    <TableCell
                      key={entry.application.id}
                      className="whitespace-normal"
                    >
                      <span className="text-sm">
                        {leitura?.preference?.value ?? '—'}
                      </span>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}

            {job.criteria.map((criterion) => (
              <TableRow key={criterion.id}>
                <TableCell className="whitespace-normal text-muted-foreground">
                  {criterion.label}
                  {criterion.required ? ' *' : ''}
                </TableCell>
                {entradas.map((entry) => {
                  const analise = getCriterionAnalysis(
                    state.analysis,
                    entry.application.id,
                    criterion.id
                  );
                  return (
                    <TableCell key={entry.application.id}>
                      <Badge
                        variant="outline"
                        className="px-1.5 text-muted-foreground"
                      >
                        {CRITERION_STATE_META[analise.state].label}
                      </Badge>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}

            <TableRow>
              <TableCell className="font-medium">Decisão</TableCell>
              {entradas.map((entry) => (
                <TableCell key={entry.application.id}>
                  <Button
                    size="sm"
                    variant={
                      referralList.includes(entry.application.id)
                        ? 'outline'
                        : 'default'
                    }
                    onClick={() =>
                      marcar(
                        entry.application.id,
                        entry.talent?.name ?? 'Candidatura'
                      )
                    }
                  >
                    {referralList.includes(entry.application.id)
                      ? 'Tirar da remessa'
                      : 'Marcar para envio'}
                  </Button>
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
