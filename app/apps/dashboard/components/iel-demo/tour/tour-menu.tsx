'use client';

/**
 * O tour, a partir do cabeçalho.
 *
 * Um botão na barra de 48px abre um diálogo com uma opção por tela, mais a
 * jornada inteira, que atravessa as telas sozinha.
 *
 * Quem navega é este componente: ele entrega ao motor do tour uma função
 * `navegar` que empurra a rota e só resolve quando a tela chega. Por isso
 * vive no cabeçalho — é o que sobrevive à troca de rota dentro da casca.
 */
import { useCallback, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { IconCompass, IconPlayerPlay } from '@tabler/icons-react';

import 'driver.js/dist/driver.css';

import { tourDaRota, TOURS } from '@/features/iel-demo/tour/tours';
import type { TourDeTela } from '@/features/iel-demo/tour/types';
import { useDriverDoTour } from '@/features/iel-demo/tour/use-tour';

import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@workspace/ui/shadcn/dialog';

/** Quanto se espera a rota trocar antes de seguir assim mesmo. */
const ESPERA_DA_ROTA_MS = 5000;

export function TourMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  /*
   * Empurra a rota e resolve quando o navegador já está nela. O `push` do
   * App Router não avisa quando terminou, então quem avisa é o próprio
   * `location` — é o único sinal que não depende de re-render deste
   * componente, que pode nem acontecer no meio do tour. A comparação leva a
   * busca junto: passo que só troca o `?aba=` chegaria antes da aba.
   */
  const navegar = useCallback(
    (rota: string) =>
      new Promise<void>((resolve) => {
        router.push(rota);
        const limite = Date.now() + ESPERA_DA_ROTA_MS;
        const conferir = () => {
          const atual = `${window.location.pathname}${window.location.search}`;
          if (atual === rota || Date.now() > limite) {
            resolve();
            return;
          }
          window.setTimeout(conferir, 60);
        };
        conferir();
      }),
    [router]
  );

  const { dirigir } = useDriverDoTour(navegar);

  const tourDestaTela = tourDaRota(pathname);

  // Quem é o roteiro está dito no registro, não num id escrito aqui.
  const roteiro = TOURS.find((tour) => tour.roteiro) ?? null;
  const porTela = TOURS.filter((tour) => tour !== roteiro);

  const escolher = useCallback(
    (tour: TourDeTela) => {
      setAberto(false);
      void dirigir(tour);
    },
    [dirigir]
  );

  return (
    <Dialog
      open={aberto}
      onOpenChange={setAberto}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          data-tour="cabecalho-tour"
        >
          <IconCompass className="size-4" />
          <span className="hidden sm:inline">Tour</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-4 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tour guiado</DialogTitle>
          <DialogDescription>
            O roteiro inteiro, ou uma tela por vez. Cada passo aponta o que o
            bloco responde, na ordem em que se lê.
          </DialogDescription>
        </DialogHeader>

        {/*
         * O roteiro da apresentação não é mais um item igual aos outros na
         * lista: ele atravessa o produto inteiro e é o que se escolhe quando
         * há alguém do lado. Fica em cartão próprio, antes da lista, com o
         * tamanho do percurso à vista.
         */}
        {roteiro ? (
          <button
            type="button"
            onClick={() => escolher(roteiro)}
            className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <roteiro.icone className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{roteiro.titulo}</span>
                <Badge className="shrink-0">apresentação</Badge>
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {roteiro.descricao}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-primary">
              {roteiro.passos.length} passos
              <IconPlayerPlay className="size-3.5" />
            </span>
          </button>
        ) : null}

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Por tela
          </p>
          {/*
           * Duas colunas a partir do `sm`: com treze telas, a lista de uma
           * coluna só virava rolagem longa e escondia metade do produto atrás
           * de um arrasto.
           */}
          <ul className="-mx-1 grid max-h-[46vh] gap-1 overflow-y-auto px-1 sm:grid-cols-2">
            {porTela.map((tour) => {
              const Icone = tour.icone;
              const atual = tourDestaTela?.id === tour.id;
              return (
                <li key={tour.id}>
                  <button
                    type="button"
                    onClick={() => escolher(tour)}
                    className={cn(
                      'group flex h-full w-full cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                      atual
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-transparent hover:border-border hover:bg-muted/60'
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-md',
                        atual
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground group-hover:bg-background'
                      )}
                    >
                      <Icone className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {tour.titulo}
                        </span>
                        {atual ? (
                          <Badge
                            variant="secondary"
                            className="shrink-0"
                          >
                            esta tela
                          </Badge>
                        ) : null}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {tour.descricao}
                      </span>
                      <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground/80">
                        {tour.passos.length} passos
                        <IconPlayerPlay className="size-3" />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          Escolher uma tela em que você não está leva você até ela antes de
          começar. Dá para sair a qualquer momento com <kbd>Esc</kbd>.
        </p>
      </DialogContent>
    </Dialog>
  );
}
