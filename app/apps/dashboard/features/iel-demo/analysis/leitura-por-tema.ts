/**
 * A leitura da pessoa por tema, sem empresa nenhuma do outro lado.
 *
 * A pergunta que motivou isto (dono do produto, 20/09): "no requisito de
 * inovação a pessoa se considera boa, ruim, apta… na visão de quem?". A
 * resposta do produto é que ninguém se considera nada: a pessoa respondeu
 * frases sobre **como prefere trabalhar**, e a leitura diz para que lado ela
 * pende em cada tema — na visão dela, porque foi ela quem respondeu.
 *
 * O que já existia era a comparação com uma empresa (`adherence.ts`). Aqui
 * é só um lado: os dez temas, a média dela em cada um e a frase pronta que
 * a devolutiva pessoal já usa (`leitura-pessoal.ts`). Nada é reescrito — a
 * frase que a analista lê é a mesma que a pessoa recebeu ao terminar o
 * questionário, então os dois veem a mesma coisa.
 *
 * O que isto **não** é (PRODUTO.md §11): não é nota, não é "perfil", não é
 * tipo de personalidade e não classifica ninguém como bom, ruim ou apto. O
 * vocabulário é de **tendência**: "tende a experimentar cedo", "no
 * meio-termo", "prefere o que já foi testado". Nenhum lado é melhor, e a
 * ordem dos temas é a de `FIT_AXES` — nada ordena a pessoa por "melhor
 * tema".
 *
 * Determinística e pura: as mesmas respostas produzem a mesma leitura.
 */

import type { FitAxisId } from './fit-axes';
import { ESCALA_NEUTRO, type ValorDaEscala } from './instrumento';
import {
  DISTANCIA_MINIMA_DO_TRACO,
  fraseDoTraco,
  mediasPorTema
} from './leitura-pessoal';

/**
 * Para que lado a pessoa pende num tema. `meio` é resposta válida — "depende
 * do dia" — e não vira lado forçado.
 */
export type LadoDaLeitura = 'alto' | 'meio' | 'baixo';

export type LeituraDoTema = {
  tema: FitAxisId;
  /** 1..5 no sentido do tema (`alinharAoPolo`). */
  media: number;
  lado: LadoDaLeitura;
  /**
   * Quanto a resposta marca, de 0 (bem no meio) a 1 (no extremo da escala):
   * |media − 3| / 2. Serve ao desenho, nunca a uma ordenação de pessoas.
   */
  forca: number;
  /** Quantas frases do tema a pessoa respondeu. */
  frases: number;
  /**
   * A frase pronta, em primeira pessoa, da devolutiva que a própria pessoa
   * recebeu. No meio-termo, a nuance.
   */
  frase: string;
};

/**
 * Metade da escala: a maior distância possível do meio (3 → 1 ou 3 → 5).
 * É o denominador de `forca`.
 */
const DISTANCIA_MAXIMA = 2;

/**
 * A partir de que força a tendência é dita como tal.
 *
 * Distância 1 do meio (média 4 ou 2, "concordo"/"discordo") é força 0,5:
 * daí para cima a pessoa "tende a". Entre a nuance (`DISTANCIA_MINIMA_DO_
 * TRACO`, 0,5 de distância) e isso, ela "pende um pouco". As faixas são as
 * mesmas da devolutiva pessoal, para as duas telas não discordarem.
 */
export const FORCA_MINIMA_DA_TENDENCIA = 1 / DISTANCIA_MAXIMA;

/**
 * A palavra do badge, decidida pela força e não pelo lado: o lado já está
 * na frase e no marcador do trilho. "Tende a" e "pende um pouco" são
 * vocabulário de direção, não de qualidade — é para onde ela pende, nas
 * palavras dela.
 */
export function rotuloDaTendencia(leitura: LeituraDoTema): string {
  if (leitura.lado === 'meio') return 'No meio-termo';
  return leitura.forca >= FORCA_MINIMA_DA_TENDENCIA
    ? 'Tende a'
    : 'Pende um pouco';
}

/** A nuance, em terceira pessoa: é a analista quem lê esta tela. */
export const FRASE_DO_MEIO =
  'Ficou no meio-termo neste tema — nem sempre é de um jeito só, e tudo bem.';

/**
 * A leitura por tema, só dos temas com pelo menos uma frase respondida.
 *
 * Tema sem resposta fica de fora: ausência nunca vira zero nem "meio". A
 * média e o lado vêm de `mediasPorTema`, a mesma conta da devolutiva pessoal;
 * o corte entre meio e lado é `DISTANCIA_MINIMA_DO_TRACO`, também de lá.
 */
export function leituraPorTema(
  respostas: Record<string, ValorDaEscala>
): LeituraDoTema[] {
  return mediasPorTema(respostas).map((entrada) => {
    const noMeio = entrada.distancia <= DISTANCIA_MINIMA_DO_TRACO;
    const lado: LadoDaLeitura = noMeio ? 'meio' : entrada.lado;
    return {
      tema: entrada.tema,
      media: entrada.media,
      lado,
      forca: Math.min(1, entrada.distancia / DISTANCIA_MAXIMA),
      frases: entrada.frases,
      frase: noMeio
        ? FRASE_DO_MEIO
        : fraseDoTraco(entrada.tema, entrada.lado, 'candidato')
    };
  });
}

/** O meio da escala, para o trilho marcar onde "tanto faz" fica. */
export const MEIO_DA_ESCALA = ESCALA_NEUTRO;
