'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { DEMO_COMPANIES } from '@/features/iel-demo/fixtures';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getJobSummary,
  getVisibleJobs,
  JOB_STAGE_LABEL,
  type JobSummary
} from '@/features/iel-demo/state/selectors';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState
} from '@tanstack/react-table';

import { routes } from '@workspace/routes';
import {
  Button,
  Card,
  FilterNativeSelect,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@workspace/ui';

import { Chip, formatDate, IelPageHeader } from '../shared/ui';

const columnHelper = createColumnHelper<JobSummary>();

export function JobsScreen() {
  const { state, dispatch, persona } = useIelDemo();
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'applications', desc: true }
  ]);
  const iel = routes.dashboard.iel;
  const { jobsSearch, jobsCompanyId, jobsStage } = state.ui;

  const rows = useMemo(() => {
    const term = jobsSearch.trim().toLowerCase();
    return getVisibleJobs(state)
      .map((job) => getJobSummary(state, job))
      .filter((summary) => {
        if (
          jobsCompanyId !== 'todas' &&
          summary.job.companyId !== jobsCompanyId
        ) {
          return false;
        }
        if (jobsStage !== 'todas' && summary.job.stage !== jobsStage)
          return false;
        if (!term) return true;
        return (
          summary.job.title.toLowerCase().includes(term) ||
          (summary.company?.name.toLowerCase().includes(term) ?? false)
        );
      });
  }, [state, jobsSearch, jobsCompanyId, jobsStage]);

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.job.title, {
        id: 'title',
        header: 'Vaga',
        cell: (info) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {info.getValue()}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {info.row.original.job.externalRef.system} ·{' '}
              {info.row.original.job.externalRef.id}
            </p>
          </div>
        )
      }),
      columnHelper.accessor((row) => row.company?.name ?? '', {
        id: 'company',
        header: 'Empresa',
        cell: (info) => (
          <span className="text-sm text-foreground">{info.getValue()}</span>
        )
      }),
      columnHelper.accessor((row) => row.job.location, {
        id: 'location',
        header: 'Localidade',
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {info.getValue()}
          </span>
        )
      }),
      columnHelper.accessor((row) => row.applicationsCount, {
        id: 'applications',
        header: 'Candidaturas',
        cell: (info) => (
          <span className="text-sm text-foreground">{info.getValue()}</span>
        )
      }),
      columnHelper.accessor((row) => row.job.stage, {
        id: 'stage',
        header: 'Etapa operacional',
        cell: (info) => <Chip>{JOB_STAGE_LABEL[info.getValue()]}</Chip>
      }),
      columnHelper.accessor(
        (row) => row.openClarificationsCount + row.answeredClarificationsCount,
        {
          id: 'pending',
          header: 'Pendências',
          cell: (info) => {
            const summary = info.row.original;
            if (info.getValue() === 0) {
              return (
                <span className="text-xs text-muted-foreground">
                  Nenhuma em aberto
                </span>
              );
            }
            return (
              <div className="flex flex-wrap gap-1">
                {summary.openClarificationsCount > 0 ? (
                  <Chip tone="atencao">
                    {summary.openClarificationsCount} sem resposta
                  </Chip>
                ) : null}
                {summary.answeredClarificationsCount > 0 ? (
                  <Chip tone="info">
                    {plural(
                      summary.answeredClarificationsCount,
                      'respondida',
                      'respondidas'
                    )}
                  </Chip>
                ) : null}
              </div>
            );
          }
        }
      ),
      columnHelper.accessor((row) => row.job.updatedAt, {
        id: 'updatedAt',
        header: 'Atualização da origem',
        cell: (info) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(info.getValue())}
          </span>
        )
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (info) => (
          <Link href={iel.jobs.byId(info.row.original.job.id).index}>
            <Button size="sm">Abrir seleção</Button>
          </Link>
        )
      })
    ],
    [iel]
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  const totalVisible = getVisibleJobs(state).length;

  return (
    <div className="space-y-6">
      <IelPageHeader
        eyebrow={
          persona.kind === 'gestor'
            ? `${persona.label} · apenas as vagas da própria empresa`
            : 'Processos das empresas atendidas'
        }
        title="Vagas"
      />

      <Card
        padding="sm"
        className="gap-3"
      >
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem_12rem]">
          <Input
            label="Buscar por vaga ou empresa"
            placeholder="Ex.: logística, Cerrado"
            value={jobsSearch}
            leftIcon={
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
              />
            }
            onChange={(event) =>
              dispatch({
                type: 'set-ui',
                ui: { jobsSearch: event.target.value }
              })
            }
          />
          <div className="space-y-2">
            <label
              htmlFor="jobs-company"
              className="block text-sm font-medium leading-none text-foreground"
            >
              Empresa
            </label>
            <FilterNativeSelect
              id="jobs-company"
              value={jobsCompanyId}
              onValueChange={(value) =>
                dispatch({ type: 'set-ui', ui: { jobsCompanyId: value } })
              }
            >
              <option value="todas">Todas</option>
              {DEMO_COMPANIES.map((company) => (
                <option
                  key={company.id}
                  value={company.id}
                >
                  {company.name}
                </option>
              ))}
            </FilterNativeSelect>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="jobs-stage"
              className="block text-sm font-medium leading-none text-foreground"
            >
              Status da vaga
            </label>
            <FilterNativeSelect
              id="jobs-stage"
              value={jobsStage}
              onValueChange={(value) =>
                dispatch({
                  type: 'set-ui',
                  ui: { jobsStage: value as typeof jobsStage }
                })
              }
            >
              <option value="todas">Todos</option>
              <option value="aberta">Aberta</option>
              <option value="em-selecao">Em seleção</option>
              <option value="encerrada">Encerrada</option>
            </FilterNativeSelect>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Mostrando {rows.length} de {totalVisible} vagas visíveis para esta
          persona.
        </p>
      </Card>

      <Card padding="none">
        {rows.length === 0 ? (
          <div className="space-y-3 px-6 py-12 text-center">
            <h3 className="text-base font-semibold text-foreground">
              Nenhuma vaga encontrada com esses filtros
            </h3>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              A busca e os filtros afetam as linhas e os contadores. Limpe os
              filtros para ver as vagas da base demo.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                dispatch({
                  type: 'set-ui',
                  ui: {
                    jobsSearch: '',
                    jobsCompanyId: 'todas',
                    jobsStage: 'todas'
                  }
                })
              }
            >
              Limpar filtros
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        scope="col"
                      >
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="inline-flex items-center gap-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            <span aria-hidden="true">
                              {header.column.getIsSorted() === 'asc'
                                ? '↑'
                                : header.column.getIsSorted() === 'desc'
                                  ? '↓'
                                  : '↕'}
                            </span>
                          </button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="py-3"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
