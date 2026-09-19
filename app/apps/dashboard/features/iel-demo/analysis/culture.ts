/**
 * Perfil cultural da empresa, a partir das respostas ao instrumento.
 *
 * Três restrições moldam este desenho, e nenhuma delas é opcional.
 *
 * **Não pode ser um formulário longo.** O enunciado lista custo e tempo de
 * aplicação como limitações do fit cultural. O instrumento do cliente tem 52
 * frases; ninguém responde as 52. Cada colaborador recebe um bloco de cerca de
 * 15 (`instrumento.ts`, amostragem em matriz) e o perfil se forma pela soma
 * dos blocos.
 *
 * **Não pode ser uma pessoa só.** O perfil é a média de uma amostra (R2), e
 * uma frase só "fecha" com `MIN_TEAM_RESPONSES` respostas da equipe. Gestão e
 * RH entram na média, mas a leitura mostra quando divergem da equipe, em vez
 * de escolher uma versão.
 *
 * **A decisão continua humana.** A proposta da análise assistida nunca vira
 * resposta sozinha: fica pendente até alguém da empresa confirmar.
 *
 * As respostas da equipe são agregadas e anônimas: quem responde sobre o
 * próprio ambiente de trabalho não pode ficar identificado para a gestão.
 */

import type { FitAxisId } from './fit-axes';
import { FIT_AXES } from './fit-axes';
import {
  alinharAoPolo,
  ESCALA_MAX,
  ESCALA_MIN,
  ESCALA_NEUTRO,
  getItem,
  ITEM_PADRAO_POR_TEMA,
  itensDoTema,
  type ValorDaEscala
} from './instrumento';

/**
 * Amplitude da escala comum aos dois lados. Todas as telas que desenham um
 * trilho empresa × pessoa leem daqui, para nenhuma fixar 1..3 ou 1..5.
 */
export const CULTURE_SCALE_MIN = ESCALA_MIN;
export const CULTURE_SCALE_MAX = ESCALA_MAX;

/** Quem respondeu. A equipe entra agregada e sem identificação. */
export type CultureRespondent = 'gestao' | 'rh' | 'equipe';

export const CULTURE_RESPONDENT_LABEL: Record<CultureRespondent, string> = {
  gestao: 'Gestão da área',
  rh: 'RH da empresa',
  equipe: 'Equipe'
};

/**
 * Quantas respostas da equipe sustentam uma frase.
 *
 * Abaixo disso a frase não fecha e a tela diz que a consulta ainda não tem
 * base, em vez de tratar duas respostas como "a equipe".
 */
export const MIN_TEAM_RESPONSES = 3;

/**
 * Diferença, em pontos da escala de 1 a 5, a partir da qual gestão/RH e
 * equipe "respondem diferente" num tema. Um ponto é a distância entre
 * "concordo" e "tanto faz": abaixo disso é nuance, não outra versão.
 */
export const LIMIAR_DE_DIVERGENCIA = 1;

/** O mínimo que o cálculo precisa de uma resposta registrada. */
export type RespostaAgregada = {
  itemId: string;
  value: ValorDaEscala;
  respondent: CultureRespondent;
  count: number;
};

export type PerfilDoItem = {
  itemId: string;
  tema: FitAxisId;
  /** Média de todos os papéis, ponderada por `count`. `null` sem resposta. */
  media: number | null;
  /** Respostas na frase, somados os papéis. */
  n: number;
  /** Respostas da equipe: é o que decide se a frase fecha. */
  nEquipe: number;
  /** Desvio-padrão das respostas (0 quando todos respondem igual). */
  desvio: number;
  /** n da equipe ≥ `MIN_TEAM_RESPONSES`. */
  fecha: boolean;
  porPapel: Partial<Record<CultureRespondent, { media: number; n: number }>>;
};

export type CultureDispersion = 'convergente' | 'divergente';

export type PerfilDoTema = {
  axisId: FitAxisId;
  /** Média, no sentido do tema, das frases que fecham. `null` se nenhuma. */
  media: number | null;
  /** Média de todas as frases com resposta, fechadas ou não. */
  mediaProvisoria: number | null;
  /** Alguma frase discriminante do tema fechou. */
  fecha: boolean;
  /** Maior número de respostas numa frase do tema: aproxima "quantas pessoas". */
  respondentes: number;
  /** Maior número de respostas por papel numa frase do tema. */
  respondentesPorPapel: Record<CultureRespondent, number>;
  /** Média do tema por papel, no sentido do tema. */
  porPapel: Partial<Record<CultureRespondent, number>>;
  /** Gestão e RH juntos, e a equipe, para o diagnóstico de divergência. */
  lideranca: number | null;
  equipe: number | null;
  dispersao: CultureDispersion | null;
};

export type PerfilCultural = {
  itens: Record<string, PerfilDoItem>;
  temas: PerfilDoTema[];
};

const PAPEIS: CultureRespondent[] = ['gestao', 'rh', 'equipe'];

function media(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return valores.reduce((soma, valor) => soma + valor, 0) / valores.length;
}

/**
 * Perfil por frase e por tema a partir das respostas agregadas de uma empresa.
 *
 * Função pura: quem filtra as respostas da empresa é o seletor. Uma resposta
 * a uma frase que não existe mais no instrumento é ignorada — número órfão
 * não entra na média.
 */
export function calcularPerfilCultural(
  respostas: RespostaAgregada[]
): PerfilCultural {
  type Acumulado = {
    soma: number;
    somaQuadrados: number;
    n: number;
    porPapel: Record<CultureRespondent, { soma: number; n: number }>;
  };
  const porItem = new Map<string, Acumulado>();

  for (const resposta of respostas) {
    if (!getItem(resposta.itemId) || resposta.count <= 0) continue;
    const atual = porItem.get(resposta.itemId) ?? {
      soma: 0,
      somaQuadrados: 0,
      n: 0,
      porPapel: {
        gestao: { soma: 0, n: 0 },
        rh: { soma: 0, n: 0 },
        equipe: { soma: 0, n: 0 }
      }
    };
    atual.soma += resposta.value * resposta.count;
    atual.somaQuadrados += resposta.value * resposta.value * resposta.count;
    atual.n += resposta.count;
    atual.porPapel[resposta.respondent].soma += resposta.value * resposta.count;
    atual.porPapel[resposta.respondent].n += resposta.count;
    porItem.set(resposta.itemId, atual);
  }

  const itens: Record<string, PerfilDoItem> = {};
  for (const [itemId, acumulado] of porItem) {
    const item = getItem(itemId)!;
    const mediaDoItem = acumulado.soma / acumulado.n;
    const variancia = Math.max(
      0,
      acumulado.somaQuadrados / acumulado.n - mediaDoItem * mediaDoItem
    );
    const porPapel: PerfilDoItem['porPapel'] = {};
    for (const papel of PAPEIS) {
      const entrada = acumulado.porPapel[papel];
      if (entrada.n > 0) {
        porPapel[papel] = { media: entrada.soma / entrada.n, n: entrada.n };
      }
    }
    const nEquipe = acumulado.porPapel.equipe.n;
    itens[itemId] = {
      itemId,
      tema: item.tema,
      media: mediaDoItem,
      n: acumulado.n,
      nEquipe,
      desvio: Math.sqrt(variancia),
      fecha: nEquipe >= MIN_TEAM_RESPONSES,
      porPapel
    };
  }

  const temas: PerfilDoTema[] = FIT_AXES.map((axis) => {
    const doTema = itensDoTema(axis.id);
    const comResposta = doTema
      .map((item) => ({ item, perfil: itens[item.id] }))
      .filter(
        (
          entrada
        ): entrada is {
          item: (typeof doTema)[number];
          perfil: PerfilDoItem;
        } => entrada.perfil !== undefined && entrada.perfil.media !== null
      );

    const fechados = comResposta.filter((entrada) => entrada.perfil.fecha);
    const alinhada = (entrada: (typeof comResposta)[number]) =>
      alinharAoPolo(entrada.item, entrada.perfil.media!);

    const porPapel: PerfilDoTema['porPapel'] = {};
    const respondentesPorPapel: Record<CultureRespondent, number> = {
      gestao: 0,
      rh: 0,
      equipe: 0
    };
    for (const papel of PAPEIS) {
      const valores: number[] = [];
      for (const entrada of comResposta) {
        const doPapel = entrada.perfil.porPapel[papel];
        if (!doPapel) continue;
        valores.push(alinharAoPolo(entrada.item, doPapel.media));
        respondentesPorPapel[papel] = Math.max(
          respondentesPorPapel[papel],
          doPapel.n
        );
      }
      const valor = media(valores);
      if (valor !== null) porPapel[papel] = valor;
    }

    // Divergência: só nas frases em que os dois lados responderam, para não
    // comparar a gestão numa frase com a equipe em outra.
    const liderancaValores: number[] = [];
    const equipeValores: number[] = [];
    for (const entrada of comResposta) {
      const gestao = entrada.perfil.porPapel.gestao;
      const rh = entrada.perfil.porPapel.rh;
      const equipe = entrada.perfil.porPapel.equipe;
      if (!equipe || (!gestao && !rh)) continue;
      const nLideranca = (gestao?.n ?? 0) + (rh?.n ?? 0);
      const somaLideranca =
        (gestao ? gestao.media * gestao.n : 0) + (rh ? rh.media * rh.n : 0);
      liderancaValores.push(
        alinharAoPolo(entrada.item, somaLideranca / nLideranca)
      );
      equipeValores.push(alinharAoPolo(entrada.item, equipe.media));
    }
    const lideranca = media(liderancaValores);
    const equipe = media(equipeValores);

    const fecha = fechados.some((entrada) => entrada.item.discrimina);
    const dispersao: CultureDispersion | null =
      !fecha || lideranca === null || equipe === null
        ? null
        : Math.abs(lideranca - equipe) >= LIMIAR_DE_DIVERGENCIA
          ? 'divergente'
          : 'convergente';

    return {
      axisId: axis.id,
      media: media(fechados.map(alinhada)),
      mediaProvisoria: media(comResposta.map(alinhada)),
      fecha,
      respondentes: Math.max(0, ...comResposta.map((e) => e.perfil.n)),
      respondentesPorPapel,
      porPapel,
      lideranca,
      equipe,
      dispersao
    };
  });

  return { itens, temas };
}

/**
 * O quanto a empresa é marcante numa frase: longe do "tanto faz" e com a
 * equipe de acordo entre si.
 *
 * `|média − 3| × 1 / (1 + desvio)`. Uma frase em que a equipe inteira
 * responde "concordo muito" separa candidatos; uma em que metade concorda e
 * metade discorda não diz nada sobre a empresa, mesmo com média longe do 3.
 */
export function marcaDaEmpresa(perfil: PerfilDoItem): number {
  if (perfil.media === null) return 0;
  return Math.abs(perfil.media - ESCALA_NEUTRO) * (1 / (1 + perfil.desvio));
}

export type PerguntaDoCandidato = {
  itemId: string;
  axisId: FitAxisId;
  /**
   * O tema ainda não fechou na empresa: a frase é a padrão do tema e a
   * resposta não pesa até o perfil fechar.
   */
  semBaseDaEmpresa: boolean;
};

/**
 * As 10 frases do candidato, uma por tema, escolhidas pela empresa.
 *
 * Em cada tema, a frase discriminante que fecha e em que a empresa é mais
 * marcante (`marcaDaEmpresa`). Sem frase fechada, a padrão do tema, marcada
 * `semBaseDaEmpresa`. Frases de desejabilidade social nunca entram.
 */
export function escolherPerguntasDoCandidato(
  perfil: PerfilCultural
): PerguntaDoCandidato[] {
  return FIT_AXES.map((axis) => {
    let melhor: { itemId: string; marca: number } | null = null;
    for (const item of itensDoTema(axis.id)) {
      if (!item.discrimina) continue;
      const doItem = perfil.itens[item.id];
      if (!doItem?.fecha) continue;
      const marca = marcaDaEmpresa(doItem);
      if (!melhor || marca > melhor.marca) {
        melhor = { itemId: item.id, marca };
      }
    }
    return melhor
      ? { itemId: melhor.itemId, axisId: axis.id, semBaseDaEmpresa: false }
      : {
          itemId: ITEM_PADRAO_POR_TEMA[axis.id],
          axisId: axis.id,
          semBaseDaEmpresa: true
        };
  });
}
