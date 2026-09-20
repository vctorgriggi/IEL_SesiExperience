'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ALL_TALENTS } from '@/features/iel-demo/fixtures';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import { IconSearch } from '@tabler/icons-react';

import { routes } from '@workspace/routes';
import { Alert } from '@workspace/ui';
import { Input } from '@workspace/ui/shadcn/input';
import { Label } from '@workspace/ui/shadcn/label';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@workspace/ui/shadcn/table';

import { normalizarBusca } from '../jobs/busca';
import { RodapeDaTabela, usePaginacao } from '../jobs/table-pagination';
import { usePageHeader } from '../layout/page-header-context';
import { formatarData } from '../shared/datas';

/**
 * Uma linha por pessoa.
 *
 * A lista global não ranqueia ninguém: combinar é sempre com uma empresa, e
 * aqui não há empresa. O que ela oferece é o caminho — quem é, onde está, em
 * quantos processos entrou e quando foi a última candidatura.
 *
 * Antes a lista mostrava só as 8 pessoas do roteiro e ignorava o resto da
 * base e quem chegou pela planilha. Agora é a base inteira, paginada: com
 * milhares de perfis, uma tabela sem página travaria a tela.
 */
export function TalentsScreen() {
  const { state, persona } = useIelDemo();
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const iel = routes.dashboard.iel;

  usePageHeader({ breadcrumb: [{ label: 'Banco de talentos' }] });

  // Uma passada pelas candidaturas para todas as pessoas, em vez de um filtro
  // por linha.
  const todas = useMemo(() => {
    const porPessoa = new Map<string, { total: number; ultima: string }>();
    for (const application of state.applications) {
      const atual = porPessoa.get(application.talentId);
      porPessoa.set(application.talentId, {
        total: (atual?.total ?? 0) + 1,
        ultima:
          atual && atual.ultima > application.appliedAt
            ? atual.ultima
            : application.appliedAt
      });
    }

    return [...ALL_TALENTS, ...(state.importedTalents ?? [])].map((talent) => ({
      talent,
      candidaturas: porPessoa.get(talent.id)?.total ?? 0,
      ultima: porPessoa.get(talent.id)?.ultima ?? null,
      busca: normalizarBusca(`${talent.name} ${talent.headline} ${talent.city}`)
    }));
  }, [state.applications, state.importedTalents]);

  const filtradas = useMemo(() => {
    const termo = normalizarBusca(busca);
    return termo ? todas.filter((linha) => linha.busca.includes(termo)) : todas;
  }, [todas, busca]);

  const paginacao = usePaginacao(filtradas);

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
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">
          Banco de talentos
        </h1>
        <p className="text-sm text-muted-foreground">
          Quem se candidatou pelo IEL. Clique para abrir o perfil.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative">
          <IconSearch
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
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
            onChange={(event) => {
              setBusca(event.target.value);
              paginacao.irPara(0);
            }}
            className="h-8 w-[240px] pl-8 text-[13px]"
          />
        </div>
      </div>

      <div
        data-tour="talentos-lista"
        className="overflow-x-auto rounded-lg border"
      >
        <Table>
          <TableCaption className="sr-only">
            Pessoas da base:{' '}
            {filtradas.length === 1
              ? '1 pessoa'
              : `${filtradas.length} pessoas`}
            , página {paginacao.pagina + 1} de {paginacao.totalPaginas}. Abra o
            perfil pelo nome.
          </TableCaption>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead scope="col">Pessoa</TableHead>
              <TableHead
                scope="col"
                className="w-[200px]"
              >
                Cidade
              </TableHead>
              <TableHead
                scope="col"
                className="w-[120px] text-right"
              >
                Candidaturas
              </TableHead>
              <TableHead
                scope="col"
                className="w-[160px] text-right"
              >
                Última candidatura
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginacao.linhas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  Ninguém com esse nome na base.
                </TableCell>
              </TableRow>
            ) : (
              paginacao.linhas.map(({ talent, candidaturas, ultima }) => {
                const href = iel.talents.byId(talent.id).index;
                return (
                  <TableRow
                    key={talent.id}
                    className="cursor-pointer"
                    onClick={() => router.push(href)}
                  >
                    <TableCell className="max-w-0 whitespace-normal">
                      <Link
                        href={href}
                        onClick={(evento) => evento.stopPropagation()}
                        className="block truncate font-medium underline-offset-4 hover:underline"
                      >
                        {talent.name}
                      </Link>
                      <span className="block truncate text-xs text-muted-foreground">
                        {talent.headline}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {talent.city}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {candidaturas}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {ultima ? (
                        formatarData(ultima)
                      ) : (
                        <>
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">Nenhuma</span>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <RodapeDaTabela
        paginacao={paginacao}
        resumo={`${filtradas.length} de ${todas.length} pessoas · ${state.applications.length} candidaturas`}
      />
    </div>
  );
}
