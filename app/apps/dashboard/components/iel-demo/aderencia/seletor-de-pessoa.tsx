'use client';

import { useMemo, useState } from 'react';
import { ADHERENCE_THRESHOLD } from '@/features/iel-demo/analysis/adherence';
import type { JobRankingEntry } from '@/features/iel-demo/state/selectors';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  X
} from 'lucide-react';

import { Button } from '@workspace/ui/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@workspace/ui/shadcn/dropdown-menu';
import { Input } from '@workspace/ui/shadcn/input';

import { normalizarBusca } from '../jobs/busca';

function extrairIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 0 || !partes[0]) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1]?.[0] ?? ''}`.toUpperCase();
}

/**
 * Dropdown pesquisável de pessoas localizado acima da análise de aderência.
 *
 * Abre um menu suspenso com campo de busca integrado, lista com ranking,
 * iniciais, nome e percentual de aderência de cada candidato.
 */
export function SeletorDePessoa({
  entradas,
  selecionada,
  aoEscolher
}: {
  entradas: JobRankingEntry[];
  selecionada: JobRankingEntry;
  aoEscolher: (applicationId: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');

  const indiceAtual = entradas.findIndex(
    (e) => e.application.id === selecionada.application.id
  );

  const temAnterior = indiceAtual > 0;
  const temProximo = indiceAtual >= 0 && indiceAtual < entradas.length - 1;

  const irParaAnterior = () => {
    if (temAnterior && entradas[indiceAtual - 1]) {
      aoEscolher(entradas[indiceAtual - 1].application.id);
    }
  };

  const irParaProximo = () => {
    if (temProximo && entradas[indiceAtual + 1]) {
      aoEscolher(entradas[indiceAtual + 1].application.id);
    }
  };

  const entradasFiltradas = useMemo(() => {
    const termo = normalizarBusca(busca);
    if (!termo) return entradas;

    return entradas.filter((entrada) => {
      const nome = entrada.talent?.name ?? '';
      const cidade = entrada.talent?.city ?? '';
      const headline = entrada.talent?.headline ?? '';
      const texto = normalizarBusca(`${nome} ${cidade} ${headline}`);
      return texto.includes(termo);
    });
  }, [entradas, busca]);

  const nomeAtual = selecionada.talent?.name ?? 'Pessoa fora da base';
  const totalAtual = selecionada.adherence.total;
  const abaixoDoMinimo =
    totalAtual !== null && totalAtual < ADHERENCE_THRESHOLD;
  const iniciaisAtual = extrairIniciais(nomeAtual);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <DropdownMenu
        open={aberto}
        onOpenChange={setAberto}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            role="combobox"
            aria-expanded={aberto}
            className="h-10 min-w-[280px] max-w-[400px] justify-between gap-2.5 px-3 text-left font-normal shadow-xs hover:bg-muted/50"
          >
            <div className="flex items-center gap-2.5 truncate">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                  {selecionada.rank}º
                </span>
                <div className="flex size-6 items-center justify-center rounded-full bg-muted/80 text-[10px] font-semibold text-foreground/80 border border-border/60">
                  {iniciaisAtual}
                </div>
              </div>

              <span className="truncate font-medium text-foreground">
                {nomeAtual}
              </span>

              {totalAtual !== null ? (
                <span
                  className={`shrink-0 text-xs font-semibold tabular-nums ${
                    abaixoDoMinimo
                      ? 'text-[hsl(var(--brand-accent))]'
                      : 'text-foreground'
                  }`}
                >
                  {Math.round(totalAtual)}%
                </span>
              ) : (
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  pendente
                </span>
              )}
            </div>

            <ChevronDown
              className="size-4 shrink-0 text-muted-foreground transition-transform duration-200"
              aria-hidden="true"
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-[340px] p-2 shadow-md"
        >
          <div className="relative mb-2">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Buscar pessoa por nome…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-8 pl-8 pr-8 text-xs"
              autoFocus
            />
            {busca ? (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
            {entradasFiltradas.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                <User className="size-6 mx-auto mb-1.5 opacity-40" />
                <p>Nenhuma pessoa encontrada para &ldquo;{busca}&rdquo;.</p>
              </div>
            ) : (
              entradasFiltradas.map((entrada) => {
                const ehSelecionada =
                  entrada.application.id === selecionada.application.id;
                const nome = entrada.talent?.name ?? 'Pessoa fora da base';
                const total = entrada.adherence.total;
                const abaixo = total !== null && total < ADHERENCE_THRESHOLD;
                const iniciais = extrairIniciais(nome);

                return (
                  <button
                    key={entrada.application.id}
                    type="button"
                    onClick={() => {
                      aoEscolher(entrada.application.id);
                      setAberto(false);
                      setBusca('');
                    }}
                    className={`flex w-full items-center justify-between gap-2.5 rounded-md px-2.5 py-2 text-left text-xs transition-colors ${
                      ehSelecionada
                        ? 'bg-primary/10 font-medium text-foreground'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground tabular-nums">
                        {entrada.rank}º
                      </span>
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted/60 text-[10px] font-semibold text-foreground/80 border border-border/50">
                        {iniciais}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="truncate font-medium">{nome}</span>
                        {entrada.talent?.city ? (
                          <span className="truncate text-[10px] text-muted-foreground">
                            {entrada.talent.city}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {total !== null ? (
                        <span
                          className={`font-semibold tabular-nums text-xs ${
                            abaixo
                              ? 'text-[hsl(var(--brand-accent))]'
                              : 'text-foreground'
                          }`}
                        >
                          {Math.round(total)}%
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">
                          pendente
                        </span>
                      )}
                      {ehSelecionada ? (
                        <Check
                          className="size-3.5 text-primary shrink-0"
                          aria-hidden="true"
                        />
                      ) : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground tabular-nums">
          {indiceAtual + 1} de {entradas.length} pessoas
        </span>
        <div className="flex items-center gap-0.5">
          <Button
            variant="outline"
            size="icon"
            onClick={irParaAnterior}
            disabled={!temAnterior}
            className="size-8"
            title="Pessoa anterior no ranking"
            aria-label="Pessoa anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={irParaProximo}
            disabled={!temProximo}
            className="size-8"
            title="Próxima pessoa no ranking"
            aria-label="Próxima pessoa"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
