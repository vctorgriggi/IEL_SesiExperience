/**
 * O roteiro da cena do candidato: três atos, cada um em passos cronometrados.
 *
 * A cena é uma história contada no telão, então o tempo é decisão de
 * direção e mora aqui, num lugar só — não espalhado em `setTimeout` pelas
 * telas. Cada ato é uma lista de durações em milissegundos: o passo `n`
 * dura `ROTEIRO[ato][n]` e então o próximo entra; `null` é "fica até alguém
 * avançar", que é o caso do questionário real no fim.
 */

export type Ato = 1 | 2 | 3;

export type Momento = { ato: Ato; passo: number };

export const ROTEIRO: Record<Ato, ReadonlyArray<number | null>> = {
  /*
   * Ato 1 — o portal.
   *   0  a vaga aparece na tela
   *   1  o dedo desce até "Candidatar-se"
   *   2  o botão afunda
   *   3  o check, "Candidatura enviada", e um respiro para ler
   */
  1: [900, 1000, 250, 2600],
  /*
   * Ato 2 — a mensagem chega.
   *   0  o app de mensagens, ainda vazio
   *   1  a notificação desce do topo
   *   2  a notificação recolhe; "digitando…"
   *   3  a bolha com a mensagem do IEL, e tempo para ler
   */
  2: [500, 2200, 1600, 7000],
  /*
   * Ato 3 — abre o questionário.
   *   0  o dedo vai até o link
   *   1  o toque: a bolha pulsa
   *   2  a conversa se desfaz em blur; "abrindo"
   *   3  o questionário real, e daqui quem apresenta responde
   */
  3: [1100, 500, 1100, null]
};

export const ULTIMO_ATO: Ato = 3;

/**
 * Uma frase por ato, fora do celular. É a narração; ela conta a história.
 *
 * Os dois primeiros atos são fixos. O terceiro conta quantas frases esta
 * pessoa ainda responde, e esse número **não** é constante: a empresa
 * escolhe de 3 a 11 competências, e o que a pessoa já respondeu em outra
 * vaga é reaproveitado. Por isso ele é calculado por candidatura, no
 * servidor, e chega aqui — escrever "7 frases" no código seria uma legenda
 * que mente no dia seguinte.
 */
const LEGENDAS_FIXAS: Record<1 | 2, string> = {
  1: 'Jonas se candidata pelo portal a uma vaga de assistente de suporte e testes.',
  2: 'O IEL manda o convite. A empresa não aparece.'
};

export function legendaDoAto(ato: Ato, frasesQueFaltam: number): string {
  if (ato !== 3) return LEGENDAS_FIXAS[ato];
  // Tudo reaproveitado: não há frase para responder, e a legenda diz isso em
  // vez de anunciar "0 frases".
  if (frasesQueFaltam < 1) return 'Sem senha, sem cadastro: é só confirmar.';
  return `Sem senha, sem cadastro: ${contagemDeFrases(frasesQueFaltam)} no celular.`;
}

/** "1 frase", "8 frases". */
export function contagemDeFrases(quantas: number): string {
  return `${quantas} ${quantas === 1 ? 'frase' : 'frases'}`;
}

/** O nome de cada ato na barra de progresso. */
export const NOMES_DOS_ATOS: Record<Ato, string> = {
  1: 'Portal',
  2: 'Mensagem',
  3: 'Questionário'
};

export const MOMENTO_INICIAL: Momento = { ato: 1, passo: 0 };

/** O último passo do ato: onde o ato "descansa". */
export function ultimoPasso(ato: Ato): number {
  return ROTEIRO[ato].length - 1;
}

/** Quanto dura o ato inteiro, somando os passos cronometrados. */
export function duracaoDoAto(ato: Ato): number {
  return ROTEIRO[ato].reduce<number>((soma, d) => soma + (d ?? 0), 0);
}

/** O que vem depois deste momento quando o relógio anda sozinho. */
export function momentoSeguinte(momento: Momento): Momento {
  const { ato, passo } = momento;
  if (passo < ultimoPasso(ato)) return { ato, passo: passo + 1 };
  if (ato < ULTIMO_ATO) return { ato: (ato + 1) as Ato, passo: 0 };
  return momento;
}

/** A tecla "→": pula para o começo do próximo ato; no último, vai ao fim. */
export function avancarAto(momento: Momento): Momento {
  if (momento.ato < ULTIMO_ATO) {
    return { ato: (momento.ato + 1) as Ato, passo: 0 };
  }
  return { ato: ULTIMO_ATO, passo: ultimoPasso(ULTIMO_ATO) };
}

/** A tecla "←": volta ao começo do ato anterior (ou deste, se for o primeiro). */
export function voltarAto(momento: Momento): Momento {
  return { ato: momento.ato > 1 ? ((momento.ato - 1) as Ato) : 1, passo: 0 };
}
