'use client';

import { useMemo, useState } from 'react';
import {
  FIT_AXES,
  type FitAxis,
  type FitAxisId
} from '@/features/iel-demo/analysis/fit-axes';
import {
  ITENS_DO_INSTRUMENTO,
  itensDoTema
} from '@/features/iel-demo/analysis/instrumento';
import { plural } from '@/features/iel-demo/format';
import { IconChevronDown } from '@tabler/icons-react';

import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/shadcn/button';

import { usePageHeader } from '../layout/page-header-context';

/**
 * Os temas do instrumento, e o que cada um pergunta.
 *
 * Uma tela de leitura: nada aqui muda estado. Serve para quem precisa
 * responder "o que exatamente vocês perguntam?" sem abrir o Instrumento, que
 * é a tela de controle da analista e mostra as 52 frases de uma vez.
 *
 * Cada tema abre no lugar. A frase aparece como o cliente escreveu, com o
 * número da planilha ao lado: a planilha foi feita com rigor e o texto dela
 * não é reescrito em tela nenhuma.
 */
export function TemasScreen() {
  usePageHeader({ breadcrumb: [{ label: 'Temas' }] });

  const [abertos, setAbertos] = useState<Set<FitAxisId>>(new Set());

  const porTema = useMemo(
    () => FIT_AXES.map((axis) => ({ axis, itens: itensDoTema(axis.id) })),
    []
  );

  const todosAbertos = abertos.size === FIT_AXES.length;

  function alternar(id: FitAxisId) {
    setAbertos((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Temas
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            O que o questionário observa, tema a tema. A empresa responde
            pensando na equipe e a pessoa responde pensando em si; as frases são
            as mesmas dos dois lados.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {FIT_AXES.length} temas · {ITENS_DO_INSTRUMENTO.length} frases
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setAbertos(
                todosAbertos
                  ? new Set()
                  : new Set(FIT_AXES.map((axis) => axis.id))
              )
            }
          >
            {todosAbertos ? 'Fechar todos' : 'Abrir todos'}
          </Button>
        </div>
      </div>

      <div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/75 bg-card/95 shadow-xs">
        {porTema.map(({ axis, itens }) => (
          <LinhaDoTema
            key={axis.id}
            axis={axis}
            itens={itens}
            aberto={abertos.has(axis.id)}
            aoAlternar={() => alternar(axis.id)}
          />
        ))}
      </div>
    </div>
  );
}

function LinhaDoTema({
  axis,
  itens,
  aberto,
  aoAlternar
}: {
  axis: FitAxis;
  itens: ReturnType<typeof itensDoTema>;
  aberto: boolean;
  aoAlternar: () => void;
}) {
  const painelId = `tema-${axis.id}`;

  return (
    <div>
      <h2 className="m-0">
        <button
          type="button"
          onClick={aoAlternar}
          aria-expanded={aberto}
          aria-controls={painelId}
          className={cn(
            'flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors',
            'hover:bg-muted/50 focus-visible:outline-none focus-visible:bg-muted/50',
            aberto && 'bg-muted/40'
          )}
        >
          <IconChevronDown
            aria-hidden="true"
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform',
              aberto && 'rotate-180'
            )}
          />
          <span className="flex-1 text-sm font-semibold text-foreground">
            {axis.label}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {plural(itens.length, 'frase', 'frases')}
          </span>
        </button>
      </h2>

      {aberto ? (
        <div
          id={painelId}
          className="border-t border-border/60 bg-background/40 px-4 pb-4 pt-3.5"
        >
          {/* O que o tema observa, para a leitura não virar julgamento de pessoa. */}
          <p className="mb-3.5 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            {axis.description}
          </p>

          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {itens.map((item) => (
              <li
                key={item.id}
                className="flex gap-3 rounded-lg border border-border/60 bg-card px-3 py-2.5"
              >
                <span className="mt-0.5 shrink-0 font-mono text-[11px] font-medium tabular-nums text-muted-foreground">
                  {item.id}
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-sm leading-snug text-foreground">
                    {item.texto}
                  </span>
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {item.subtema}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
