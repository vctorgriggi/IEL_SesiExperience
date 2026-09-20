'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

/**
 * Leitura em voz alta das falas do IEL, pelo sintetizador do próprio aparelho.
 *
 * `window.speechSynthesis` já vem no navegador do celular: não há serviço
 * cobrado por uso (R7), nada sai do aparelho e nada é gravado. É só leitura —
 * a conversa não escuta a pessoa, porque gravar voz seria coletar um dado
 * (a voz) que a finalidade não pede (LGPD, art. 6º, III).
 *
 * Sem a API, `disponivel` é falso e a interface esconde os botões: um botão
 * "Ouvir" que não toca nada é pior do que nenhum.
 */

function semAssinatura(): () => void {
  return () => undefined;
}

function temSintetizador(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance === 'function'
  );
}

/** Verdadeiro só no navegador, depois da hidratação. */
export function useMontado(): boolean {
  return useSyncExternalStore(
    semAssinatura,
    () => true,
    () => false
  );
}

function assinarMovimento(aviso: () => void): () => void {
  const consulta = window.matchMedia('(prefers-reduced-motion: reduce)');
  consulta.addEventListener('change', aviso);
  return () => consulta.removeEventListener('change', aviso);
}

/** `prefers-reduced-motion: reduce` — sem animação e sem espera. */
export function useMovimentoReduzido(): boolean {
  return useSyncExternalStore(
    assinarMovimento,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false
  );
}

function vozPtBr(): SpeechSynthesisVoice | null {
  const vozes = window.speechSynthesis.getVoices();
  return (
    vozes.find((voz) => voz.lang === 'pt-BR') ??
    vozes.find((voz) => voz.lang.toLowerCase().startsWith('pt')) ??
    null
  );
}

export type Voz = {
  disponivel: boolean;
  /** Id da fala que está tocando agora, ou `null`. */
  falandoId: string | null;
  /**
   * Lê um texto. Com `fila`, entra depois do que já está tocando ("Ouvir
   * tudo"); sem, interrompe o que estiver tocando (botão da bolha).
   */
  falar: (id: string, texto: string, opcoes?: { fila?: boolean }) => void;
  parar: () => void;
};

export function useVoz(): Voz {
  const disponivel = useSyncExternalStore(
    semAssinatura,
    temSintetizador,
    () => false
  );
  const [falandoId, setFalandoId] = useState<string | null>(null);

  const parar = useCallback(() => {
    if (!temSintetizador()) return;
    window.speechSynthesis.cancel();
    setFalandoId(null);
  }, []);

  const falar = useCallback(
    (id: string, texto: string, opcoes?: { fila?: boolean }) => {
      if (!temSintetizador()) return;
      const sintetizador = window.speechSynthesis;
      if (!opcoes?.fila) sintetizador.cancel();

      const fala = new window.SpeechSynthesisUtterance(texto);
      fala.lang = 'pt-BR';
      fala.rate = 0.95;
      const voz = vozPtBr();
      if (voz) fala.voice = voz;

      fala.onstart = () => setFalandoId(id);
      const terminou = () =>
        setFalandoId((atual) => (atual === id ? null : atual));
      fala.onend = terminou;
      fala.onerror = terminou;

      if (!opcoes?.fila) setFalandoId(id);
      sintetizador.speak(fala);
    },
    []
  );

  // Sair da tela cala o aparelho: a leitura não pode continuar sozinha na
  // aba seguinte.
  useEffect(() => {
    return () => {
      if (temSintetizador()) window.speechSynthesis.cancel();
    };
  }, []);

  return { disponivel, falandoId, falar, parar };
}
