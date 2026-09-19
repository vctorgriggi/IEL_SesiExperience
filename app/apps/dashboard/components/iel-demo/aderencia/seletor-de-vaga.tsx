'use client';

import { useMemo, useState } from 'react';
import { getCompany } from '@/features/iel-demo/state/selectors';
import type { Company, Job } from '@/features/iel-demo/types';
import { Briefcase, Check, ChevronsUpDown, Search, X } from 'lucide-react';

import { Button } from '@workspace/ui/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@workspace/ui/shadcn/dropdown-menu';
import { Input } from '@workspace/ui/shadcn/input';

import { normalizarBusca } from '../jobs/busca';

export function SeletorDeVaga({
  vagas,
  jobAtual,
  empresaAtual,
  aoTrocar
}: {
  vagas: Job[];
  jobAtual: Job;
  empresaAtual: Company | null;
  aoTrocar: (jobId: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');

  const vagasFiltradas = useMemo(() => {
    const termo = normalizarBusca(busca);
    if (!termo) return vagas;
    return vagas.filter((vaga) => {
      const empresa = getCompany(vaga.companyId);
      const texto = normalizarBusca(
        `${vaga.title} ${empresa?.name ?? ''} ${vaga.location ?? ''}`
      );
      return texto.includes(termo);
    });
  }, [vagas, busca]);

  return (
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
          className="h-10 min-w-[260px] max-w-[360px] justify-between gap-2 px-3 text-left font-normal shadow-xs"
        >
          <div className="flex items-center gap-2 truncate">
            <Briefcase
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="flex flex-col truncate leading-tight">
              <span className="truncate font-medium text-foreground">
                {jobAtual.title}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {empresaAtual?.name ?? 'Empresa'}
              </span>
            </div>
          </div>
          <ChevronsUpDown
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[320px] p-2"
      >
        <div className="relative mb-2">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Buscar vaga ou empresa..."
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

        <div className="max-h-64 overflow-y-auto space-y-1">
          {vagasFiltradas.length === 0 ? (
            <p className="p-3 text-center text-xs text-muted-foreground">
              Nenhuma vaga encontrada para &ldquo;{busca}&rdquo;.
            </p>
          ) : (
            vagasFiltradas.map((vaga) => {
              const selecionada = vaga.id === jobAtual.id;
              const empresa = getCompany(vaga.companyId);
              return (
                <button
                  key={vaga.id}
                  type="button"
                  onClick={() => {
                    aoTrocar(vaga.id);
                    setAberto(false);
                    setBusca('');
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors ${
                    selecionada
                      ? 'bg-primary/10 font-medium text-foreground'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <div className="flex flex-col truncate">
                    <span className="truncate font-medium">{vaga.title}</span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {empresa?.name ? `${empresa.name} · ` : ''}
                      {vaga.location}
                    </span>
                  </div>
                  {selecionada ? (
                    <Check
                      className="size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
