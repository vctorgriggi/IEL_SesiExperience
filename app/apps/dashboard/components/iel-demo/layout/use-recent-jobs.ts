'use client';

import { useSyncExternalStore } from 'react';

/**
 * As últimas vagas que a analista abriu, para a barra lateral.
 *
 * Com 2.500 vagas por mês, a barra não lista vaga nenhuma por empresa; ela
 * lembra as cinco em que a analista trabalhou por último, que é por onde o
 * dia dela recomeça. A lista vive no navegador de quem usa, separada do
 * estado da demonstração: é conveniência de tela, não dado do processo, e
 * reiniciar a demonstração não precisa apagá-la.
 */
const CHAVE = 'iel-demo-vagas-recentes';
const EVENTO = 'iel-demo-vagas-recentes';

export const RECENTES_NA_BARRA = 5;

const VAZIA: string[] = [];

let lidoBruto: string | null = null;
let lidoLista: string[] = VAZIA;

function ler(): string[] {
  let bruto: string | null = null;
  try {
    bruto = window.localStorage.getItem(CHAVE);
  } catch {
    // Janela privada ou armazenamento bloqueado: a barra mostra sugestões.
    return VAZIA;
  }
  // O snapshot precisa ser estável entre leituras iguais, ou o React
  // renderiza em laço.
  if (bruto === lidoBruto) return lidoLista;
  lidoBruto = bruto;
  try {
    const valor: unknown = bruto ? JSON.parse(bruto) : [];
    lidoLista = Array.isArray(valor)
      ? valor.filter((id): id is string => typeof id === 'string')
      : VAZIA;
  } catch {
    lidoLista = VAZIA;
  }
  return lidoLista;
}

function assinar(avisar: () => void): () => void {
  const aoMudar = (evento: Event) => {
    if (evento instanceof StorageEvent && evento.key !== CHAVE) return;
    avisar();
  };
  window.addEventListener(EVENTO, aoMudar);
  window.addEventListener('storage', aoMudar);
  return () => {
    window.removeEventListener(EVENTO, aoMudar);
    window.removeEventListener('storage', aoMudar);
  };
}

/**
 * Põe a vaga no topo das recentes. Chamada pela tela da vaga ao montar.
 *
 * Guarda um pouco mais que as cinco da barra: o gestor só vê as vagas da
 * própria empresa, e o recorte acontece na leitura.
 */
export function registrarVagaRecente(jobId: string): void {
  const lista = [jobId, ...ler().filter((id) => id !== jobId)].slice(0, 20);
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(EVENTO));
}

/** Ids das vagas abertas por último, da mais recente para a mais antiga. */
export function useRecentJobs(): string[] {
  return useSyncExternalStore(assinar, ler, () => VAZIA);
}
