'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getJobSummary,
  getReferralListSelection,
  getVisibleJobs,
  JOB_STAGE_LABEL,
  REFERRAL_LIMIT
} from '@/features/iel-demo/state/selectors';
import { Search } from 'lucide-react';

import { routes } from '@workspace/routes';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import { Input } from '@workspace/ui/shadcn/input';
import { Label } from '@workspace/ui/shadcn/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@workspace/ui/shadcn/table';

import { usePageHeader } from '../layout/page-header-context';

/**
 * Uma linha por vaga.
 *
 * A lista não classifica nem pontua vaga nenhuma: ela responde onde o
 * trabalho está parado. Candidaturas diz o tamanho da fila, Marcados diz o
 * quanto da remessa já foi escolhido e Etapa diz se a vaga ainda aceita
 * gente. O resto — ranking, corte, esclarecimentos — mora dentro da vaga.
 */
export function JobsScreen() {
  const { state, persona } = useIelDemo();
  const [busca, setBusca] = useState('');
  const iel = routes.dashboard.iel;

  usePageHeader({ breadcrumb: [{ label: 'Vagas' }] });

  const visiveis = getVisibleJobs(state);

  const linhas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return getVisibleJobs(state)
      .map((job) => ({
        ...getJobSummary(state, job),
        marcados: getReferralListSelection(state, job.id).length
      }))
      .filter((linha) => {
        if (!termo) return true;
        return (
          linha.job.title.toLowerCase().includes(termo) ||
          (linha.company?.name.toLowerCase().includes(termo) ?? false)
        );
      });
  }, [state, busca]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">Vagas</h1>
          <p className="text-sm text-muted-foreground">
            {linhas.length} de {visiveis.length}{' '}
            {visiveis.length === 1 ? 'vaga' : 'vagas'}
            {persona.kind === 'gestor'
              ? ' · apenas as vagas da própria empresa'
              : ' · processos das empresas atendidas'}
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Label
            htmlFor="buscar-vaga"
            className="sr-only"
          >
            Buscar vaga
          </Label>
          <Input
            id="buscar-vaga"
            type="search"
            placeholder="Vaga ou empresa…"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            className="h-8 w-[240px] pl-8 text-[13px]"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Vaga</TableHead>
              <TableHead className="w-[200px]">Empresa</TableHead>
              <TableHead className="w-[140px] text-right">
                Candidaturas
              </TableHead>
              <TableHead className="w-[120px] text-right">Marcados</TableHead>
              <TableHead className="w-[140px]">Etapa</TableHead>
              <TableHead className="w-[140px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhuma vaga com esse nome.
                </TableCell>
              </TableRow>
            ) : (
              linhas.map((linha) => (
                <TableRow key={linha.job.id}>
                  <TableCell className="whitespace-normal">
                    <Link
                      href={iel.jobs.byId(linha.job.id).index}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {linha.job.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {linha.job.location} · {linha.job.externalRef.system}{' '}
                      {linha.job.externalRef.id}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {linha.company?.name ?? '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {linha.applicationsCount}
                  </TableCell>
                  {/*
                    Marcados é sempre sobre o limite da remessa: "2" sozinho
                    não diz se falta alguém, "2/5" diz.
                  */}
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {linha.marcados}/{REFERRAL_LIMIT}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-muted-foreground"
                    >
                      {JOB_STAGE_LABEL[linha.job.stage]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <Link href={iel.jobs.byId(linha.job.id).index}>
                        Abrir vaga
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
