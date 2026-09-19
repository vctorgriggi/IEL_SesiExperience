/**
 * Projeta as respostas dos cinco eixos de `culture.ts` em duas dimensões.
 *
 * Não é um segundo modelo cultural: os quatro tipos nomeiam regiões do plano e
 * descrevem ambiente de trabalho, nunca traço de pessoa.
 *
 * O enunciado veda caixa-preta e corte automático. Daí sai a regra que ninguém
 * deve "simplificar" depois: eixo sem resposta fica fora da média — zero é o
 * centro do plano, e não respondeu não é ficar no meio.
 *
 * A proibição de percentual que este arquivo carregava foi revogada pelo
 * cliente em reunião (`docs/PRODUTO.md`, seção 6): "o fit tem que ter no mínimo
 * 35% de aderência para ser compatível". O percentual existe, mas com as
 * condições que vieram junto: o rótulo é sempre "aderência", nunca "chance de
 * sucesso"; o denominador aparece; e o número é explicável até o eixo, para o
 * analista ver por que deu 41% e não 72%. O corte marca, não elimina.
 */

import { getCultureOptionLabel, type CultureOptionId } from './culture';
import { getFitAxis, type FitAxisId } from './fit-axes';

export type RespostaDeEixo = {
  axisId: FitAxisId;
  optionId: CultureOptionId;
};

export type PosicaoCultural = {
  /** −1 pessoas … +1 entrega. */
  x: number;
  /** −1 estrutura … +1 flexibilidade. */
  y: number;
  eixosRespondidos: FitAxisId[];
};

export type TipoDeCultura =
  | 'colaborativa'
  | 'inovadora'
  | 'resultados'
  | 'estruturada';

export type ClassificacaoCultural = TipoDeCultura | 'sem-predominancia';

export const TIPO_DE_CULTURA_LABEL: Record<ClassificacaoCultural, string> = {
  colaborativa: 'Colaborativa',
  inovadora: 'Inovadora',
  resultados: 'Resultados',
  estruturada: 'Estruturada',
  'sem-predominancia': 'Sem predominância'
};

export const TIPO_DE_CULTURA_DESCRICAO: Record<ClassificacaoCultural, string> =
  {
    colaborativa:
      'Ambiente que apoia quem chega e combina o trabalho no dia a dia.',
    inovadora:
      'Ambiente que dá margem para organizar o próprio trabalho e lidar com o que muda.',
    resultados:
      'Ambiente que espera entrega com pouca supervisão e rotina já dominada.',
    estruturada:
      'Ambiente de processo definido, prioridade por escrito e rotina previsível.',
    'sem-predominancia':
      'As respostas não puxam para nenhuma região: o ambiente combina traços de mais de uma.'
  };

export const EIXO_FOCO_LABEL = { negativo: 'Pessoas', positivo: 'Entrega' };
export const EIXO_RITMO_LABEL = {
  negativo: 'Estrutura',
  positivo: 'Flexibilidade'
};

/**
 * Alternativa por alternativa, o quanto ela empurra a posição. É a regra
 * inteira do mapa: com esta tabela qualquer ponto se refaz à mão.
 *
 * Acrescentar alternativa em `CULTURE_QUESTIONS` sem acrescentá-la aqui faz o
 * eixo deixar de contar; o teste desta pasta falha por isso de propósito.
 */
export const CONTRIBUICAO_POR_ALTERNATIVA: Record<
  FitAxisId,
  Record<CultureOptionId, { x: number; y: number }>
> = {
  'apoio-inicial': {
    'acompanhamento-formal': { x: -1, y: -0.5 },
    'troca-informal': { x: -0.5, y: 0.5 },
    'por-conta': { x: 0.5, y: 0.5 }
  },
  autonomia: {
    'rotina-definida': { x: 0, y: -1 },
    parcial: { x: 0, y: 0 },
    'autonomia-ampla': { x: 0.25, y: 1 }
  },
  'comunicacao-prioridades': {
    'por-escrito': { x: -0.25, y: -1 },
    'verbal-inicio': { x: -0.25, y: 0 },
    'ao-longo-do-dia': { x: 0.5, y: 0.75 }
  },
  'ritmo-turno': {
    fixo: { x: -0.25, y: -1 },
    'variacao-prevista': { x: 0, y: 0 },
    'variacao-frequente': { x: 0.75, y: 0.75 }
  },
  aprendizado: {
    'rotina-propria': { x: -0.25, y: -0.75 },
    'processos-amplos': { x: -0.75, y: 0.5 },
    'ja-domina': { x: 1, y: 0 }
  }
};

/**
 * Sem esta zona morta, um ponto em (0.01, −0.01) sairia rotulado como
 * "Estruturada" e a tela afirmaria algo que as respostas não sustentam.
 */
export const LIMITE_SEM_PREDOMINANCIA = 0.2;

export function calcularPosicaoCultural(
  respostas: RespostaDeEixo[]
): PosicaoCultural | null {
  const validas = respostas.filter(
    (resposta) =>
      CONTRIBUICAO_POR_ALTERNATIVA[resposta.axisId]?.[resposta.optionId]
  );
  if (validas.length === 0) return null;

  let somaX = 0;
  let somaY = 0;
  for (const resposta of validas) {
    const contribuicao =
      CONTRIBUICAO_POR_ALTERNATIVA[resposta.axisId]![resposta.optionId]!;
    somaX += contribuicao.x;
    somaY += contribuicao.y;
  }

  return {
    x: somaX / validas.length,
    y: somaY / validas.length,
    eixosRespondidos: validas.map((resposta) => resposta.axisId)
  };
}

export function classificarCultura(
  posicao: PosicaoCultural
): ClassificacaoCultural {
  if (
    Math.abs(posicao.x) < LIMITE_SEM_PREDOMINANCIA &&
    Math.abs(posicao.y) < LIMITE_SEM_PREDOMINANCIA
  ) {
    return 'sem-predominancia';
  }

  // Empate no eixo de foco resolve para o lado de pessoas: um ponto sem lean
  // declarado não pode sair rotulado como ambiente de cobrança de entrega.
  if (posicao.y >= 0) return posicao.x <= 0 ? 'colaborativa' : 'inovadora';
  return posicao.x <= 0 ? 'estruturada' : 'resultados';
}

export type FaixaDeEncaixe =
  | 'muito-proximo'
  | 'proximo'
  | 'alguma-distancia'
  | 'distante';

/**
 * Faixas por distância no plano. Servem à geometria do mapa — o raio dos anéis
 * de proximidade desenhados em volta da empresa.
 *
 * Não use isto para rotular uma pessoa na lista: a distância mede a posição
 * média de cada lado sobre *todos* os eixos que aquele lado respondeu, e a
 * aderência mede eixo a eixo sobre os eixos que os *dois* responderam. São
 * denominadores diferentes, então discordam. Para rotular, use
 * `faixaDeAderencia`.
 */
export const FAIXAS_DE_ENCAIXE: { faixa: FaixaDeEncaixe; ate: number }[] = [
  { faixa: 'muito-proximo', ate: 0.5 },
  { faixa: 'proximo', ate: 1 },
  { faixa: 'alguma-distancia', ate: 1.6 },
  { faixa: 'distante', ate: Number.POSITIVE_INFINITY }
];

export const FAIXA_DE_ENCAIXE_LABEL: Record<FaixaDeEncaixe, string> = {
  'muito-proximo': 'Muito próximo',
  proximo: 'Próximo',
  'alguma-distancia': 'Alguma distância',
  distante: 'Distante'
};

export const FAIXA_DE_ENCAIXE_NOTA: Record<FaixaDeEncaixe, string> = {
  'muito-proximo':
    'As respostas dos dois lados descrevem praticamente o mesmo ambiente de trabalho.',
  proximo:
    'Os dois lados descrevem ambientes parecidos, com diferença em parte dos eixos.',
  'alguma-distancia':
    'Há diferença relevante entre o ambiente descrito pela empresa e o que a pessoa espera.',
  distante:
    'Os dois lados descrevem ambientes de trabalho bastante diferentes. Vale alinhar antes de seguir.'
};

/**
 * A mesma região do plano, dita dentro de uma frase corrida.
 *
 * `TIPO_DE_CULTURA_DESCRICAO` é uma sentença fechada e não encaixa em "a
 * empresa tende a um ambiente ___". Estas são as metades que encaixam.
 */
export const TIPO_DE_CULTURA_TENDENCIA: Record<ClassificacaoCultural, string> =
  {
    colaborativa: 'de apoio próximo, combinado no dia a dia',
    inovadora: 'de autonomia, com espaço para o que muda',
    resultados: 'de entrega e metas, com pouca supervisão',
    estruturada: 'de processo definido e rotina previsível',
    'sem-predominancia': 'sem uma tendência marcada'
  };

/**
 * O que fazer a respeito da distância — e nunca "descartar".
 *
 * O enunciado veda corte automático, então mesmo a faixa mais distante pede
 * conversa, não eliminação.
 */
export const FAIXA_DE_ENCAIXE_RECOMENDACAO: Record<FaixaDeEncaixe, string> = {
  'muito-proximo':
    'Não há expectativa de ambiente a alinhar antes da conversa.',
  proximo: 'Vale confirmar os pontos abaixo na conversa.',
  'alguma-distancia':
    'Não é impeditivo, mas vale alinhar expectativas de ambiente antes de seguir.',
  distante:
    'Vale alinhar expectativas de ambiente antes de encaminhar para a vaga.'
};

export type LeituraDeEixo = {
  axisId: FitAxisId;
  axisLabel: string;
  opcaoDoTalento: string;
  opcaoDaEmpresa: string;
  convergente: boolean;
};

export type EncaixeCultural = {
  distancia: number;
  faixa: FaixaDeEncaixe;
};

export function calcularEncaixeCultural(
  posicaoDoTalento: PosicaoCultural,
  posicaoDaEmpresa: PosicaoCultural
): EncaixeCultural {
  const distancia = Math.hypot(
    posicaoDoTalento.x - posicaoDaEmpresa.x,
    posicaoDoTalento.y - posicaoDaEmpresa.y
  );

  const faixa =
    FAIXAS_DE_ENCAIXE.find((entrada) => distancia <= entrada.ate)?.faixa ??
    'distante';

  return { distancia, faixa };
}

/**
 * A distância diz "longe"; só o eixo diz o que fazer a respeito. É esta lista,
 * e não a distância, que a tela lê em voz alta.
 */
export function compararRespostas(
  respostasDoTalento: RespostaDeEixo[],
  respostasDaEmpresa: RespostaDeEixo[]
): LeituraDeEixo[] {
  const leituras: LeituraDeEixo[] = [];

  for (const doTalento of respostasDoTalento) {
    const daEmpresa = respostasDaEmpresa.find(
      (resposta) => resposta.axisId === doTalento.axisId
    );
    if (!daEmpresa) continue;

    leituras.push({
      axisId: doTalento.axisId,
      axisLabel: getFitAxis(doTalento.axisId).label,
      opcaoDoTalento: getCultureOptionLabel(
        doTalento.axisId,
        doTalento.optionId
      ),
      opcaoDaEmpresa: getCultureOptionLabel(
        daEmpresa.axisId,
        daEmpresa.optionId
      ),
      convergente: doTalento.optionId === daEmpresa.optionId
    });
  }

  return leituras;
}

/**
 * Corte de compatibilidade, do cliente e não descoberto por modelo
 * (00:20:19). Marca "abaixo do corte" na tela; nunca elimina candidatura —
 * o enunciado veda corte automático, e quem decide continua sendo o analista.
 */
export const CORTE_DE_ADERENCIA = 0.35;

/**
 * A maior distância possível dentro de um eixo, usada como denominador da
 * aderência daquele eixo.
 *
 * Sem isso, eixos de amplitude diferente pesariam diferente sem ninguém ter
 * decidido isso: `autonomia` varia 2 unidades em y, `aprendizado` varia 1,75
 * em x. Normalizar por eixo faz "escolheu o oposto" valer 0% em todos.
 */
function amplitudeDoEixo(axisId: FitAxisId): number {
  const alternativas = Object.values(
    CONTRIBUICAO_POR_ALTERNATIVA[axisId] ?? {}
  );
  let maior = 0;

  for (const a of alternativas) {
    for (const b of alternativas) {
      maior = Math.max(maior, Math.hypot(a.x - b.x, a.y - b.y));
    }
  }

  return maior;
}

export type AderenciaDeEixo = {
  axisId: FitAxisId;
  axisLabel: string;
  /** 0 a 1. Quanto a alternativa da pessoa se aproxima da alternativa da empresa. */
  aderencia: number;
};

/**
 * Menos eixos que isto e o percentual não sustenta uma posição no ranking.
 *
 * Um eixo em comum vira 0% ou 100% e nada entre os dois: o número existe, mas
 * não distingue ninguém. Quem fica abaixo do piso continua na lista, no mapa e
 * clicável — apenas sem posição. Não ranquear não é descartar, e é o corte
 * automático que o enunciado veda que estaria em jogo se sumissem da tela.
 */
export const MINIMO_DE_EIXOS_PARA_RANQUEAR = 2;

export type Aderencia = {
  /** 0 a 1, média das aderências por eixo. */
  total: number;
  porEixo: AderenciaDeEixo[];
  /** O denominador que a tela precisa mostrar. */
  eixosComparados: number;
  compativel: boolean;
  /** Há eixos comuns suficientes para o número valer como posição. */
  baseSuficiente: boolean;
};

/**
 * Aderência entre os dois lados, eixo a eixo e no total.
 *
 * Eixo a eixo, e não pela distância entre os dois pontos do plano: a distância
 * já mistura os cinco eixos num número só, e aí ninguém consegue responder por
 * que deu 41%. Aqui cada eixo tem o seu percentual, e o total é a média simples
 * deles — dá para refazer a conta à mão.
 *
 * Eixo que só um lado respondeu fica fora, como em todo o resto do módulo.
 * Devolve `null` quando não sobrou eixo comparável: 0% diria "discordam", e o
 * que aconteceu foi não ter base para comparar.
 */
export function calcularAderencia(
  respostasDoTalento: RespostaDeEixo[],
  respostasDaEmpresa: RespostaDeEixo[],
  corte: number = CORTE_DE_ADERENCIA
): Aderencia | null {
  const porEixo: AderenciaDeEixo[] = [];

  for (const doTalento of respostasDoTalento) {
    const daEmpresa = respostasDaEmpresa.find(
      (resposta) => resposta.axisId === doTalento.axisId
    );
    if (!daEmpresa) continue;

    const alternativaDoTalento =
      CONTRIBUICAO_POR_ALTERNATIVA[doTalento.axisId]?.[doTalento.optionId];
    const alternativaDaEmpresa =
      CONTRIBUICAO_POR_ALTERNATIVA[daEmpresa.axisId]?.[daEmpresa.optionId];
    if (!alternativaDoTalento || !alternativaDaEmpresa) continue;

    const amplitude = amplitudeDoEixo(doTalento.axisId);
    const distancia = Math.hypot(
      alternativaDoTalento.x - alternativaDaEmpresa.x,
      alternativaDoTalento.y - alternativaDaEmpresa.y
    );

    porEixo.push({
      axisId: doTalento.axisId,
      axisLabel: getFitAxis(doTalento.axisId).label,
      aderencia: amplitude === 0 ? 1 : 1 - distancia / amplitude
    });
  }

  if (porEixo.length === 0) return null;

  const total =
    porEixo.reduce((soma, eixo) => soma + eixo.aderencia, 0) / porEixo.length;

  return {
    total,
    porEixo,
    eixosComparados: porEixo.length,
    compativel: total >= corte,
    baseSuficiente: porEixo.length >= MINIMO_DE_EIXOS_PARA_RANQUEAR
  };
}

/** O percentual como a tela escreve: inteiro, com o sinal. */
export function formatarAderencia(aderencia: number): string {
  return `${Math.round(aderencia * 100)}%`;
}

/**
 * A faixa nomeada que acompanha o percentual.
 *
 * Existe para que o rótulo e o número nunca se contradigam. Antes o rótulo vinha
 * da distância no plano e o número da aderência por eixo: duas contas com
 * denominadores diferentes, e a lista exibia "44% · Muito próximo" ao lado de
 * "44% · Alguma distância".
 *
 * O piso da faixa mais baixa é o corte do cliente: abaixo dele a leitura é
 * "distante", que é a mesma coisa que "abaixo do corte" dita em palavras.
 */
export const FAIXAS_DE_ADERENCIA: {
  faixa: FaixaDeEncaixe;
  aPartirDe: number;
}[] = [
  { faixa: 'muito-proximo', aPartirDe: 0.85 },
  { faixa: 'proximo', aPartirDe: 0.65 },
  { faixa: 'alguma-distancia', aPartirDe: CORTE_DE_ADERENCIA },
  { faixa: 'distante', aPartirDe: Number.NEGATIVE_INFINITY }
];

export function faixaDeAderencia(total: number): FaixaDeEncaixe {
  return (
    FAIXAS_DE_ADERENCIA.find((entrada) => total >= entrada.aPartirDe)?.faixa ??
    'distante'
  );
}

/**
 * O que a tela diz quando alguém pergunta "divergiu no quê?".
 *
 * A faixa sozinha ("Alguma distância") não responde isso: ela mede, não
 * explica. Este resumo junta as duas metades que respondem — a região do plano
 * onde cada lado caiu, e os eixos em que as respostas de fato diferiram.
 *
 * Devolve fatos, não texto pronto com marcação: a ênfase é decisão de quem
 * desenha a tela, e assim a regra continua testável sem renderizar nada.
 */
export type ResumoDeDivergencia = {
  culturaDaEmpresa: ClassificacaoCultural;
  culturaDoTalento: ClassificacaoCultural;
  tendenciaDaEmpresa: string;
  tendenciaDoTalento: string;
  /** Os dois lados caíram na mesma região do plano. */
  mesmaRegiao: boolean;
  /** Eixos em que as respostas diferem, na ordem em que foram perguntados. */
  eixosDivergentes: LeituraDeEixo[];
  /** Eixos em que as respostas coincidem. */
  eixosConvergentes: LeituraDeEixo[];
  recomendacao: string;
};

export function resumirDivergencia(
  posicaoDoTalento: PosicaoCultural,
  posicaoDaEmpresa: PosicaoCultural,
  eixos: LeituraDeEixo[],
  /**
   * A faixa vem de fora, e não da distância entre as duas posições: quem chama
   * já tem a aderência, e derivar aqui traria de volta a contradição entre o
   * número exibido e a recomendação escrita ao lado dele.
   */
  faixa: FaixaDeEncaixe
): ResumoDeDivergencia {
  const culturaDoTalento = classificarCultura(posicaoDoTalento);
  const culturaDaEmpresa = classificarCultura(posicaoDaEmpresa);

  return {
    culturaDaEmpresa,
    culturaDoTalento,
    tendenciaDaEmpresa: TIPO_DE_CULTURA_TENDENCIA[culturaDaEmpresa],
    tendenciaDoTalento: TIPO_DE_CULTURA_TENDENCIA[culturaDoTalento],
    mesmaRegiao: culturaDaEmpresa === culturaDoTalento,
    eixosDivergentes: eixos.filter((eixo) => !eixo.convergente),
    eixosConvergentes: eixos.filter((eixo) => eixo.convergente),
    recomendacao: FAIXA_DE_ENCAIXE_RECOMENDACAO[faixa]
  };
}
