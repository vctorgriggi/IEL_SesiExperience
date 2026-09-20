'use client';

/**
 * O tour, a partir do cabeçalho.
 *
 * Um botão na barra de 48px abre um diálogo com uma opção por tela. Escolher
 * a tela em que já se está começa na hora; escolher outra navega até ela e
 * começa quando ela chega — por isso este componente vive no cabeçalho, que
 * é o que sobrevive à troca de rota dentro da casca.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { IconCompass, IconPlayerPlay } from '@tabler/icons-react';

import 'driver.js/dist/driver.css';

import { tourDaRota, TOURS } from '@/features/iel-demo/tour/tours';
import type { TourDeTela } from '@/features/iel-demo/tour/types';
import { useDriverDoTour } from '@/features/iel-demo/tour/use-tour';

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

function estaNaTela(tour: TourDeTela, pathname: string): boolean {
  return tour.casaCom ? tour.casaCom(pathname) : tour.rota === pathname;
}

export function TourMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const { dirigir } = useDriverDoTour();

  /** Tour escolhido em outra tela, esperando a rota chegar. */
  const pendenteRef = useRef<TourDeTela | null>(null);

  const tourDestaTela = tourDaRota(pathname);

  const escolher = useCallback(
    (tour: TourDeTela) => {
      setAberto(false);
      if (estaNaTela(tour, pathname)) {
        void dirigir(tour);
        return;
      }
      pendenteRef.current = tour;
      router.push(tour.rota);
    },
    [dirigir, pathname, router]
  );

  // A rota mudou: se era a que o tour pendente esperava, começa.
  useEffect(() => {
    const pendente = pendenteRef.current;
    if (!pendente || !estaNaTela(pendente, pathname)) return;
    pendenteRef.current = null;
    void dirigir(pendente);
  }, [dirigir, pathname]);

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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tour guiado</DialogTitle>
          <DialogDescription>
            Escolha uma tela. O tour aponta o que cada bloco responde, na ordem
            em que se lê.
          </DialogDescription>
        </DialogHeader>
        <ul className="-mx-1 max-h-[60vh] space-y-1 overflow-y-auto px-1">
          {TOURS.map((tour) => {
            const Icone = tour.icone;
            const atual = tourDestaTela?.id === tour.id;
            return (
              <li key={tour.id}>
                <button
                  type="button"
                  onClick={() => escolher(tour)}
                  className="group flex w-full items-center gap-3 rounded-lg border border-transparent p-3 text-left transition-colors hover:border-border hover:bg-muted/60 focus-visible:border-border focus-visible:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-background">
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
                    <span className="block truncate text-xs text-muted-foreground">
                      {tour.descricao}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    {tour.passos.length} passos
                    <IconPlayerPlay className="size-3.5" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted-foreground">
          Escolher uma tela em que você não está leva você até ela antes de
          começar. Dá para sair a qualquer momento com <kbd>Esc</kbd>.
        </p>
      </DialogContent>
    </Dialog>
  );
}
