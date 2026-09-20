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
   * componente, que pode nem acontecer no meio do tour.
   */
  const navegar = useCallback(
    (rota: string) =>
      new Promise<void>((resolve) => {
        router.push(rota);
        const limite = Date.now() + ESPERA_DA_ROTA_MS;
        const conferir = () => {
          if (window.location.pathname === rota || Date.now() > limite) {
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
