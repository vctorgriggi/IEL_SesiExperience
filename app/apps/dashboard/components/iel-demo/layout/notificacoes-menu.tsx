'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import { IconBell, IconCheck } from '@tabler/icons-react';

import { routes } from '@workspace/routes';
import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@workspace/ui/shadcn/dropdown-menu';

import {
  montarPendencias,
  TIPO_DE_PENDENCIA_LABEL,
  type NivelDePrioridade,
  type Pendencia
} from '../overview/pendencias';

/** Quantas cabem no menu sem virar rolagem longa. O resto fica na fila do dia. */
const NO_MENU = 6;

const CHAVE_LIDAS = 'mind-rh:notificacoes-lidas';

/**
 * O que já foi visto fica no navegador de quem viu, como a anotação da
 * ligação. Não passa pelo estado da demonstração de propósito: "li" é de quem
 * leu, não da base — duas pessoas na mesma sala não apagam o aviso uma da
 * outra. Armazenamento bloqueado não quebra a barra.
 */
function lerLidas(): string[] {
  try {
    const bruto = window.localStorage.getItem(CHAVE_LIDAS);
    if (!bruto) return [];
    const lido: unknown = JSON.parse(bruto);
    return Array.isArray(lido)
      ? lido.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

function gravarLidas(ids: string[]): void {
  try {
    window.localStorage.setItem(CHAVE_LIDAS, JSON.stringify(ids));
  } catch {
    // Sem armazenamento, o aviso volta na próxima carga: é o lado seguro do
    // erro — melhor repetir do que sumir com o que falta fazer.
  }
}

const PONTO_DA_PRIORIDADE: Record<NivelDePrioridade, string> = {
  alta: 'bg-rose-500',
  media: 'bg-amber-500',
  normal: 'bg-muted-foreground/60'
};

/**
 * O sino do cabeçalho: o que precisa da analista, sem abrir a fila do dia.
 *
 * As notificações **são** as pendências da fila (`montarPendencias`), não uma
 * segunda lista com regra própria: um aviso que não existisse na fila seria um
 * aviso sem lugar onde resolver. O sino só antecipa, na mesma ordem de
 * severidade, e cada linha leva direto ao verbo que resolve.
 *
 * Só a analista o vê. O gestor entra pela mesma casca, mas a fila é do
 * trabalho do IEL e leva a telas que não são dele (PRODUTO.md §5).
 */
export function NotificacoesMenu() {
  const { state, persona } = useIelDemo();
  const [lidas, setLidas] = useState<string[]>([]);
  const [hidratado, setHidratado] = useState(false);

  // localStorage só existe no navegador: o servidor renderiza sem marca
  // nenhuma, e o que já foi lido chega depois de montar, sem divergência de
  // hidratação.
  useEffect(() => {
    setLidas(lerLidas());
    setHidratado(true);
  }, []);

  const pendencias = useMemo(() => montarPendencias(state), [state]);

  if (persona.kind === 'gestor') return null;

  const lidasSet = new Set(lidas);
  const naoLidas = hidratado
    ? pendencias.filter((pendencia) => !lidasSet.has(pendencia.id))
    : [];
  const noMenu = pendencias.slice(0, NO_MENU);
  const restantes = pendencias.length - noMenu.length;

  const marcar = (ids: string[]) => {
    const proximas = [...new Set([...lidas, ...ids])];
    setLidas(proximas);
    gravarLidas(proximas);
  };

  const contador = naoLidas.length;
  const rotulo =
    contador === 0
      ? 'Notificações: nada pendente'
      : `Notificações: ${contador} ${contador === 1 ? 'pendência' : 'pendências'} sem ler`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={rotulo}
          data-tour="cabecalho-notificacoes"
        >
          <IconBell aria-hidden="true" />
          {contador > 0 ? (
            <span
              aria-hidden="true"
              className="absolute top-1 right-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-rose-500 px-[3px] text-[9px] leading-none font-semibold tabular-nums text-white ring-2 ring-background"
            >
              {contador > 9 ? '9+' : contador}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[min(22rem,calc(100vw-2rem))] p-0"
      >
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <span className="text-sm font-medium">Notificações</span>
          {contador > 0 ? (
            <Button
              variant="ghost"
              size="xs"
              className="text-xs text-muted-foreground"
              onClick={() =>
                marcar(pendencias.map((pendencia) => pendencia.id))
              }
            >
              <IconCheck aria-hidden="true" />
              Marcar todas como lidas
            </Button>
          ) : null}
        </div>
        <DropdownMenuSeparator className="m-0" />

        {noMenu.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            Nada pendente agora.
          </p>
        ) : (
          <ul className="max-h-[60vh] overflow-y-auto py-1">
            {noMenu.map((pendencia: Pendencia) => {
              const naoLida = hidratado && !lidasSet.has(pendencia.id);
              return (
                <li key={pendencia.id}>
                  <DropdownMenuItem
                    asChild
                    className="items-start gap-3 px-3 py-2"
                    onSelect={() => marcar([pendencia.id])}
                  >
                    <Link href={pendencia.href}>
                      <span
                        aria-hidden="true"
                        className={cn(
                          'mt-1.5 size-2 shrink-0 rounded-full',
                          naoLida
                            ? PONTO_DA_PRIORIDADE[pendencia.prioridade]
                            : 'bg-transparent'
                        )}
                      />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="flex min-w-0 items-baseline gap-2">
                          <span
                            className={cn(
                              'truncate text-sm',
                              naoLida ? 'font-medium' : 'text-muted-foreground'
                            )}
                          >
                            {pendencia.titulo}
                          </span>
                          {naoLida ? (
                            <span className="sr-only">(não lida)</span>
                          ) : null}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {TIPO_DE_PENDENCIA_LABEL[pendencia.tipo]} ·{' '}
                          {pendencia.resumo}
                        </span>
                        <span
                          className={cn(
                            'text-xs',
                            pendencia.statusPrazo === 'atrasado'
                              ? 'text-rose-700 dark:text-rose-400'
                              : pendencia.statusPrazo === 'urgente'
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-muted-foreground/70'
                          )}
                        >
                          {pendencia.prazoLabel}
                        </span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                </li>
              );
            })}
          </ul>
        )}

        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuItem
          asChild
          className="justify-center px-3 py-2 text-sm"
        >
          <Link href={routes.dashboard.iel.index}>
            {restantes > 0
              ? `Ver a fila do dia (+${restantes})`
              : 'Ver a fila do dia'}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
