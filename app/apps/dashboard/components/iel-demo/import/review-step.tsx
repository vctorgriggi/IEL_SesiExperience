'use client';

import type { ReactNode } from 'react';
import type {
  ImportPlan,
  ImportPlanEntry
} from '@/features/iel-demo/analysis/spreadsheet-import';
import { plural } from '@/features/iel-demo/format';
import { getTalent } from '@/features/iel-demo/state/selectors';
import type { DemoState } from '@/features/iel-demo/types';
import { IconAlertCircle } from '@tabler/icons-react';

import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
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

import { BADGE_DE_ESTADO } from '../metricas/cores';
import { GrupoDeDecisao, type EstadoDaImportacao } from './decision-group';

const DESCARTADA = 'descartado pelo filtro — entra no resgate';

type Linha = {
  id: string;
  pessoa: string;
  detalhe: string;
  descartada: boolean;
};

type Grupo = {
  id: string;
  titulo: string;
  estado: EstadoDaImportacao;
  resumo?: string;
  /** Cabeçalho da primeira coluna: "Pessoa" ou "Linha", conforme o grupo. */
  colunaPessoa: string;
  colunaDetalhe: string;
  linhas: Linha[];
};

function nomeDaPessoa(entrada: ImportPlanEntry, state: DemoState): string {
  return (
    entrada.talent?.name ??
    getTalent(entrada.talentId, state)?.name ??
    `Linha ${entrada.line}`
  );
}

function percentual(valor: number | null): string {
  return valor === null ? 'sem percentual' : `${valor}%`;
}

function montarLinhas(
  entradas: ImportPlanEntry[],
  state: DemoState,
  detalhe: (entrada: ImportPlanEntry) => string
): Linha[] {
  return entradas.map((entrada) => ({
    id: `${entrada.line}`,
    pessoa: nomeDaPessoa(entrada, state),
    detalhe: detalhe(entrada),
    descartada: entrada.discarded
  }));
}

function montarGrupos(plano: ImportPlan, state: DemoState): Grupo[] {
  const por = (decisao: ImportPlanEntry['decision']): ImportPlanEntry[] =>
    plano.entries.filter((entrada) => entrada.decision === decisao);

  const novosTalentos = por('novo-talento');
  const novasCandidaturas = por('nova-candidatura');
  const atualizadas = por('match-atualizado');
  const ignoradas = por('ignorada');

  const grupos: Grupo[] = [];

  if (novosTalentos.length > 0) {
    grupos.push({
      id: 'novos',
      titulo: plural(novosTalentos.length, 'pessoa nova', 'pessoas novas'),
      estado: 'entram',
      resumo: 'Ninguém com esse e-mail estava na base.',
      colunaPessoa: 'Pessoa',
      colunaDetalhe: 'Requisitos da vaga',
      linhas: montarLinhas(novosTalentos, state, (entrada) =>
        percentual(entrada.technicalMatch)
      )
    });
  }

  if (novasCandidaturas.length > 0) {
    grupos.push({
      id: 'ja-na-base',
      titulo: plural(
        novasCandidaturas.length,
        'pessoa já estava na base',
        'pessoas já estavam na base'
      ),
      estado: 'entram',
      resumo: 'Entram nesta vaga sem virar cadastro novo.',
      colunaPessoa: 'Pessoa',
      colunaDetalhe: 'Requisitos da vaga',
      linhas: montarLinhas(novasCandidaturas, state, (entrada) =>
        percentual(entrada.technicalMatch)
      )
    });
  }

  if (atualizadas.length > 0) {
    const primeira = atualizadas[0];
    grupos.push({
      id: 'atualizadas',
      titulo: plural(
        atualizadas.length,
        'requisito da vaga atualizado',
        'requisitos da vaga atualizados'
      ),
      estado: 'atualizam',
      resumo: primeira
        ? `${nomeDaPessoa(primeira, state)}: ${percentual(primeira.previousTechnicalMatch)} → ${percentual(primeira.technicalMatch)}.`
        : undefined,
      colunaPessoa: 'Pessoa',
      colunaDetalhe: 'Antes → depois',
      linhas: montarLinhas(
        atualizadas,
        state,
        (entrada) =>
          `${percentual(entrada.previousTechnicalMatch)} → ${percentual(entrada.technicalMatch)}`
      )
    });
  }

  if (ignoradas.length > 0) {
    grupos.push({
      id: 'ignoradas',
      titulo: plural(
        ignoradas.length,
        'pessoa já estava nesta vaga',
        'pessoas já estavam nesta vaga'
      ),
      estado: 'sem-mudanca',
      resumo: 'Mesmo percentual de antes: nada muda.',
      colunaPessoa: 'Pessoa',
      colunaDetalhe: 'Requisitos da vaga',
      linhas: montarLinhas(ignoradas, state, (entrada) =>
        percentual(entrada.technicalMatch)
      )
    });
  }

  if (plano.errors.length > 0) {
    grupos.push({
      id: 'erros',
      titulo: plural(plano.errors.length, 'linha com erro', 'linhas com erro'),
      estado: 'com-erro',
      resumo: 'Ficam de fora. O resto da planilha entra normalmente.',
      colunaPessoa: 'Onde',
      colunaDetalhe: 'Motivo',
      linhas: plano.errors.map((erro, indice) => ({
        id: `${erro.line}-${erro.column}-${indice}`,
        pessoa: `Linha ${erro.line}, coluna ${erro.column}`,
        detalhe: erro.reason,
        descartada: false
      }))
    });
  }

  return grupos;
}

function TabelaDoGrupo({ grupo }: { grupo: Grupo }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead scope="col">{grupo.colunaPessoa}</TableHead>
            <TableHead scope="col">{grupo.colunaDetalhe}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grupo.linhas.map((linha) => (
            <TableRow key={linha.id}>
              <TableCell className="whitespace-normal font-medium text-foreground">
                {linha.pessoa}
                {linha.descartada ? (
                  <Badge
                    variant="outline"
                    className={cn('ml-2 gap-1', BADGE_DE_ESTADO.atencao)}
                  >
                    <IconAlertCircle
                      aria-hidden="true"
                      className="size-3"
                    />
                    {DESCARTADA}
                  </Badge>
                ) : null}
              </TableCell>
              <TableCell className="whitespace-normal tabular-nums text-muted-foreground">
                {linha.detalhe}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** Um dos três números do topo, no formato de section card do block. */
function CartaoDeNumero({
  rotulo,
  valor,
  etiqueta,
  destaque,
  apoio
}: {
  rotulo: string;
  valor: number;
  etiqueta: string;
  destaque: string;
  apoio: ReactNode;
}) {
  return (
    <Card className="@container/card shadow-xs">
      <CardHeader>
        <CardDescription>{rotulo}</CardDescription>
        <CardTitle className="t-num-card">{valor}</CardTitle>
        <CardAction>
          <Badge
            variant="outline"
            className="text-muted-foreground"
          >
            {etiqueta}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 font-medium">{destaque}</div>
        <div className="text-muted-foreground">{apoio}</div>
      </CardFooter>
    </Card>
  );
}

/**
 * Passo 2: o que vai acontecer, antes de acontecer.
 *
 * O plano já está decidido linha a linha; esta tela só o conta em voz alta e
 * espera a confirmação. Nada é gravado enquanto o analista não confirma — por
 * isso os três números no topo e a tabela por decisão logo abaixo: quem
 * confirma precisa poder abrir cada grupo e ver os nomes, não só o total.
 */
export function ReviewStep({
  plano,
  state,
  jaImportada,
  onConfirmar,
  onTrocarArquivo
}: {
  plano: ImportPlan;
  state: DemoState;
  /** A mesma planilha já foi importada nesta vaga: confirmar não muda nada. */
  jaImportada: boolean;
  onConfirmar: () => void;
  onTrocarArquivo: () => void;
}) {
  const grupos = montarGrupos(plano, state);
  const novos = plano.counts['novo-talento'] + plano.counts['nova-candidatura'];
  const foraDaConta = plano.counts.ignorada + plano.errors.length;
  const descartados = plano.entries.filter(
    (entrada) => entrada.discarded
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <CartaoDeNumero
          rotulo="Registros novos"
          valor={novos}
          etiqueta="entram"
          destaque="Pessoas e candidaturas que a planilha traz"
          apoio={
            descartados > 0
              ? `${plural(descartados, 'pessoa vem descartada', 'pessoas vêm descartadas')} pelo filtro da Empregare`
              : 'Nenhuma vem descartada pelo filtro'
          }
        />
        <CartaoDeNumero
          rotulo="Atualizados"
          valor={plano.counts['match-atualizado']}
          etiqueta="mudam"
          destaque="Já estavam aqui com outro percentual"
          apoio="O valor anterior fica no histórico da vaga"
        />
        <CartaoDeNumero
          rotulo="Ficam de fora"
          valor={foraDaConta}
          etiqueta={plano.errors.length > 0 ? 'com erro' : 'sem mudança'}
          destaque="Sem mudança ou com erro na linha"
          apoio={
            plano.errors.length > 0
              ? `${plural(plano.errors.length, 'linha não pôde ser lida', 'linhas não puderam ser lidas')}`
              : 'Nenhuma linha com erro'
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardDescription>Passo 2</CardDescription>
          <CardTitle>O que vai entrar</CardTitle>
          <CardDescription>
            {jaImportada
              ? 'Esta planilha já foi importada nesta vaga: confirmar não muda nada.'
              : 'Nada é gravado até você confirmar. Abra um grupo para ver os nomes.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {grupos.length === 0 ? (
            <p className="max-w-[80ch] text-sm text-muted-foreground">
              A planilha não trouxe nenhuma linha para esta vaga. Confira se o
              arquivo é o da vaga certa.
            </p>
          ) : (
            <div className="border-t">
              {grupos.map((grupo) => (
                <GrupoDeDecisao
                  key={grupo.id}
                  titulo={grupo.titulo}
                  estado={grupo.estado}
                  resumo={grupo.resumo}
                >
                  <TabelaDoGrupo grupo={grupo} />
                </GrupoDeDecisao>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="gap-2">
          <Button onClick={onConfirmar}>Confirmar importação</Button>
          <Button
            variant="outline"
            onClick={onTrocarArquivo}
          >
            Escolher outro arquivo
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
