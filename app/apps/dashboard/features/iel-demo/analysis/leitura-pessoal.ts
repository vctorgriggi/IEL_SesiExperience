/**
 * A devolutiva pessoal: o que a pessoa recebe de volta ao fim do questionário.
 *
 * Quem responde dez ou dezesseis frases e recebe "obrigado" não responde a
 * próxima. O que faz alguém responder é **receber algo de volta** e sentir que
 * aquilo é sobre ela. Este arquivo monta esse algo por regra fixa: sem modelo,
 * sem rede, sem custo (PRODUTO.md §3). O Mind, quando há chave, só reescreve
 * as frases daqui para ficarem mais próximas do contexto — nunca as decide
 * (`ai/leitura-pessoal.ts`).
 *
 * O que isto **não** é, e nenhuma frase pode sugerir que seja (PRODUTO.md
 * §11): não é nota, não é teste, não é "perfil", não é tipo de personalidade.
 * É o que a pessoa disse, reescrito em palavra comum. Por isso:
 *
 * - cada frase pronta descreve um **jeito de trabalhar** ou um **ambiente**,
 *   nunca uma qualidade da pessoa. "Prefiro combinar o caminho antes de
 *   seguir" não é defeito; é outro jeito;
 * - nada de percentual, ranking ou comparação com a empresa — a comparação é
 *   da analista (`adherence.ts`), e a pessoa nunca vê o próprio % (§5.1);
 * - "no meio-termo" é uma resposta válida, dita com respeito, e não vira
 *   traço forçado: com tudo em "tanto faz" a leitura tem nuance e nenhum
 *   traço.
 *
 * Determinística: as mesmas respostas produzem o mesmo texto, sempre.
 */

import { FIT_AXES, type FitAxisId } from './fit-axes';
import {
  alinharAoPolo,
  ESCALA_NEUTRO,
  getItem,
  type ValorDaEscala
} from './instrumento';

export type PapelDaLeitura = 'candidato' | 'colaborador';

/** Um lado do tema: `alto` = concorda com o sentido do tema, `baixo` = discorda. */
export type LadoDoTema = 'alto' | 'baixo';

export type TracoDaLeitura = {
  tema: FitAxisId;
  /** A frase pronta: primeira pessoa (candidato) ou o ambiente (colaborador). */
  frase: string;
};

export type LeituraPessoal = {
  papel: PapelDaLeitura;
  /** "O seu jeito de trabalhar" | "Como você descreveu o seu ambiente". */
  titulo: string;
  /** Até 3, os temas mais marcantes. Menos quando falta base. */
  tracos: TracoDaLeitura[];
  /**
   * 2–3 linhas. Candidato: o tipo de lugar que combina com as marcas.
   * Colaborador: o que as marcas dizem do lugar.
   */
  ambiente: string[];
  /** Um tema em que a pessoa ficou no meio, dito com respeito. */
  nuance?: string;
  /** "Isto não é nota nem teste: é o que você disse, do seu jeito." */
  aviso: string;
  /** `regra` aqui; `mind` só quando o texto do modelo foi de fato usado. */
  origem: 'regra' | 'mind';
};

export type ContextoDaLeitura = {
  /** Atividade da vaga ou da área, genérica ("produção", "logística"). */
  atividade?: string;
  /** Setor da empresa, genérico ("alimentos", "metalurgia"). */
  setor?: string;
};

/**
 * Média da pessoa num tema, já no sentido do tema, e a distância até o meio.
 *
 * Exportado porque é o que a rota manda ao modelo (números, sem frase a
 * frase) e o que a validação da volta usa para conferir a direção.
 */
export type MediaDoTema = {
  tema: FitAxisId;
  /** 1..5 no sentido do tema (`alinharAoPolo`). */
  media: number;
  /** |media − 3|: o quanto a resposta marca. */
  distancia: number;
  lado: LadoDoTema;
  /** Quantas frases do tema a pessoa respondeu. */
  frases: number;
};

/* ------------------------------------------------------------------ *
 * Limiares
 * ------------------------------------------------------------------ */

/** Quantos temas viram traço. */
export const MAX_TRACOS = 3;

/**
 * A partir de que distância do meio um tema vira traço.
 *
 * Com uma frase por tema (o candidato), "concordo" (4) está a 1 do meio e
 * vira traço; "tanto faz" (3) está a 0 e vira nuance. Com várias frases (o
 * colaborador), uma média de 3,5 — metade "concordo", metade "tanto faz" —
 * fica no meio-termo: não é marca forte o bastante para ser dita como tal.
 * Acima disso é traço; até aqui, nuance. As duas zonas se completam, sem
 * faixa morta.
 */
export const DISTANCIA_MINIMA_DO_TRACO = 0.5;

export const TITULO: Record<PapelDaLeitura, string> = {
  candidato: 'O seu jeito de trabalhar',
  colaborador: 'Como você descreveu o seu ambiente'
};

export const AVISO_DA_LEITURA =
  'Isto não é nota nem teste: é o que você disse, do seu jeito.';

/* ------------------------------------------------------------------ *
 * As frases prontas
 * ------------------------------------------------------------------ */

type FrasesDoLado = {
  /** Primeira pessoa: o candidato fala de si. */
  candidato: string;
  /** Terceira pessoa: o colaborador descreve o lugar onde trabalha. */
  colaborador: string;
  /**
   * O lugar, sem sujeito: completa "Um lugar onde …". Serve aos dois papéis
   * — para o candidato é o ambiente que combina; para o colaborador, o que
   * as respostas dizem do lugar.
   */
  lugar: string;
};

/**
 * Duas frases por tema e por lado, mais a do lugar.
 *
 * O "alto" de cada tema é o sentido em que as frases do instrumento foram
 * escritas (polo 1, `instrumento.ts`): concordar com "prefiro conferir cada
 * etapa" é alto em "Jeito de entregar". Onde o tema junta frases de sentidos
 * diferentes, a frase pronta segue a frase que representa o tema para o
 * candidato (`ITEM_PADRAO_POR_TEMA`), que é a que ele quase sempre respondeu.
 *
 * Nenhum lado é melhor. Cada frase foi escrita para poder ser lida pela
 * pessoa que a marcou sem se sentir avaliada.
 */
const FRASES: Record<FitAxisId, Record<LadoDoTema, FrasesDoLado>> = {
  'orientacao-resultados': {
    alto: {
      candidato:
        'Gosto de conferir cada etapa e terminar uma tarefa antes de começar outra.',
      colaborador:
        'Aqui, cada etapa é conferida, e uma tarefa termina antes de a outra começar.',
      lugar: 'cada etapa é conferida e uma coisa termina antes da outra'
    },
    baixo: {
      candidato:
        'Prefiro manter o serviço andando, alternando tarefas sem parar para reconferir o que já foi visto.',
      colaborador:
        'Aqui, o serviço anda alternando tarefas, sem parar para reconferir o que já foi visto.',
      lugar: 'o serviço anda sem parar para reconferir a cada passo'
    }
  },
  inovacao: {
    alto: {
      candidato:
        'Com ferramenta ou jeito novo, prefiro o caminho que já foi testado até a mudança firmar.',
      colaborador:
        'Aqui, uma mudança só entra depois de firmar; o que já foi testado vale mais.',
      lugar: 'as mudanças chegam devagar e o que já funciona é respeitado'
    },
    baixo: {
      candidato:
        'Quando chega uma ferramenta ou um jeito novo, gosto de experimentar logo.',
      colaborador:
        'Aqui, ferramenta ou jeito novo entra logo, e a equipe experimenta.',
      lugar: 'novidade entra rápido e dá para experimentar'
    }
  },
  'aprendizado-desenvolvimento': {
    alto: {
      candidato:
        'Gosto de conhecer outras tarefas além da minha, e consigo começar algo novo sem saber tudo antes.',
      colaborador:
        'Aqui, quem quer conhecer outras atividades encontra espaço, e se aprende começando.',
      lugar: 'dá para conhecer outras atividades além da sua'
    },
    baixo: {
      candidato:
        'Prefiro dominar bem a minha tarefa antes de pegar outra, e entender os detalhes antes de começar.',
      colaborador:
        'Aqui, cada um domina bem a própria atividade antes de ampliar, e os detalhes vêm antes de começar.',
      lugar: 'você domina bem a sua atividade antes de ampliar'
    }
  },
  'foco-cliente': {
    alto: {
      candidato:
        'Prefiro me concentrar na minha parte e entregar bem feito para quem vem depois.',
      colaborador:
        'Aqui, cada um cuida da própria parte com atenção e passa adiante pensando em quem recebe.',
      lugar: 'cada um cuida da sua parte e entrega pensando em quem recebe'
    },
    baixo: {
      candidato:
        'Trabalho melhor em contato com os outros, ajudando quando alguém aperta, mesmo antes de fechar a minha parte.',
      colaborador:
        'Aqui, a entrega é combinada em conversa, e a equipe se ajuda antes de fechar a própria parte.',
      lugar: 'a entrega é combinada em conversa e a equipe se ajuda'
    }
  },
  'etica-seguranca': {
    alto: {
      candidato:
        'Quando o serviço aperta, prefiro mudar o jeito de fazer a correr, e gosto de saber meus horários com antecedência.',
      colaborador:
        'Aqui, quando o ritmo aperta, a equipe ajusta o jeito de fazer, e os horários são combinados com antecedência.',
      lugar:
        'o jeito de fazer se ajusta quando aperta e os horários são avisados antes'
    },
    baixo: {
      candidato:
        'Quando o serviço aperta, mantenho o meu ritmo, e prefiro confirmar cada passo antes de seguir.',
      colaborador:
        'Aqui, quando o ritmo aperta, o jeito de fazer se mantém, e cada passo é confirmado antes de seguir.',
      lugar: 'o ritmo se mantém quando aperta e cada passo é confirmado'
    }
  },
  'execucao-ritmo': {
    alto: {
      candidato:
        'Prefiro um ritmo parecido o turno todo, uma tarefa de cada vez, e avisar quando vou atrasar.',
      colaborador:
        'Aqui, o turno tem um ritmo parecido do começo ao fim, e as tarefas vêm uma de cada vez.',
      lugar: 'o turno tem ritmo previsível e as tarefas vêm uma de cada vez'
    },
    baixo: {
      candidato:
        'Consigo alternar entre várias tarefas e acelerar quando o turno pede.',
      colaborador:
        'Aqui, as demandas chegam juntas, e o turno pede alternar entre elas e acelerar nos picos.',
      lugar: 'as demandas chegam juntas e o ritmo muda ao longo do turno'
    }
  },
  'regras-decisao': {
    alto: {
      candidato:
        'Diante de algo diferente, gosto de entender a regra e o que pode acontecer antes de mudar.',
      colaborador:
        'Aqui, diante do imprevisto, a equipe entende a regra e as consequências antes de mudar o jeito.',
      lugar: 'as regras são claras e o imprevisto é entendido antes de mudar'
    },
    baixo: {
      candidato:
        'Quando preciso decidir rápido, consigo agir sem saber tudo e manter o serviço andando.',
      colaborador:
        'Aqui, diante do imprevisto, decide-se rápido e o serviço continua andando.',
      lugar: 'se decide rápido e o serviço não para'
    }
  },
  'interacao-convivencia': {
    alto: {
      candidato:
        'Resolvo as coisas direto com a pessoa, e consigo me concentrar mesmo com pouca conversa.',
      colaborador:
        'Aqui, os combinados são feitos direto entre as pessoas, e cada um consegue se concentrar no seu.',
      lugar: 'os combinados são feitos direto entre as pessoas'
    },
    baixo: {
      candidato:
        'Trabalho melhor com gente por perto, e prefiro que os combinados fiquem registrados, não só na conversa.',
      colaborador:
        'Aqui, o trabalho acontece junto, com gente por perto, e os combinados passam por um canal registrado.',
      lugar: 'se trabalha junto e os combinados ficam registrados'
    }
  },
  'lideranca-autonomia': {
    alto: {
      candidato:
        'Com um objetivo claro, me organizo sozinho, sem precisar de orientação toda hora.',
      colaborador:
        'Aqui, depois do objetivo combinado, cada um se organiza sozinho.',
      lugar: 'depois do objetivo combinado, cada um se organiza sozinho'
    },
    baixo: {
      candidato:
        'Prefiro combinar o caminho antes de seguir e ter alguém acompanhando de perto.',
      colaborador:
        'Aqui, o caminho é combinado antes, e a chefia acompanha de perto.',
      lugar: 'o caminho é combinado antes e a chefia acompanha de perto'
    }
  },
  'adaptacao-carreira': {
    alto: {
      candidato:
        'Consigo mudar meus horários quando o trabalho precisa, e, se um jeito de trabalhar funciona, prefiro esperar antes de mudar.',
      colaborador:
        'Aqui, os horários mudam quando a operação pede, e o que funciona só muda depois que a alternativa firma.',
      lugar:
        'os horários mudam quando a operação pede e o que funciona não muda à toa'
    },
    baixo: {
      candidato:
        'Prefiro horários que não mudam, e gosto de experimentar um jeito novo assim que ele aparece.',
      colaborador:
        'Aqui, os horários são fixos, e um jeito novo de trabalhar entra assim que aparece.',
      lugar: 'os horários são fixos e um jeito novo entra logo'
    }
  },
  'expectativas-futuras': {
    alto: {
      candidato:
        'Nos próximos anos, quero conhecer cada vez melhor a minha área, e me vejo seguindo um caminho parecido com o de hoje.',
      colaborador:
        'Aqui, quem fica costuma aprofundar a própria área e seguir um caminho parecido por bastante tempo.',
      lugar: 'o caminho é aprofundar a própria área por bastante tempo'
    },
    baixo: {
      candidato:
        'Gosto de pensar em caminhos diferentes para o meu futuro e de aprender assuntos que não uso hoje.',
      colaborador:
        'Aqui, há espaço para quem quer mudar de caminho e aprender assuntos diferentes.',
      lugar: 'há espaço para mudar de caminho e aprender assuntos diferentes'
    }
  }
};

/** A frase pronta de um tema e lado, para um papel. Exportada para o Mind conferir a base. */
export function fraseDoTraco(
  tema: FitAxisId,
  lado: LadoDoTema,
  papel: PapelDaLeitura
): string {
  return FRASES[tema][lado][papel];
}

/* ------------------------------------------------------------------ *
 * A conta
 * ------------------------------------------------------------------ */

/**
 * Média por tema, no sentido do tema, só dos temas com pelo menos uma frase
 * respondida. Ids desconhecidos são ignorados: a rota pública recebe o que
 * o navegador mandar.
 */
export function mediasPorTema(
  respostas: Record<string, ValorDaEscala>
): MediaDoTema[] {
  const soma = new Map<FitAxisId, { total: number; frases: number }>();
  for (const [itemId, valor] of Object.entries(respostas)) {
    const item = getItem(itemId);
    if (!item) continue;
    const atual = soma.get(item.tema) ?? { total: 0, frases: 0 };
    atual.total += alinharAoPolo(item, valor);
    atual.frases += 1;
    soma.set(item.tema, atual);
  }
  // Na ordem dos temas: é o desempate de tudo o que vem depois.
  return FIT_AXES.flatMap((axis) => {
    const entrada = soma.get(axis.id);
    if (!entrada) return [];
    const media = entrada.total / entrada.frases;
    return [
      {
        tema: axis.id,
        media,
        distancia: Math.abs(media - ESCALA_NEUTRO),
        lado: media >= ESCALA_NEUTRO ? 'alto' : 'baixo',
        frases: entrada.frases
      } satisfies MediaDoTema
    ];
  });
}

/** Os até 3 temas mais marcantes: maior distância do meio, desempate pela ordem dos temas. */
export function temasMarcantes(medias: MediaDoTema[]): MediaDoTema[] {
  return medias
    .filter((entrada) => entrada.distancia > DISTANCIA_MINIMA_DO_TRACO)
    .map((entrada, ordem) => ({ entrada, ordem }))
    .sort(
      (a, b) => b.entrada.distancia - a.entrada.distancia || a.ordem - b.ordem
    )
    .slice(0, MAX_TRACOS)
    .map(({ entrada }) => entrada);
}

/** O tema mais perto do meio, se algum ficou no meio-termo. */
export function temaNoMeio(medias: MediaDoTema[]): MediaDoTema | null {
  const noMeio = medias
    .filter((entrada) => entrada.distancia <= DISTANCIA_MINIMA_DO_TRACO)
    .map((entrada, ordem) => ({ entrada, ordem }))
    .sort(
      (a, b) => a.entrada.distancia - b.entrada.distancia || a.ordem - b.ordem
    );
  return noMeio[0]?.entrada ?? null;
}

function rotulo(tema: FitAxisId): string {
  return FIT_AXES.find((axis) => axis.id === tema)?.label ?? tema;
}

function fraseDaNuance(tema: FitAxisId, papel: PapelDaLeitura): string {
  const nome = rotulo(tema);
  return papel === 'candidato'
    ? `Em "${nome}" você ficou no meio-termo — depende do dia, e tudo bem.`
    : `Em "${nome}" as suas respostas ficaram no meio — nem sempre é de um jeito só, e tudo bem.`;
}

/**
 * Monta a devolutiva pela regra fixa.
 *
 * `contexto` (atividade/setor) não muda a regra: ela é a mesma para todo
 * mundo, de propósito. Quem usa o contexto é o Mind, para aproximar o texto
 * — e só quando há chave. Fica na assinatura para o chamador não precisar
 * saber qual dos dois caminhos vai rodar.
 */
export function gerarLeituraPessoal(
  respostas: Record<string, ValorDaEscala>,
  papel: PapelDaLeitura,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- parte do contrato; ver acima
  contexto?: ContextoDaLeitura
): LeituraPessoal {
  const medias = mediasPorTema(respostas);
  const marcantes = temasMarcantes(medias);
  const meio = temaNoMeio(medias);

  const tracos: TracoDaLeitura[] = marcantes.map((entrada) => ({
    tema: entrada.tema,
    frase: fraseDoTraco(entrada.tema, entrada.lado, papel)
  }));

  const ambiente = marcantes.map(
    (entrada) => `Um lugar onde ${FRASES[entrada.tema][entrada.lado].lugar}.`
  );

  return {
    papel,
    titulo: TITULO[papel],
    tracos,
    ambiente,
    ...(meio ? { nuance: fraseDaNuance(meio.tema, papel) } : {}),
    aviso: AVISO_DA_LEITURA,
    origem: 'regra'
  };
}
