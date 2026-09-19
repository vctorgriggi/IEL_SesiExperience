'use client';

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';

import { Button } from '@workspace/ui/shadcn/button';
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@workspace/ui/shadcn/table';

import { RodapeDaTabela, usePaginacao } from '../jobs/table-pagination';
import { ManagerOverview } from '../manager/manager-overview';
import {
  montarPendencias,
  PENDENCIAS_VISIVEIS,
  TIPO_DE_PENDENCIA_LABEL,
  type Pendencia,
  type TipoDePendencia
} from './pendencias';

/** Pendências em grupos, na ordem em que chegam (já ordenadas por urgência). */
function agrupar(
  pendencias: Pendencia[]
): { tipo: TipoDePendencia; itens: Pendencia[] }[] {
  const grupos: { tipo: TipoDePendencia; itens: Pendencia[] }[] = [];
  for (const pendencia of pendencias) {
    const ultimo = grupos.at(-1);
    if (ultimo && ultimo.tipo === pendencia.tipo) ultimo.itens.push(pendencia);
    else grupos.push({ tipo: pendencia.tipo, itens: [pendencia] });
  }
  return grupos;
}

/**
 * A tela de abertura responde uma pergunta: o que precisa de mim hoje?
 *
 * Ela já foi um painel administrativo — cinco números no herói, distribuição
 * por etapa, cobertura por dimensão, atividade recente e a procedência dos
 * registros. Nada daquilo dizia por onde começar. Ficou a fila, agrupada pelo
 * tipo de trabalho, com os cinco itens mais urgentes na frente.
 *
 * Com a carteira inteira do IEL a fila pode ter centenas de linhas. Até cinco,
 * cada uma é um cartão; passou disso, vira tabela — cartão por item empurraria
 * a lista para fora da tela — e "Ver todos" abre o resto em páginas.
 */
export function OverviewScreen() {
  const { state, persona } = useIelDemo();
  const [todas, setTodas] = useState(false);

  const pendencias = useMemo(() => montarPendencias(state), [state]);
  const lista = todas ? pendencias : pendencias.slice(0, PENDENCIAS_VISIVEIS);
  const paginacao = usePaginacao(lista);

  if (persona.kind === 'gestor') {
    return <ManagerOverview />;
  }

  const cabe = pendencias.length <= PENDENCIAS_VISIVEIS;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">
            O que precisa de mim hoje?
          </h1>
          <p className="text-sm text-muted-foreground">
            A fila do dia, na ordem em que compensa resolver.
          </p>
        </div>
        {cabe ? null : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTodas((atual) => !atual);
              paginacao.irPara(0);
            }}
          >
            {todas
              ? `Só os ${PENDENCIAS_VISIVEIS} mais urgentes`
              : `Ver todos (${pendencias.length})`}
          </Button>
        )}
      </div>

      {pendencias.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Para resolver agora</CardTitle>
            <CardDescription>
              Nada em aberto. Quando chegar uma resposta ou uma vaga ficar
              parada, a linha aparece aqui.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : cabe ? (
        <div className="flex flex-col gap-4">
          {agrupar(pendencias).map((grupo) => (
            <section
              key={grupo.tipo}
              className="flex flex-col gap-2"
            >
              <h2 className="text-xs font-medium text-muted-foreground">
                {TIPO_DE_PENDENCIA_LABEL[grupo.tipo]}
              </h2>
              {grupo.itens.map((pendencia) => (
                <Card key={pendencia.id}>
                  <CardHeader>
                    <CardTitle>{pendencia.titulo}</CardTitle>
                    <CardDescription>{pendencia.resumo}</CardDescription>
                    <CardAction>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link href={pendencia.href}>{pendencia.verbo}</Link>
                      </Button>
                    </CardAction>
                  </CardHeader>
                </Card>
              ))}
            </section>
          ))}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>O que fazer</TableHead>
                  <TableHead className="w-[200px] text-right">
                    <span className="sr-only">Ação</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agrupar(paginacao.linhas).map((grupo, indice) => (
                  <Fragment key={`${grupo.tipo}-${indice}`}>
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={2}
                        className="pt-4 text-xs font-medium text-muted-foreground"
                      >
                        {TIPO_DE_PENDENCIA_LABEL[grupo.tipo]}
                      </TableCell>
                    </TableRow>
                    {grupo.itens.map((pendencia) => (
                      <TableRow key={pendencia.id}>
                        <TableCell className="max-w-0 whitespace-normal">
                          <span className="block truncate font-medium">
                            {pendencia.titulo}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {pendencia.resumo}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={pendencia.href}>{pendencia.verbo}</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
          {todas ? (
            <RodapeDaTabela
              paginacao={paginacao}
              resumo={`${pendencias.length} pendências`}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
