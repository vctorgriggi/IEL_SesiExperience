'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { DEMO_TALENTS } from '@/features/iel-demo/fixtures';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import { getApplicationsByTalent } from '@/features/iel-demo/state/selectors';
import { Search } from 'lucide-react';

import { routes } from '@workspace/routes';
import { Alert } from '@workspace/ui';
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
import { formatarData } from '../shared/datas';

/**
 * Uma linha por pessoa.
 *
 * A lista global não ranqueia ninguém: combinar é sempre com uma empresa, e
 * aqui não há empresa. O que ela oferece é o caminho — quem é, onde está, em
 * quantos processos entrou e quando foi a última leitura.
 */
export function TalentsScreen() {
  const { state, persona } = useIelDemo();
  const [busca, setBusca] = useState('');
  const iel = routes.dashboard.iel;

  usePageHeader({ breadcrumb: [{ label: 'Pessoas' }] });

  const linhas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return DEMO_TALENTS.filter(
      (talent) =>
        !termo ||
        talent.name.toLowerCase().includes(termo) ||
        talent.headline.toLowerCase().includes(termo) ||
        talent.city.toLowerCase().includes(termo)
    ).map((talent) => {
      const candidaturas = getApplicationsByTalent(state, talent.id);
      const ultima = candidaturas
        .map((application) => application.appliedAt)
        .sort()
        .at(-1);
      return { talent, candidaturas, ultima: ultima ?? null };
    });
  }, [state, busca]);

  if (persona.kind === 'gestor') {
    return (
      <Alert variant="warning">
        A base de pessoas do IEL não é visível para o perfil de gestor. A
        empresa acessa apenas os perfis de uma remessa recebida.{' '}
        <Link
          className="underline"
          href={iel.referrals.index}
        >
          Ver currículos enviados
        </Link>
        .
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">Pessoas</h1>
          <p className="text-sm text-muted-foreground">
            {linhas.length} de {DEMO_TALENTS.length} perfis ·{' '}
            {state.applications.length} candidaturas na base
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Label
            htmlFor="buscar-pessoa"
            className="sr-only"
          >
            Buscar pessoa
          </Label>
          <Input
            id="buscar-pessoa"
            type="search"
            placeholder="Nome, cidade ou cargo…"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            className="h-8 w-[240px] pl-8 text-[13px]"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Pessoa</TableHead>
              <TableHead className="w-[160px]">Cidade</TableHead>
              <TableHead className="w-[140px] text-right">
                Candidaturas
              </TableHead>
              <TableHead className="w-[160px]">Última leitura</TableHead>
              <TableHead className="w-[120px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  Ninguém com esse nome na base.
                </TableCell>
              </TableRow>
            ) : (
              linhas.map(({ talent, candidaturas, ultima }) => (
                <TableRow key={talent.id}>
                  <TableCell className="whitespace-normal">
                    <Link
                      href={iel.talents.byId(talent.id).index}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {talent.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {talent.headline}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {talent.city}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {candidaturas.length}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {ultima ? formatarData(ultima) : '—'}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <Link href={iel.talents.byId(talent.id).index}>
                        Abrir perfil
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
