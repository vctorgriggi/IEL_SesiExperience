'use client';

/**
 * O motor do tour: transforma um `TourDeTela` em passos do driver.js.
 *
 * driver.js foi escolhido por três razões práticas: licença MIT (o intro.js
 * é AGPL/comercial), zero dependências e nenhum vínculo com a versão do React
 * — o `react-joyride` ainda declara React 18 como par, e este app está em 19.
 *
 * Três regras de robustez moram aqui, e não no registro:
 *
 * 1. **Passo cujo alvo não existe é descartado**, não quebra o tour — mas só
 *    quando ele é da tela em que já se está. Passo de outra tela não pode ser
 *    descartado por ausência: o alvo dele ainda não existe porque a tela não
 *    chegou.
 * 2. **Passo pode trocar de tela.** Quando o próximo passo mora em outra
 *    rota, o motor navega, espera o alvo aparecer e só então avança. É o que
 *    permite um tour percorrer a jornada inteira em vez de uma tela só.
 * 3. **Começar em outra tela espera a tela chegar.**
 */
import { useCallback, useEffect, useRef } from 'react';
import { driver, type Driver, type DriveStep } from 'driver.js';

import type { PassoDoTour, TourDeTela } from './types';

/** Quanto se espera por um alvo depois de trocar de tela. */
const ESPERA_MAXIMA_MS = 5000;
const INTERVALO_DE_TENTATIVA_MS = 80;

/** Leva o navegador até `rota` e resolve quando a tela responde. */
export type Navegar = (rota: string) => void | Promise<void>;

function esperarAlvo(seletor: string | undefined): Promise<void> {
  if (!seletor) return Promise.resolve();
  return new Promise((resolve) => {
    const limite = Date.now() + ESPERA_MAXIMA_MS;
    const tentar = () => {
      if (document.querySelector(seletor) || Date.now() > limite) {
        resolve();
        return;
      }
      window.setTimeout(tentar, INTERVALO_DE_TENTATIVA_MS);
    };
    tentar();
  });
}

function rotaAtual(): string {
  return window.location.pathname;
}

/**
 * Os passos que entram no tour.
 *
 * Passo sem rota própria só entra se o alvo estiver no DOM agora. Passo com
 * rota entra sempre — o alvo dele nasce depois da navegação.
 */
function passosValidos(tour: TourDeTela): PassoDoTour[] {
  return tour.passos.filter((passo) => {
    if (passo.rota && passo.rota !== rotaAtual()) return true;
    return !passo.seletor || document.querySelector(passo.seletor) !== null;
  });
}

function paraDriveStep(passo: PassoDoTour): DriveStep {
  return {
    element: passo.seletor,
    popover: {
      title: passo.titulo,
      description: passo.texto,
      side: passo.lado ?? 'bottom',
      align: passo.alinhamento ?? 'start'
    }
  };
}

export function useDriverDoTour(navegar?: Navegar) {
  const driverRef = useRef<Driver | null>(null);

  const encerrar = useCallback(() => {
    driverRef.current?.destroy();
    driverRef.current = null;
  }, []);

  // Sair da tela no meio do tour não pode deixar o overlay preso na página.
  useEffect(() => encerrar, [encerrar]);

  const dirigir = useCallback(
    async (tour: TourDeTela) => {
      encerrar();

      const primeiro = tour.passos[0];
      if (primeiro?.rota && primeiro.rota !== rotaAtual() && navegar) {
        await navegar(primeiro.rota);
      }
      await esperarAlvo(tour.passos.find((p) => p.seletor && !p.rota)?.seletor);

      const passos = passosValidos(tour);
      if (passos.length === 0) return;

      /**
       * Leva o tour para `indice`, trocando de tela antes quando o passo mora
       * em outra rota.
       *
       * `refresh()` depois da navegação é obrigatório: o driver mede o recorte
       * do destaque uma vez, e a tela nova tem outra geometria.
       */
      const irPara = async (indice: number) => {
        const passo = passos[indice];
        const instancia = driverRef.current;
        if (!passo || !instancia) return;

        if (passo.rota && passo.rota !== rotaAtual() && navegar) {
          await navegar(passo.rota);
          await esperarAlvo(passo.seletor);
          instancia.refresh();
        }
        instancia.drive(indice);
      };

      const instancia = driver({
        steps: passos.map(paraDriveStep),
        showProgress: true,
        progressText: '{{current}} de {{total}}',
        nextBtnText: 'Próximo',
        prevBtnText: 'Voltar',
        doneBtnText: 'Fechar',
        allowClose: true,
        overlayOpacity: 0.6,
        stagePadding: 6,
        stageRadius: 8,
        popoverClass: 'tour-mind-rh',
        /*
         * O clique passa a ser nosso: o driver avançaria na hora, antes de a
         * outra tela existir, e o destaque cairia no vazio.
         */
        onNextClick: () => {
          const atual = driverRef.current?.getActiveIndex() ?? 0;
          if (atual >= passos.length - 1) {
            encerrar();
            return;
          }
          void irPara(atual + 1);
        },
        onPrevClick: () => {
          const atual = driverRef.current?.getActiveIndex() ?? 0;
          if (atual <= 0) return;
          void irPara(atual - 1);
        },
        onDestroyed: () => {
          driverRef.current = null;
        }
      });

      driverRef.current = instancia;
      instancia.drive();
    },
    [encerrar, navegar]
  );

  return { dirigir, encerrar };
}
