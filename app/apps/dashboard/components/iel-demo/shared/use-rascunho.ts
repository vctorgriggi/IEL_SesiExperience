'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * O que a pessoa já respondeu, guardado no navegador dela, para ela poder
 * fechar e voltar.
 *
 * Nos fluxos por link não há login: quem fecha o navegador na frase 7 de 16
 * não tem conta para onde voltar, e até aqui perdia tudo. O colaborador
 * responde no intervalo do turno e o candidato responde no celular, no meio
 * da rua — fechar no meio é o caso comum, não a exceção, e cada abandono é
 * uma resposta que o perfil da empresa não recebe.
 *
 * ## Por que o navegador, e não o estado da demonstração
 *
 * Um rascunho não é uma resposta. O estado da demonstração só recebe o que
 * foi enviado (`answer-fit-questionnaire`, `answer-culture-invite`), porque é
 * isso que conta como tratamento de dado com aceite registrado. O que está
 * pela metade fica onde a pessoa está — no aparelho dela —, some quando ela
 * envia e nunca chega a ser gravado se ela desistir antes do aceite.
 *
 * ## Cuidados
 *
 * A leitura acontece num efeito, nunca durante a renderização: o servidor não
 * tem `localStorage` e um rascunho lido cedo demais quebraria a hidratação.
 * Aba anônima, cota cheia ou armazenamento bloqueado derrubam o `localStorage`
 * com exceção — daí todo acesso ficar dentro de `try`. Sem rascunho, o fluxo
 * simplesmente começa do zero, que é o que acontecia antes.
 */
export type Rascunho<T> = {
  /**
   * Falso até o navegador ser consultado. Quem grava espera por ele: gravar
   * antes da leitura apagaria o rascunho com o estado vazio da montagem.
   */
  restaurado: boolean;
  gravar: (valor: T) => void;
  apagar: () => void;
};

export function useRascunho<T>({
  chave,
  ler,
  aoRestaurar
}: {
  /** Uma chave por link: candidatura ou token de convite. */
  chave: string;
  /**
   * Valida o que veio do navegador e devolve `null` quando o rascunho não
   * serve mais — outro texto de aceite, outras frases, valor fora da escala.
   * Rascunho velho é lixo, não dado.
   */
  ler: (bruto: unknown) => T | null;
  aoRestaurar: (valor: T) => void;
}): Rascunho<T> {
  const [restaurado, setRestaurado] = useState(false);

  // As funções mudam a cada renderização e não são motivo para reler o
  // rascunho. Este efeito vem antes do de leitura, então na montagem os
  // valores já estão nas caixas quando a leitura acontece.
  const lerRef = useRef(ler);
  const aoRestaurarRef = useRef(aoRestaurar);
  useEffect(() => {
    lerRef.current = ler;
    aoRestaurarRef.current = aoRestaurar;
  });

  useEffect(() => {
    let bruto: string | null = null;
    try {
      bruto = window.localStorage.getItem(chave);
    } catch {
      bruto = null;
    }

    if (bruto) {
      try {
        const valor = lerRef.current(JSON.parse(bruto));
        if (valor !== null) aoRestaurarRef.current(valor);
      } catch {
        // Rascunho ilegível: começa do zero, sem barulho na tela.
      }
    }
    setRestaurado(true);
  }, [chave]);

  const gravar = useCallback(
    (valor: T) => {
      try {
        window.localStorage.setItem(chave, JSON.stringify(valor));
      } catch {
        // Sem espaço ou sem permissão: o fluxo continua, só não retoma.
      }
    },
    [chave]
  );

  const apagar = useCallback(() => {
    try {
      window.localStorage.removeItem(chave);
    } catch {
      // Idem.
    }
  }, [chave]);

  return { restaurado, gravar, apagar };
}
