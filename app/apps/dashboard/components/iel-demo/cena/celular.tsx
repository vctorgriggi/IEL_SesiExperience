'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import { IconAntennaBars5, IconBattery3, IconWifi } from '@tabler/icons-react';

/**
 * O celular desenhado no palco.
 *
 * As medidas são fixas em pixels de projeto — a tela tem 390 de largura,
 * como as telas por link do produto foram desenhadas — e o aparelho inteiro
 * é reduzido por `transform: scale` para caber na janela. Assim o conteúdo
 * (inclusive o questionário real, no terceiro ato) é sempre desenhado em
 * 390 px e nunca precisa saber em que telão está.
 */
export const LARGURA_DA_TELA = 390;
export const ALTURA_DA_TELA = 820;
const MOLDURA = 10;
export const LARGURA_DO_CELULAR = LARGURA_DA_TELA + MOLDURA * 2;
export const ALTURA_DO_CELULAR = ALTURA_DA_TELA + MOLDURA * 2;

/** A hora da cena. Uma manhã de dia útil, como a candidatura do Jonas. */
const HORA = '09:14';

/**
 * Quanto da janela fica para o que está em volta do celular: cabeçalho,
 * legenda e barra de progresso. No telão a legenda fica ao lado; no celular
 * de verdade ela vai para cima, e o aparelho desenhado encolhe para caber.
 */
function reservaDaJanela(): { largura: number; altura: number } {
  return window.innerWidth >= 1024
    ? { largura: 48, altura: 170 }
    : { largura: 24, altura: 270 };
}

function calcularEscala(): number {
  const reserva = reservaDaJanela();
  return Math.min(
    1,
    (window.innerHeight - reserva.altura) / ALTURA_DO_CELULAR,
    (window.innerWidth - reserva.largura) / LARGURA_DO_CELULAR
  );
}

function assinarRedimensionamento(notificar: () => void): () => void {
  window.addEventListener('resize', notificar);
  return () => window.removeEventListener('resize', notificar);
}

/**
 * A escala do celular para a janela atual. No servidor é 1; no cliente o
 * valor certo entra antes da primeira pintura, sem estado nem efeito.
 */
export function useEscalaDoCelular(): number {
  return useSyncExternalStore(
    assinarRedimensionamento,
    calcularEscala,
    () => 1
  );
}

export type Ponto = { x: number; y: number };

/**
 * O centro de um elemento em coordenadas da tela do celular (390×820).
 *
 * O aparelho está reduzido por `transform`, então o retângulo que o
 * navegador devolve já vem na escala do telão; a largura da própria tela
 * diz por quanto dividir. É assim que o dedo acha o botão sem ninguém
 * escrever coordenada à mão.
 */
export function centroNaTela(elemento: HTMLElement): Ponto | null {
  const tela = elemento.closest<HTMLElement>('[data-cena-celular]');
  if (!tela) return null;
  const areaDaTela = tela.getBoundingClientRect();
  const escala = areaDaTela.width / LARGURA_DA_TELA || 1;
  const area = elemento.getBoundingClientRect();
  return {
    x: (area.left + area.width / 2 - areaDaTela.left) / escala,
    y: (area.top + area.height / 2 - areaDaTela.top) / escala
  };
}

/**
 * A moldura: cantos redondos, botões laterais, ilha no topo e a barra de
 * status com a hora. Tudo o que aparece dentro chega por `children`,
 * desenhado em 390×820 e posicionado por cima (`absolute inset-0`).
 */
export function Celular({
  escala,
  children
}: {
  escala: number;
  children: ReactNode;
}) {
  return (
    <div
      className="relative shrink-0"
      style={{
        width: LARGURA_DO_CELULAR * escala,
        height: ALTURA_DO_CELULAR * escala
      }}
    >
      <div
        className="absolute top-0 left-0 rounded-[56px] bg-sidebar-accent p-[10px] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)] ring-1 ring-sidebar-border"
        style={{
          width: LARGURA_DO_CELULAR,
          height: ALTURA_DO_CELULAR,
          transform: `scale(${escala})`,
          transformOrigin: 'top left'
        }}
      >
        {/* Botões laterais: volume à esquerda, ligar à direita. */}
        <span
          aria-hidden="true"
          className="absolute top-[150px] -left-[3px] h-9 w-[3px] rounded-l-sm bg-sidebar-border"
        />
        <span
          aria-hidden="true"
          className="absolute top-[200px] -left-[3px] h-14 w-[3px] rounded-l-sm bg-sidebar-border"
        />
        <span
          aria-hidden="true"
          className="absolute top-[180px] -right-[3px] h-20 w-[3px] rounded-r-sm bg-sidebar-border"
        />

        {/*
         * A tela volta ao tema claro: o palco em volta é o negativo da marca
         * (tokens da barra), e o que aparece no celular é o produto como o
         * candidato vê — fundo marfim, cartão branco.
         */}
        <div
          data-iel-theme=""
          data-cena-celular=""
          className="relative size-full overflow-hidden rounded-[46px] bg-background text-foreground"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-30 flex h-12 items-center justify-between px-7 text-[13px] font-semibold"
          >
            <span>{HORA}</span>
            <span className="absolute top-3 left-1/2 h-6 w-24 -translate-x-1/2 rounded-full bg-sidebar" />
            <span className="flex items-center gap-1">
              <IconAntennaBars5 className="size-4" />
              <IconWifi className="size-4" />
              <IconBattery3 className="size-4" />
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
