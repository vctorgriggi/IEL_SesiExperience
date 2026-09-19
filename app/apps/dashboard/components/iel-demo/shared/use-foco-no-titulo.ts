'use client';

import { useEffect, useRef } from 'react';

/**
 * Leva o foco para o título quando a tela troca de passo sem trocar de URL.
 *
 * Nos fluxos por link (aceite → pergunta 1 → … → pronto), o botão tocado
 * some junto com o passo. Sem um destino, o TalkBack e o VoiceOver voltam
 * para o topo da página e a pessoa perde onde estava. O título recebe o foco
 * (com `tabIndex={-1}`), o leitor anuncia a pergunta nova e a leitura segue
 * na ordem da tela.
 *
 * Na primeira renderização o foco não se move: quem acabou de abrir o link
 * ouve a página do começo, como qualquer página.
 */
export function useFocoNoTitulo<T extends HTMLElement>(chave: string) {
  const ref = useRef<T>(null);
  // Compara com a chave anterior em vez de contar renderizações: o modo
  // estrito roda o efeito duas vezes na montagem, e isso não é troca de passo.
  const anteriorRef = useRef(chave);

  useEffect(() => {
    if (anteriorRef.current === chave) return;
    anteriorRef.current = chave;
    ref.current?.focus();
  }, [chave]);

  return ref;
}
