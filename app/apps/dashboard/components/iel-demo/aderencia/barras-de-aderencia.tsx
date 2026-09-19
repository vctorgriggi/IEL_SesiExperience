'use client';

import { useMemo, useState } from 'react';
import { ADHERENCE_THRESHOLD } from '@/features/iel-demo/analysis/adherence';
import { COPY } from '@/features/iel-demo/copy';
import { plural } from '@/features/iel-demo/format';
import type { JobRankingEntry } from '@/features/iel-demo/state/selectors';
import { Search, User, X } from 'lucide-react';

import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/shadcn/button';
import { Input } from '@workspace/ui/shadcn/input';

import { normalizarBusca } from '../jobs/busca';
import { barraDaAderencia, textoDaAderencia, TRILHO } from '../metricas/cores';

const BARRAS_PADRAO = 12;

type FiltroStatus = 'todos' | 'compativeis' | 'abaixo' | 'sem-resposta';

function extrairIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 0 || !partes[0]) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1]?.[0] ?? ''}`.toUpperCase();
}

/**
 * As pessoas da vaga ordenadas pela aderência, com campo de busca por nome
 * e filtros rápidos de status.
 */
export function BarrasDeAderencia({
  entradas,
  aoEscolher,
  applicationSelecionada
}: {
  entradas: JobRankingEntry[];
  aoEscolher: (applicationId: string) => void;
  applicationSelecionada: string | null;
}) {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos');
  const [mostrarTodos, setMostrarTodos] = useState(false);

  const contagens = useMemo(() => {
    let compativeis = 0;
    let abaixo = 0;
    let semResposta = 0;

    for (const item of entradas) {
      if (item.adherence.total === null) {
        semResposta++;
      } else if (item.adherence.total >= ADHERENCE_THRESHOLD) {
        compativeis++;
      } else {
        abaixo++;
      }
    }

    return {
      todos: entradas.length,
      compativeis,
      abaixo,
      semResposta
    };
  }, [entradas]);

  const entradasFiltradas = useMemo(() => {
    const termo = normalizarBusca(busca);

    return entradas.filter((entrada) => {
      if (filtroStatus === 'compativeis') {
        if (
          entrada.adherence.total === null ||
          entrada.adherence.total < ADHERENCE_THRESHOLD
        ) {
          return false;
        }
      } else if (filtroStatus === 'abaixo') {
        if (
          entrada.adherence.total === null ||
          entrada.adherence.total >= ADHERENCE_THRESHOLD
        ) {
          return false;
        }
      } else if (filtroStatus === 'sem-resposta') {
        if (entrada.adherence.total !== null) {
          return false;
        }
      }

      if (!termo) return true;
      const nome = entrada.talent?.name ?? '';
      const headline = entrada.talent?.headline ?? '';
      const texto = normalizarBusca(`${nome} ${headline}`);
      return texto.includes(termo);
    });
  }, [entradas, busca, filtroStatus]);

  const visiveis = mostrarTodos
    ? entradasFiltradas
    : entradasFiltradas.slice(0, BARRAS_PADRAO);
  const temMais = entradasFiltradas.length > BARRAS_PADRAO;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-[280px]">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Buscar pessoa por nome…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-9 pl-9 pr-8 text-sm"
          />
          {busca ? (
            <button
              type="button"
              onClick={() => setBusca('')}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Button
            variant={filtroStatus === 'todos' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFiltroStatus('todos')}
            className="h-8 px-2.5 text-xs"
          >
            Todas ({contagens.todos})
          </Button>
          <Button
            variant={filtroStatus === 'compativeis' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFiltroStatus('compativeis')}
            className="h-8 px-2.5 text-xs"
          >
            Compatíveis ({contagens.compativeis})
          </Button>
          <Button
            variant={filtroStatus === 'abaixo' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFiltroStatus('abaixo')}
            className="h-8 px-2.5 text-xs"
          >
            Abaixo de 35% ({contagens.abaixo})
          </Button>
          <Button
            variant={filtroStatus === 'sem-resposta' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFiltroStatus('sem-resposta')}
            className="h-8 px-2.5 text-xs"
          >
            Sem resposta ({contagens.semResposta})
          </Button>
        </div>
      </div>

      {entradasFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
          <User className="size-8 text-muted-foreground/60 mb-2" />
          <p className="text-sm font-medium text-foreground">
            Nenhuma pessoa encontrada
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            {busca
              ? `Não há candidatos com o termo "${busca}" neste filtro.`
              : 'Nenhum candidato nesta categoria.'}
          </p>
          {busca || filtroStatus !== 'todos' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBusca('');
                setFiltroStatus('todos');
              }}
              className="mt-3 text-xs"
            >
              Limpar filtros
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Mostrando {visiveis.length} de{' '}
              {plural(entradasFiltradas.length, 'pessoa', 'pessoas')}
              {busca ? ` para "${busca}"` : ''}
            </span>
            <span>Clique para abrir o detalhamento individual</span>
          </div>

          <ol
            aria-label={`${COPY.fit.label}, ordenado por aderência`}
            className="flex flex-col gap-2"
          >
            {visiveis.map((entrada) => {
              const total = entrada.adherence.total;
              const selecionada =
                entrada.application.id === applicationSelecionada;
              const nome = entrada.talent?.name ?? 'Pessoa fora da base';
              const iniciais = extrairIniciais(nome);

              return (
                <li key={entrada.application.id}>
                  <button
                    type="button"
                    onClick={() => aoEscolher(entrada.application.id)}
                    aria-current={selecionada ? 'true' : undefined}
                    className={`grid w-full grid-cols-[2rem_2rem_minmax(0,12rem)_1fr_6.5rem] items-center gap-3 rounded-lg border p-2.5 text-left transition-all ${
                      selecionada
                        ? 'border-primary/40 bg-accent/80 shadow-xs ring-1 ring-primary/20'
                        : 'border-border/60 bg-card hover:bg-muted/40 hover:border-border'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {entrada.rank}º
                      </span>
                    </div>

                    <div className="flex size-8 items-center justify-center rounded-full border border-border/60 bg-muted text-xs font-semibold text-foreground/80">
                      {iniciais}
                    </div>

                    <div className="flex flex-col truncate">
                      <span className="truncate text-sm font-medium text-foreground">
                        {nome}
                      </span>
                      {entrada.talent?.city ? (
                        <span className="truncate text-[11px] text-muted-foreground">
                          {entrada.talent.city}
                        </span>
                      ) : null}
                    </div>

                    <div
                      aria-hidden="true"
                      className={cn(
                        'relative h-2.5 overflow-hidden rounded-full',
                        TRILHO.trilha
                      )}
                    >
                      {total !== null ? (
                        <div
                          className={cn(
                            'h-full rounded-full',
                            barraDaAderencia(total)
                          )}
                          style={{ width: `${total}%` }}
                        />
                      ) : null}
                      <div
                        className={cn(
                          'absolute inset-y-0 w-0.5',
                          TRILHO.minimo
                        )}
                        style={{ left: `${ADHERENCE_THRESHOLD}%` }}
                      />
                    </div>

                    <div className="flex flex-col items-end leading-tight">
                      <span
                        className={cn(
                          'text-sm font-semibold tabular-nums',
                          textoDaAderencia(total)
                        )}
                      >
                        {total === null ? (
                          <span className="text-xs font-normal text-muted-foreground">
                            {COPY.fit.semResposta}
                          </span>
                        ) : (
                          `${Math.round(total)}%`
                        )}
                      </span>
                      {entrada.technicalMatch !== null ? (
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          Req. {entrada.technicalMatch}%
                        </span>
                      ) : null}
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>

          {temMais ? (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMostrarTodos(!mostrarTodos)}
                className="text-xs"
              >
                {mostrarTodos
                  ? 'Mostrar apenas as 12 primeiras pessoas'
                  : `Mostrar todas as ${entradasFiltradas.length} pessoas`}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
