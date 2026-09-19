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
import { Progress } from '@workspace/ui/shadcn/progress';
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

import { CandidateStateBadge } from './candidate-state-badge';

/** As quatro leituras da mesma lista. Sugeridos é a que abre. */
export type CandidatesTab = 'sugeridos' | 'todos' | 'resgate' | 'sem-resposta';

type Aba = CandidatesTab;

/** Quantas linhas a aba de sugeridos mostra. */
const SUGERIDOS = 5;

const ABAS: Aba[] = ['sugeridos', 'todos', 'resgate', 'sem-resposta'];

type Coluna = 'combina' | 'requisitos' | 'estado';

const COLUNAS: Coluna[] = ['combina', 'requisitos', 'estado'];

const COLUNA_LABEL: Record<Coluna, string> = {
  combina: COPY.fit.label,
  requisitos: COPY.technical.label,
  estado: 'Estado'
};

type Ordem = { coluna: 'combina' | 'requisitos'; direcao: 'asc' | 'desc' };

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
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
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
                <Columns3 />
                Colunas
                <ChevronDown />
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
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Pessoa</TableHead>
              {colunas.combina ? (
                <TableHead className="w-[220px]">
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
                          className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                        >
                          Combina
                          {ordem?.coluna === 'combina' ? (
                            <ChevronDown
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
                <TableHead className="w-[140px] text-right">
                  <button
                    type="button"
                    onClick={() => ordenar('requisitos')}
                    className="ml-auto inline-flex items-center gap-1 font-medium hover:text-foreground"
                  >
                    Requisitos
                    {ordem?.coluna === 'requisitos' ? (
                      <ChevronDown
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
                <TableHead className="w-[180px]">Estado</TableHead>
              ) : null}
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiveis.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
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
                    <TableCell className="pl-3">
                      <Checkbox
                        checked={marcada}
                        disabled={!marcada && listaCheia}
                        aria-label={`Marcar ${nome} para envio`}
                        onCheckedChange={() =>
                          onToggleReferral(entry.application.id)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="link"
                        className="h-auto w-fit px-0 py-0 text-left text-foreground"
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
                          <Progress
                            value={total ?? 0}
                            className="h-2 w-28 bg-muted"
                          />
                          <span className="tabular-nums">
                            {total === null ? '—' : `${Math.round(total)}%`}
                          </span>
                        </div>
                      </TableCell>
                    ) : null}
                    {colunas.requisitos ? (
                      <TableCell className="text-right tabular-nums">
                        {entry.technicalMatch === null
                          ? '—'
                          : `${entry.technicalMatch}%`}
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
                            className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
                          >
                            <MoreVertical />
                            <span className="sr-only">Abrir menu</span>
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
          <div className="flex w-fit items-center justify-center text-sm font-medium">
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
              <ChevronsLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setPagina((p) => Math.max(0, p - 1))}
              disabled={paginaAtual === 0}
            >
              <span className="sr-only">Página anterior</span>
              <ChevronLeft />
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
              <ChevronRight />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="hidden size-8 lg:flex"
              onClick={() => setPagina(totalPaginas - 1)}
              disabled={paginaAtual >= totalPaginas - 1}
            >
              <span className="sr-only">Última página</span>
              <ChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
