'use client';

import { useMemo, useState } from 'react';
import { ADHERENCE_THRESHOLD } from '@/features/iel-demo/analysis/adherence';
import { COPY } from '@/features/iel-demo/copy';
import type { JobRankingEntry } from '@/features/iel-demo/state/selectors';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  MoreVertical,
  Search
} from 'lucide-react';

import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import { Checkbox } from '@workspace/ui/shadcn/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@workspace/ui/shadcn/dropdown-menu';
import { Input } from '@workspace/ui/shadcn/input';
import { Label } from '@workspace/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@workspace/ui/shadcn/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@workspace/ui/shadcn/table';
import { Tabs, TabsList, TabsTrigger } from '@workspace/ui/shadcn/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@workspace/ui/shadcn/tooltip';

import {
  barraDaAderencia,
  LADO,
  textoDaAderencia,
  TRILHO
} from '../metricas/cores';
import { CandidateStateBadge } from './candidate-state-badge';

/** As quatro leituras da mesma lista. Sugeridos é a que abre. */
export type CandidatesTab = 'sugeridos' | 'todos' | 'resgate' | 'sem-resposta';

type Aba = CandidatesTab;

/** Quantas linhas a aba de sugeridos mostra. */
const SUGERIDOS = 5;

const ABAS: Aba[] = ['sugeridos', 'todos', 'resgate', 'sem-resposta'];

/** Como cada aba se chama na legenda da tabela, lida pelo leitor de tela. */
const ABA_LEGENDA: Record<Aba, string> = {
  sugeridos: 'Sugeridos',
  todos: 'Todos',
  resgate: 'Resgate',
  'sem-resposta': 'Sem resposta'
};

type Coluna = 'combina' | 'requisitos' | 'estado';

const COLUNAS: Coluna[] = ['combina', 'requisitos', 'estado'];

const COLUNA_LABEL: Record<Coluna, string> = {
  combina: COPY.fit.label,
  requisitos: COPY.technical.label,
  estado: 'Estado'
};

type Ordem = { coluna: 'combina' | 'requisitos'; direcao: 'asc' | 'desc' };

/** O `aria-sort` do cabeçalho: diz ao leitor de tela como a coluna está. */
function ariaSort(
  ordem: Ordem | null,
  coluna: Ordem['coluna']
): 'ascending' | 'descending' | 'none' {
  if (!ordem || ordem.coluna !== coluna) return 'none';
  return ordem.direcao === 'asc' ? 'ascending' : 'descending';
}

/** O que o próximo clique no botão de ordenar faz, dito por extenso. */
function proximaOrdem(ordem: Ordem | null, coluna: Ordem['coluna']): string {
  if (!ordem || ordem.coluna !== coluna) return 'do maior para o menor';
  return ordem.direcao === 'desc'
    ? 'do menor para o maior'
    : 'tirar a ordenação';
}

/** Quem não tem medida vai para o fim, ordene-se como se ordenar. */
function comparar(
  a: number | null,
  b: number | null,
  direcao: 'asc' | 'desc'
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return direcao === 'desc' ? b - a : a - b;
}

export type CandidatesTableProps = {
  ranking: JobRankingEntry[];
  rescue: JobRankingEntry[];
  referralList: string[];
  comparison: string[];
  referralLimit: number;
  onToggleReferral: (applicationId: string) => void;
  onToggleComparison: (applicationId: string) => void;
  onOpenPerson: (entry: JobRankingEntry) => void;
  onAskPerson: (entry: JobRankingEntry) => void;
  /**
   * Aba controlada por fora: o cartão "Resgate" da vaga abre esta tabela já
   * na aba Resgate. Sem ela, a tabela guarda a própria aba.
   */
  tab?: CandidatesTab;
  onTabChange?: (tab: CandidatesTab) => void;
};

/**
 * A lista de candidatos da vaga.
 *
 * As quatro abas não filtram a mesma pergunta de quatro jeitos: elas são
 * quatro perguntas. "Sugeridos" é a remessa provável; "Todos" é a vaga
 * inteira, paginada; "Resgate" é quem o filtro técnico da origem descartaria
 * e o encontro com a empresa recupera; "Sem resposta" é quem ainda não deu
 * medida nenhuma — e por isso não aparece como zero em lugar nenhum.
 */
export function CandidatesTable({
  ranking,
  rescue,
  referralList,
  comparison,
  referralLimit,
  onToggleReferral,
  onToggleComparison,
  onOpenPerson,
  onAskPerson,
  tab,
  onTabChange
}: CandidatesTableProps) {
  const [abaInterna, setAbaInterna] = useState<Aba>('sugeridos');
  const aba = tab ?? abaInterna;
  const setAba = (valor: Aba) => {
    setAbaInterna(valor);
    onTabChange?.(valor);
  };
  const [busca, setBusca] = useState('');
  const [ordem, setOrdem] = useState<Ordem | null>(null);
  const [pagina, setPagina] = useState(0);
  const [porPagina, setPorPagina] = useState(10);
  const [colunas, setColunas] = useState<Record<Coluna, boolean>>({
    combina: true,
    requisitos: true,
    estado: true
  });

  const semResposta = useMemo(
    () => ranking.filter((entry) => entry.adherence.total === null),
    [ranking]
  );

  const base = useMemo(() => {
    if (aba === 'sugeridos') return ranking.slice(0, SUGERIDOS);
    if (aba === 'resgate') return rescue;
    if (aba === 'sem-resposta') return semResposta;
    return ranking;
  }, [aba, ranking, rescue, semResposta]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const lista = termo
      ? base.filter((entry) =>
          (entry.talent?.name ?? '').toLowerCase().includes(termo)
        )
      : base;

    if (!ordem) return lista;
    return [...lista].sort((a, b) =>
      ordem.coluna === 'combina'
        ? comparar(a.adherence.total, b.adherence.total, ordem.direcao)
        : comparar(a.technicalMatch, b.technicalMatch, ordem.direcao)
    );
  }, [base, busca, ordem]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const paginaAtual = Math.min(pagina, totalPaginas - 1);
  const visiveis = filtradas.slice(
    paginaAtual * porPagina,
    paginaAtual * porPagina + porPagina
  );

  const marcadasAqui = filtradas.filter((entry) =>
    referralList.includes(entry.application.id)
  ).length;
  const listaCheia = referralList.length >= referralLimit;

  const trocarAba = (valor: string) => {
    const escolhida = ABAS.find((item) => item === valor);
    if (!escolhida) return;
    setAba(escolhida);
    setPagina(0);
  };

  const ordenar = (coluna: 'combina' | 'requisitos') => {
    setOrdem((atual) =>
      atual && atual.coluna === coluna
        ? atual.direcao === 'desc'
          ? { coluna, direcao: 'asc' }
          : null
        : { coluna, direcao: 'desc' }
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs
          value={aba}
          onValueChange={trocarAba}
          className="max-w-full overflow-x-auto"
        >
          <TabsList className="**:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1">
            <TabsTrigger value="sugeridos">Sugeridos</TabsTrigger>
            <TabsTrigger value="todos">
              Todos <Badge variant="secondary">{ranking.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="resgate">
              Resgate <Badge variant="secondary">{rescue.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="sem-resposta">
              Sem resposta{' '}
              <Badge variant="secondary">{semResposta.length}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Label
              htmlFor="filtrar-por-nome"
              className="sr-only"
            >
              Filtrar por nome
            </Label>
            <Input
              id="filtrar-por-nome"
              type="search"
              placeholder="Filtrar por nome…"
              value={busca}
              onChange={(event) => {
                setBusca(event.target.value);
                setPagina(0);
              }}
              className="h-8 w-[200px] pl-8 text-[13px]"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
              >
                <Columns3 aria-hidden="true" />
                Colunas
                <ChevronDown aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56"
            >
              {COLUNAS.map((coluna) => (
                <DropdownMenuCheckboxItem
                  key={coluna}
                  checked={colunas[coluna]}
                  onCheckedChange={(valor) =>
                    setColunas((atual) => ({ ...atual, [coluna]: !!valor }))
                  }
                >
                  {COLUNA_LABEL[coluna]}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableCaption className="sr-only">
            Candidatos da vaga, aba {ABA_LEGENDA[aba]}:{' '}
            {filtradas.length === 1
              ? '1 pessoa'
              : `${filtradas.length} pessoas`}
            , página {paginaAtual + 1} de {totalPaginas}.
            {ordem
              ? ` Ordenada por ${COLUNA_LABEL[ordem.coluna].toLowerCase()}, ${
                  ordem.direcao === 'desc'
                    ? 'do maior para o menor'
                    : 'do menor para o maior'
                }.`
              : ''}{' '}
            Marque até {referralLimit} pessoas para envio.
          </TableCaption>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead
                scope="col"
                className="w-10"
              >
                <span className="sr-only">Marcar para envio</span>
              </TableHead>
              <TableHead scope="col">Pessoa</TableHead>
              {colunas.combina ? (
                <TableHead
                  scope="col"
                  aria-sort={ariaSort(ordem, 'combina')}
                  className="w-[220px]"
                >
                  {/*
                   * "Combina com a empresa" por extenso empurrava as colunas
                   * de largura fixa e mudava de tamanho quando as colunas
                   * eram ligadas e desligadas. O rótulo curto cabe sempre, e
                   * o que ele omite fica no balão — a régua dos 35% é
                   * justamente o que precisa estar à mão de quem ordena.
                   */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => ordenar('combina')}
                          className="-mx-2 inline-flex min-h-10 items-center gap-1 px-2 font-medium hover:text-foreground"
                        >
                          Combina
                          <span className="sr-only">
                            {' '}
                            com a empresa. Ordenar{' '}
                            {proximaOrdem(ordem, 'combina')}
                          </span>
                          {ordem?.coluna === 'combina' ? (
                            <ChevronDown
                              aria-hidden="true"
                              className={
                                ordem.direcao === 'asc'
                                  ? 'size-3.5 rotate-180'
                                  : 'size-3.5'
                              }
                            />
                          ) : null}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        com a empresa (≥ {ADHERENCE_THRESHOLD}%)
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              ) : null}
              {colunas.requisitos ? (
                <TableHead
                  scope="col"
                  aria-sort={ariaSort(ordem, 'requisitos')}
                  className="w-[140px] text-right"
                >
                  <button
                    type="button"
                    onClick={() => ordenar('requisitos')}
                    className="-mx-2 ml-auto inline-flex min-h-10 items-center gap-1 px-2 font-medium hover:text-foreground"
                  >
                    Requisitos
                    <span className="sr-only">
                      {' '}
                      da vaga. Ordenar {proximaOrdem(ordem, 'requisitos')}
                    </span>
                    {ordem?.coluna === 'requisitos' ? (
                      <ChevronDown
                        aria-hidden="true"
                        className={
                          ordem.direcao === 'asc'
                            ? 'size-3.5 rotate-180'
                            : 'size-3.5'
                        }
                      />
                    ) : null}
                  </button>
                </TableHead>
              ) : null}
              {colunas.estado ? (
                <TableHead
                  scope="col"
                  className="w-[180px]"
                >
                  Estado
                </TableHead>
              ) : null}
              <TableHead
                scope="col"
                className="w-12"
              >
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiveis.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    3 +
                    Number(colunas.combina) +
                    Number(colunas.requisitos) +
                    Number(colunas.estado)
                  }
                  className="h-24 text-center text-muted-foreground"
                >
                  Ninguém nesta lista com esse nome.
                </TableCell>
              </TableRow>
            ) : (
              visiveis.map((entry) => {
                const marcada = referralList.includes(entry.application.id);
                const total = entry.adherence.total;
                const nome = entry.talent?.name ?? 'Pessoa fora da base';
                return (
                  <TableRow
                    key={entry.application.id}
                    data-state={marcada ? 'selected' : undefined}
                  >
                    <TableCell className="py-0 pl-1">
                      {/*
                       * O quadradinho tem 16px; o rótulo em volta dá a ele
                       * uma área de toque de 44px sem mudar o desenho.
                       */}
                      <label className="flex size-11 cursor-pointer items-center justify-center has-disabled:cursor-not-allowed">
                        <Checkbox
                          checked={marcada}
                          disabled={!marcada && listaCheia}
                          aria-label={
                            !marcada && listaCheia
                              ? `Marcar ${nome} para envio (a remessa já tem ${referralLimit})`
                              : `Marcar ${nome} para envio`
                          }
                          onCheckedChange={() =>
                            onToggleReferral(entry.application.id)
                          }
                        />
                      </label>
                    </TableCell>
                    <TableCell>
                      <Button
                        id={`abrir-pessoa-${entry.application.id}`}
                        variant="link"
                        className="h-auto min-h-6 w-fit px-0 py-0 text-left text-foreground"
                        onClick={() => onOpenPerson(entry)}
                      >
                        {nome}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        {entry.talent?.headline ?? '—'}
                      </p>
                    </TableCell>
                    {colunas.combina ? (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            aria-hidden="true"
                            className={cn(
                              'h-2.5 w-28 overflow-hidden rounded-full',
                              TRILHO.trilha
                            )}
                          >
                            <div
                              className={cn(
                                'h-full rounded-full',
                                barraDaAderencia(total)
                              )}
                              style={{ width: `${total ?? 0}%` }}
                            />
                          </div>
                          {total === null ? (
                            <span className="tabular-nums">
                              <span aria-hidden="true">—</span>
                              <span className="sr-only">
                                Ainda sem medida de combinação com a empresa
                              </span>
                            </span>
                          ) : (
                            <span
                              className={cn(
                                'font-semibold tabular-nums',
                                textoDaAderencia(total)
                              )}
                            >
                              {Math.round(total)}%
                              <span className="sr-only">
                                {' '}
                                combina com a empresa
                              </span>
                            </span>
                          )}
                        </div>
                      </TableCell>
                    ) : null}
                    {colunas.requisitos ? (
                      <TableCell className="text-right tabular-nums">
                        <div className="flex items-center justify-end gap-2">
                          <div
                            aria-hidden="true"
                            className={cn(
                              'h-1.5 w-14 overflow-hidden rounded-full',
                              TRILHO.trilha
                            )}
                          >
                            <div
                              className={cn(
                                'h-full rounded-full',
                                LADO.empresa.preenchimento
                              )}
                              style={{ width: `${entry.technicalMatch ?? 0}%` }}
                            />
                          </div>
                          {entry.technicalMatch === null ? (
                            <span>
                              <span aria-hidden="true">—</span>
                              <span className="sr-only">
                                Sem percentual de requisitos
                              </span>
                            </span>
                          ) : (
                            <span className="w-9">
                              {entry.technicalMatch}%
                              <span className="sr-only"> dos requisitos</span>
                            </span>
                          )}
                        </div>
                      </TableCell>
                    ) : null}
                    {colunas.estado ? (
                      <TableCell>
                        <CandidateStateBadge entry={entry} />
                      </TableCell>
                    ) : null}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Ações para ${nome}`}
                            className="flex size-10 text-muted-foreground data-[state=open]:bg-muted"
                          >
                            <MoreVertical aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-44"
                        >
                          <DropdownMenuItem
                            onSelect={() => onOpenPerson(entry)}
                          >
                            Ver pessoa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              onToggleReferral(entry.application.id)
                            }
                          >
                            {marcada ? 'Tirar da remessa' : 'Marcar para envio'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              onToggleComparison(entry.application.id)
                            }
                          >
                            {comparison.includes(entry.application.id)
                              ? 'Tirar da comparação'
                              : 'Comparar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => onAskPerson(entry)}>
                            {COPY.questions.ask}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
          {marcadasAqui} de {filtradas.length} linha(s) selecionada(s).
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label
              htmlFor="linhas-por-pagina"
              className="text-sm font-medium"
            >
              Linhas por página
            </Label>
            <Select
              value={`${porPagina}`}
              onValueChange={(valor) => {
                setPorPagina(Number(valor));
                setPagina(0);
              }}
            >
              <SelectTrigger
                size="sm"
                className="w-20"
                id="linhas-por-pagina"
              >
                <SelectValue placeholder={`${porPagina}`} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((tamanho) => (
                  <SelectItem
                    key={tamanho}
                    value={`${tamanho}`}
                  >
                    {tamanho}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div
            aria-live="polite"
            className="flex w-fit items-center justify-center text-sm font-medium"
          >
            Página {paginaAtual + 1} de {totalPaginas}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              size="icon"
              className="hidden size-8 lg:flex"
              onClick={() => setPagina(0)}
              disabled={paginaAtual === 0}
            >
              <span className="sr-only">Primeira página</span>
              <ChevronsLeft aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setPagina((p) => Math.max(0, p - 1))}
              disabled={paginaAtual === 0}
            >
              <span className="sr-only">Página anterior</span>
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() =>
                setPagina((p) => Math.min(totalPaginas - 1, p + 1))
              }
              disabled={paginaAtual >= totalPaginas - 1}
            >
              <span className="sr-only">Próxima página</span>
              <ChevronRight aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="hidden size-8 lg:flex"
              onClick={() => setPagina(totalPaginas - 1)}
              disabled={paginaAtual >= totalPaginas - 1}
            >
              <span className="sr-only">Última página</span>
              <ChevronsRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
