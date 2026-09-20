'use client';

/**
 * O motor do tour: transforma um `TourDeTela` em passos do driver.js.
 *
 * driver.js foi escolhido por três razões práticas: licença MIT (o intro.js
 * é AGPL/comercial), zero dependências e nenhum vínculo com a versão do React
 * — o `react-joyride` ainda declara React 18 como par, e este app está em 19.
 *
 * Duas regras de robustez moram aqui, e não no registro:
 *
 * 1. **Passo cujo alvo não existe é descartado**, não quebra o tour. Telas
 *    mudam, cartões somem em estado vazio, e um tour que estoura porque um
 *    seletor sumiu é pior do que um tour com um passo a menos.
 * 2. **Começar em outra tela espera a tela chegar.** O diálogo navega e este
 *    módulo só dirige quando o primeiro alvo aparece no DOM.
 */
import { useCallback, useEffect, useRef } from 'react';
import { driver, type Driver, type DriveStep } from 'driver.js';

import type { TourDeTela } from './types';

/** Quanto se espera pelo primeiro alvo depois de trocar de tela. */
const ESPERA_MAXIMA_MS = 4000;
const INTERVALO_DE_TENTATIVA_MS = 80;

function passosVisiveis(tour: TourDeTela): DriveStep[] {
  return tour.passos
    .filter(
      (passo) =>
        !passo.seletor || document.querySelector(passo.seletor) !== null
    )
    .map((passo) => ({
      element: passo.seletor,
      popover: {
        title: passo.titulo,
        description: passo.texto,
        side: passo.lado ?? 'bottom',
        align: passo.alinhamento ?? 'start'
      }
    }));
}

/**
 * Espera o primeiro alvo com seletor aparecer.
 *
 * Um tour cujo primeiro passo não tem alvo (é a abertura, centralizada) não
 * espera nada: ele pode abrir antes de a tela terminar de montar.
 */
function esperarPrimeiroAlvo(tour: TourDeTela): Promise<void> {
  const primeiro = tour.passos.find((passo) => passo.seletor)?.seletor;
  if (!primeiro) return Promise.resolve();

  return new Promise((resolve) => {
    const limite = Date.now() + ESPERA_MAXIMA_MS;
    const tentar = () => {
      if (document.querySelector(primeiro) || Date.now() > limite) {
        resolve();
        return;
      }
      window.setTimeout(tentar, INTERVALO_DE_TENTATIVA_MS);
    };
    tentar();
  });
}

export function useDriverDoTour() {
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
      await esperarPrimeiroAlvo(tour);

      const steps = passosVisiveis(tour);
      if (steps.length === 0) return;

      const instancia = driver({
        steps,
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
        onDestroyed: () => {
          driverRef.current = null;
        }
      });

      driverRef.current = instancia;
      instancia.drive();
    },
    [encerrar]
  );

  return { dirigir, encerrar };
}
