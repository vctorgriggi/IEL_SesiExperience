'use client';

import type { RegiaoAtendimento } from '@/features/iel-demo/fixtures/regioes';
import {
  getEncaminhamentosDaRegional,
  getVisibleCompanies,
  getVisibleJobs
} from '@/features/iel-demo/state/selectors';
import type { DemoState } from '@/features/iel-demo/types';
import { IconMapPin, IconTarget } from '@tabler/icons-react';

import { cn } from '@workspace/ui/lib/utils';
import { Card } from '@workspace/ui/shadcn/card';

/**
 * O quadro da regional, no topo da tela de quem atende uma.
 *
 * É a única peça da Central desenhada para ser lida de longe e em dois
 * segundos: a analista abre o dia, olha a barra e sabe se está dentro ou
 * fora da meta. Por isso ela carrega três números, e não doze — a leitura
 * fina de tendência é do BI, que é a tela da gerência.
 *
 * A meta é da demonstração e o rótulo diz isso. Ver `fixtures/regioes.ts`.
 */
export function PainelDaRegional({
  regiao,
  state
}: {
  regiao: RegiaoAtendimento;
  state: DemoState;
}) {
  const realizado = getEncaminhamentosDaRegional(state, regiao.id);
  const empresas = getVisibleCompanies(state).length;
  const vagas = getVisibleJobs(state).length;

  const proporcao = Math.min(realizado / regiao.metaMensal, 1);
  const percentual = Math.round(proporcao * 100);
  const faltam = Math.max(regiao.metaMensal - realizado, 0);

  // Três faixas, com texto e ícone além da cor: cor sozinha não informa.
  const faixa =
    proporcao >= 1 ? 'cumprida' : proporcao >= 0.6 ? 'a caminho' : 'atrasada';
  const tom =
    faixa === 'cumprida'
      ? 'bg-emerald-500'
      : faixa === 'a caminho'
        ? 'bg-amber-500'
        : 'bg-orange-600';

  return (
    <Card className="rounded-2xl border border-border/75 bg-card/95 p-5 shadow-xs">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <IconMapPin
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
              <span className="text-lg font-semibold tracking-tight text-foreground">
                Regional {regiao.nome}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {regiao.cidades.join(' · ')}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <IconTarget
              aria-hidden="true"
              className="size-3.5"
            />
            Meta do mês, demonstração
          </div>
        </div>

        {/*
         * O número grande é o que a analista entrega. A meta fica ao lado,
         * menor, porque é referência e não conquista.
         */}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-4xl font-bold tracking-tight tabular-nums text-foreground">
            {realizado}
          </span>
          <span className="text-sm text-muted-foreground">
            de {regiao.metaMensal} encaminhamentos
          </span>
          <span
            className={cn(
              'ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium',
              faixa === 'cumprida'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : faixa === 'a caminho'
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                  : 'bg-orange-600/10 text-orange-700 dark:text-orange-300'
            )}
          >
            {percentual}% · {faixa}
          </span>
        </div>

        <div
          role="img"
          aria-label={`Meta da regional ${regiao.nome}: ${realizado} de ${regiao.metaMensal} encaminhamentos, ${percentual} por cento, ${faixa}.`}
          className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className={cn('h-full rounded-full transition-all', tom)}
            style={{ width: `${Math.max(percentual, 1)}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            {faltam === 0
              ? 'Meta do mês alcançada.'
              : `Faltam ${faltam} para a meta.`}
          </span>
          <span className="text-muted-foreground/40">•</span>
          <span>
            {empresas} {empresas === 1 ? 'empresa' : 'empresas'} na carteira
          </span>
          <span className="text-muted-foreground/40">•</span>
          <span>
            {vagas} {vagas === 1 ? 'vaga' : 'vagas'} na regional
          </span>
        </div>
      </div>
    </Card>
  );
}
