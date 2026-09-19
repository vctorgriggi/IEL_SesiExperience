/**
 * O instrumento de fit: 52 afirmações em primeira pessoa, em 10 temas.
 *
 * Fonte: `docs/cliente/04-perguntas-empresa.xlsx`, a planilha que o cliente
 * entregou (colunas TOPICO, SUBTOPICO e PERGUNTA PARA EMPRESA). O `texto` de
 * cada item é o da planilha, sem edição. O mesmo texto vale para o
 * colaborador e para o candidato: os dois descrevem como preferem trabalhar,
 * e é isso que torna a comparação legítima — a aderência é a distância entre
 * duas respostas à mesma frase, não a correlação entre dois instrumentos.
 *
 * O `textoSimples` é a mesma frase reescrita para o candidato operacional no
 * celular, com baixo letramento digital (R10): curta, sem jargão, até cerca
 * de 12 palavras, mantendo o sentido e o polo — quem concorda com uma
 * concorda com a outra. O colaborador lê o `texto` original.
 *
 * Nenhuma frase pergunta personalidade, saúde, família, religião, opinião
 * política ou filiação (LGPD, art. 5º, II). São preferências de trabalho em
 * situações do cotidiano.
 */

import type { FitAxisId } from './fit-axes';

/* ------------------------------------------------------------------ *
 * Escala de concordância
 * ------------------------------------------------------------------ */

/**
 * Posição na escala de concordância. 1 = discordo muito, 5 = concordo muito.
 *
 * É ordinal e simétrica em torno do 3 ("tanto faz"). Não é nota: concordar
 * com "prefiro concluir uma atividade antes de iniciar outra" não é melhor
 * nem pior do que discordar. É outro jeito de trabalhar.
 */
export type ValorDaEscala = 1 | 2 | 3 | 4 | 5;

export const ESCALA_MIN: ValorDaEscala = 1;
export const ESCALA_MAX: ValorDaEscala = 5;
/** O meio da escala: "tanto faz". A distância até ele mede o quanto marca. */
export const ESCALA_NEUTRO = 3;

export const ESCALA_CONCORDANCIA: { valor: ValorDaEscala; rotulo: string }[] = [
  { valor: 1, rotulo: 'Discordo muito' },
  { valor: 2, rotulo: 'Discordo' },
  { valor: 3, rotulo: 'Tanto faz' },
  { valor: 4, rotulo: 'Concordo' },
  { valor: 5, rotulo: 'Concordo muito' }
];

export function isValorDaEscala(valor: unknown): valor is ValorDaEscala {
  return (
    typeof valor === 'number' &&
    Number.isInteger(valor) &&
    valor >= ESCALA_MIN &&
    valor <= ESCALA_MAX
  );
}

/** Rótulo do ponto da escala mais próximo de um valor (médias inclusive). */
export function rotuloDaEscala(valor: number): string {
  const arredondado = Math.min(
    ESCALA_MAX,
    Math.max(ESCALA_MIN, Math.round(valor))
  );
  return (
    ESCALA_CONCORDANCIA.find((entrada) => entrada.valor === arredondado)
      ?.rotulo ?? String(valor)
  );
}

/* ------------------------------------------------------------------ *
 * Itens
 * ------------------------------------------------------------------ */

export type ItemDoInstrumento = {
  /** `I01`..`I52`, na ordem da planilha. */
  id: string;
  tema: FitAxisId;
  /** SUBTOPICO da planilha. */
  subtema: string;
  /** A frase original, como o cliente escreveu. O colaborador lê esta. */
  texto: string;
  /** A mesma frase para o candidato: curta, direta, mesmo sentido e polo. */
  textoSimples: string;
  /**
   * Sentido do "concordo" dentro de um par de frases opostas.
   *
   * `-1` marca a frase cujo "concordo" aponta para o polo oposto ao da outra
   * frase do par (ver `PARES_INVERTIDOS`). Na média do tema e na comparação
   * entre pares, a resposta dela entra espelhada (6 − valor). Frases fora de
   * par invertido têm `1`.
   */
  polo: 1 | -1;
  /**
   * A frase separa pessoas?
   *
   * `false` nas frases de desejabilidade social: quase todo mundo concorda,
   * então a resposta diz pouco sobre quem responde. Elas entram no perfil da
   * empresa (a equipe descreve o ambiente), mas nunca são escolhidas para o
   * candidato e não pesam na aderência.
   */
  discrimina: boolean;
};

type ItemSemId = Omit<ItemDoInstrumento, 'id'>;

const ITENS: ItemSemId[] = [
  // --- ORIENTAÇÃO PARA RESULTADOS ---
  {
    tema: 'orientacao-resultados',
    subtema: 'Modo de Execução',
    texto:
      'Em uma atividade de produção, prefiro conferir cuidadosamente cada etapa antes de seguir para a próxima.',
    textoSimples: 'Gosto de conferir cada etapa com calma antes de seguir.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'orientacao-resultados',
    subtema: 'Gestão de Prazos',
    texto:
      'Se uma atividade precisar de mais tempo para ser concluída conforme o procedimento, prefiro comunicar o atraso a entregar dentro do prazo.',
    textoSimples:
      'Se o serviço pedir mais tempo, prefiro avisar do atraso a correr.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'orientacao-resultados',
    subtema: 'Organização do Dia',
    texto:
      'Durante o turno, prefiro concluir uma atividade antes de iniciar outra.',
    textoSimples: 'Prefiro terminar uma tarefa antes de começar outra.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'orientacao-resultados',
    subtema: 'Energia de Trabalho',
    texto:
      'Prefiro manter um ritmo de trabalho parecido durante todo o turno, mesmo quando a demanda aumenta.',
    textoSimples: 'Gosto de manter o mesmo ritmo, mesmo com mais serviço.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'orientacao-resultados',
    subtema: 'Tomada de Decisão',
    texto:
      'Quando surge uma ocorrência inesperada na linha, prefiro reunir mais informações antes de decidir como agir.',
    textoSimples:
      'Quando algo inesperado acontece, prefiro saber mais antes de agir.',
    polo: 1,
    discrimina: true
  },

  // --- INOVAÇÃO ---
  {
    tema: 'inovacao',
    subtema: 'Adoção de Mudanças',
    texto:
      'Quando uma nova ferramenta é implantada na produção, prefiro continuar utilizando métodos que já conheço até que a mudança esteja consolidada.',
    textoSimples:
      'Com ferramenta nova, prefiro o jeito antigo até a mudança firmar.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'inovacao',
    subtema: 'Gestão de Riscos',
    texto:
      'No trabalho, prefiro utilizar formas de execução que já foram testadas na operação.',
    textoSimples: 'Prefiro fazer do jeito que já foi testado.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'inovacao',
    subtema: 'Resolução de Falhas',
    texto:
      'Quando ocorre uma falha na produção, prefiro investigar sua causa antes de retomar o processo.',
    textoSimples: 'Quando algo falha, prefiro achar a causa antes de voltar.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'inovacao',
    subtema: 'Resposta à Rotina',
    texto:
      'Em um turno com tarefas repetitivas, prefiro manter uma rotina de trabalho estável durante todo o período.',
    textoSimples: 'Em serviço repetitivo, gosto da mesma rotina o turno todo.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'inovacao',
    subtema: 'Autonomia Metódica',
    texto:
      'Quando surge uma situação diferente durante uma atividade, prefiro seguir o procedimento definido antes de buscar outra forma de execução.',
    textoSimples:
      'Em situação diferente, prefiro seguir o procedimento antes de inventar.',
    polo: 1,
    discrimina: true
  },

  // --- APRENDIZADO E DESENVOLVIMENTO ---
  {
    tema: 'aprendizado-desenvolvimento',
    subtema: 'Amplitude Técnica',
    texto:
      'Gosto de conhecer diferentes atividades, mesmo quando não fazem parte da minha rotina principal.',
    textoSimples: 'Gosto de conhecer outras tarefas, além da minha.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'aprendizado-desenvolvimento',
    subtema: 'Canal de Aprendizado',
    texto:
      'Consigo começar uma atividade nova mesmo sem ter entendido todos os detalhes antes.',
    textoSimples: 'Consigo começar algo novo sem entender todos os detalhes.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'aprendizado-desenvolvimento',
    subtema: 'Reação a Desvios',
    texto:
      'Depois de corrigir uma situação que saiu diferente do esperado, prefiro seguir para a próxima atividade.',
    textoSimples:
      'Depois de corrigir um problema, prefiro seguir para a próxima tarefa.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'aprendizado-desenvolvimento',
    subtema: 'Âncora de Carreira',
    texto:
      'Quando uma atividade já faz parte da minha rotina, não vejo necessidade de buscar novas responsabilidades com frequência.',
    textoSimples:
      'Se a tarefa já é rotina, não preciso buscar responsabilidade nova.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'aprendizado-desenvolvimento',
    subtema: 'Relação com Liderança',
    texto:
      'Depois de entender o que precisa ser feito, prefiro conduzir a atividade sem receber orientações durante toda a execução.',
    textoSimples:
      'Depois de entender o serviço, prefiro fazer sem ninguém orientando.',
    polo: 1,
    discrimina: true
  },

  // --- FOCO NO CLIENTE ---
  {
    tema: 'foco-cliente',
    subtema: 'Foco da Entrega',
    texto:
      'Quando entrego uma atividade para outra etapa do processo, costumo pensar também em como o resultado será utilizado por quem recebe.',
    textoSimples: 'Quando passo meu serviço adiante, penso em quem vai usar.',
    polo: 1,
    discrimina: false
  },
  {
    tema: 'foco-cliente',
    subtema: 'Formato de Trabalho',
    texto:
      'Quando tenho uma atividade sob minha responsabilidade, prefiro concentrar minha atenção nela sem depender de muitas interações.',
    textoSimples:
      'Prefiro me concentrar na minha tarefa, sem depender de muita conversa.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'foco-cliente',
    subtema: 'Estilo de Comunicação',
    texto:
      'Antes de passar uma informação de trabalho, costumo considerar o contexto da pessoa que vai recebê-la.',
    textoSimples: 'Antes de passar um recado, penso em quem vai receber.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'foco-cliente',
    subtema: 'Apoio aos Pares',
    texto:
      'Mesmo quando outra pessoa está com uma demanda maior, prefiro concluir primeiro aquilo que está sob minha responsabilidade.',
    textoSimples:
      'Mesmo com colega apertado, prefiro terminar primeiro o meu serviço.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'foco-cliente',
    subtema: 'Contato Interno',
    texto:
      'Para resolver um alinhamento simples, não vejo necessidade de registrar ou formalizar toda comunicação.',
    textoSimples: 'Para combinar algo simples, não preciso deixar registrado.',
    polo: 1,
    discrimina: true
  },

  // --- ÉTICA, SEGURANÇA E RESPEITO ---
  {
    tema: 'etica-seguranca',
    subtema: 'Diretrizes de Segurança',
    texto:
      'Durante uma atividade, costumo prestar atenção também ao que pode afetar a segurança das pessoas ao redor.',
    textoSimples: 'Enquanto trabalho, cuido da segurança de quem está perto.',
    polo: 1,
    discrimina: false
  },
  {
    tema: 'etica-seguranca',
    subtema: 'Gestão de Conflitos',
    texto:
      'Quando discordo de uma forma de trabalho, prefiro conversar sobre o assunto antes de expor minha posição para outras pessoas.',
    textoSimples:
      'Se discordo de algo, prefiro conversar antes de falar para os outros.',
    polo: 1,
    discrimina: false
  },
  {
    tema: 'etica-seguranca',
    subtema: 'Necessidade de Acompanhamento',
    texto:
      'Depois de entender uma atividade, consigo seguir com a execução sem precisar confirmar cada etapa.',
    textoSimples: 'Depois de entender a tarefa, sigo sem confirmar cada passo.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'etica-seguranca',
    subtema: 'Regime de Escala',
    texto:
      'Prefiro saber com antecedência como estarão organizados meus horários de trabalho.',
    textoSimples: 'Prefiro saber meus horários de trabalho com antecedência.',
    polo: 1,
    discrimina: false
  },
  {
    tema: 'etica-seguranca',
    subtema: 'Reação à Pressão',
    texto:
      'Quando o ritmo do trabalho aumenta bastante, prefiro ajustar a forma de executar a atividade antes de tentar manter o mesmo ritmo.',
    textoSimples:
      'Quando o serviço aperta, prefiro mudar o jeito de fazer a correr.',
    polo: 1,
    discrimina: true
  },

  // --- EXECUÇÃO E RITMO DE TRABALHO ---
  {
    tema: 'execucao-ritmo',
    subtema: 'Modo de Execução',
    texto:
      'Quando a atividade está dentro do ritmo esperado, não costumo interromper a execução para conferir detalhes que já foram verificados.',
    textoSimples: 'Se o serviço está no ritmo, não paro para conferir de novo.',
    polo: -1,
    discrimina: true
  },
  {
    tema: 'execucao-ritmo',
    subtema: 'Organização do Dia',
    texto:
      'Quando várias demandas aparecem ao mesmo tempo, consigo alternar entre elas sem precisar concluir uma antes de iniciar outra.',
    textoSimples: 'Consigo alternar entre tarefas sem terminar uma antes.',
    polo: -1,
    discrimina: true
  },
  {
    tema: 'execucao-ritmo',
    subtema: 'Relação com a Rotina',
    texto:
      'Quando a rotina de trabalho muda pouco ao longo do tempo, consigo manter meu ritmo sem precisar de muitas variações nas atividades.',
    textoSimples: 'Mesmo com rotina que muda pouco, mantenho meu ritmo.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'execucao-ritmo',
    subtema: 'Gestão de Prazos',
    texto:
      'Quando percebo que uma atividade pode não ficar pronta no horário previsto, prefiro avisar antes de tentar acelerar sua execução.',
    textoSimples: 'Se vou atrasar, prefiro avisar antes de tentar correr.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'execucao-ritmo',
    subtema: 'Energia de Trabalho',
    texto:
      'Prefiro manter aproximadamente o mesmo ritmo de trabalho ao longo do período, mesmo quando há momentos de maior demanda.',
    textoSimples: 'Prefiro o mesmo ritmo o turno todo, mesmo nos picos.',
    polo: 1,
    discrimina: true
  },

  // --- REGRAS, MÉTODOS E DECISÃO ---
  {
    tema: 'regras-decisao',
    subtema: 'Cumprimento de Regras',
    texto:
      'Quando encontro uma situação diferente da prevista, prefiro primeiro entender como ela deve ser tratada antes de alterar a forma de execução.',
    textoSimples:
      'Em situação diferente, prefiro entender a regra antes de mudar.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'regras-decisao',
    subtema: 'Tomada de Decisão',
    texto:
      'Quando preciso decidir rapidamente, consigo agir mesmo sem reunir todas as informações disponíveis.',
    textoSimples: 'Quando preciso decidir rápido, consigo agir sem saber tudo.',
    polo: -1,
    discrimina: true
  },
  {
    tema: 'regras-decisao',
    subtema: 'Gestão de Risco',
    texto:
      'Quando uma forma diferente de realizar uma atividade pode trazer algum ganho, prefiro primeiro entender suas possíveis consequências.',
    textoSimples:
      'Antes de tentar um jeito novo, prefiro entender o que pode acontecer.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'regras-decisao',
    subtema: 'Resolução de Falhas',
    texto:
      'Quando uma falha permite que o trabalho continue de alguma forma, prefiro resolver primeiro a continuidade da atividade.',
    textoSimples:
      'Quando algo falha, prefiro manter o serviço andando primeiro.',
    polo: -1,
    discrimina: true
  },

  // --- INTERAÇÃO SOCIAL E CONVIVÊNCIA ---
  {
    tema: 'interacao-convivencia',
    subtema: 'Ambiente de Trabalho',
    texto:
      'Durante uma atividade, consigo manter meu foco mesmo quando há pouca interação com outras pessoas.',
    textoSimples:
      'Consigo me concentrar mesmo conversando pouco com os outros.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'interacao-convivencia',
    subtema: 'Estilo de Comunicação',
    texto:
      'Quando uma informação é objetiva, prefiro transmiti-la sem acrescentar muito contexto.',
    textoSimples: 'Recado simples eu passo direto, sem explicar muito.',
    polo: -1,
    discrimina: true
  },
  {
    tema: 'interacao-convivencia',
    subtema: 'Gestão de Divergências',
    texto:
      'Quando discordo de alguém no trabalho, prefiro resolver o assunto diretamente com a pessoa envolvida.',
    textoSimples:
      'Se discordo de alguém, prefiro resolver direto com a pessoa.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'interacao-convivencia',
    subtema: 'Âmbito de Ação',
    texto:
      'Quando percebo que outra atividade precisa de atenção, costumo avaliar se posso contribuir mesmo que ela não esteja diretamente sob minha responsabilidade.',
    textoSimples: 'Se vejo outra tarefa precisando, penso se posso ajudar.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'interacao-convivencia',
    subtema: 'Contato Interno',
    texto:
      'Para pequenos alinhamentos do dia a dia, prefiro conversar diretamente com a pessoa envolvida.',
    textoSimples: 'Para combinar coisas do dia a dia, prefiro falar direto.',
    polo: 1,
    discrimina: true
  },

  // --- LIDERANÇA, AUTONOMIA E APRENDIZAGEM ---
  {
    tema: 'lideranca-autonomia',
    subtema: 'Dependência de Chefia',
    texto:
      'Depois que recebo um objetivo claro, consigo organizar a execução sem precisar de orientações frequentes.',
    textoSimples:
      'Com um objetivo claro, me organizo sem orientação toda hora.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'lideranca-autonomia',
    subtema: 'Procura de Validação',
    texto:
      'Depois de concluir uma etapa do trabalho, costumo querer saber se o resultado está de acordo antes de seguir.',
    textoSimples: 'Depois de cada etapa, gosto de saber se ficou certo.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'lideranca-autonomia',
    subtema: 'Perfil Profissional',
    texto:
      'Prefiro conhecer bem uma atividade antes de assumir outras diferentes.',
    textoSimples: 'Prefiro dominar uma tarefa antes de pegar outras.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'lideranca-autonomia',
    subtema: 'Forma de Aprender',
    texto:
      'Aprendo melhor quando consigo observar ou realizar a atividade enquanto recebo as orientações.',
    textoSimples: 'Aprendo melhor fazendo ou vendo, enquanto alguém explica.',
    polo: 1,
    discrimina: false
  },

  // --- ADAPTAÇÃO A MUDANÇAS E CARREIRA ---
  {
    tema: 'adaptacao-carreira',
    subtema: 'Adoção de Mudanças',
    texto:
      'Quando uma forma de trabalho já funciona bem, prefiro esperar antes de mudar para uma alternativa nova.',
    textoSimples:
      'Se um jeito de trabalhar funciona, prefiro esperar antes de mudar.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'adaptacao-carreira',
    subtema: 'Ambição Principal',
    texto:
      'Uma atividade em que já conheço bem minhas responsabilidades pode continuar sendo interessante para mim por bastante tempo.',
    textoSimples: 'Uma tarefa que conheço bem me interessa por muito tempo.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'adaptacao-carreira',
    subtema: 'Reação ao Próprio Erro',
    texto:
      'Depois de receber uma correção sobre uma atividade, consigo retomar o trabalho sem permanecer muito tempo revisando o que aconteceu.',
    textoSimples:
      'Depois de uma correção, volto ao serviço sem ficar remoendo.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'adaptacao-carreira',
    subtema: 'Regime de Horário',
    texto:
      'Tenho facilidade para reorganizar meus horários de trabalho quando surge uma necessidade operacional.',
    textoSimples: 'Consigo mudar meus horários quando o trabalho precisa.',
    polo: 1,
    discrimina: true
  },
  // "EXPECTATIVAS FUTURAS" entra neste tema: ver `fit-axes.ts`.
  {
    tema: 'adaptacao-carreira',
    subtema: 'Direção de Desenvolvimento',
    texto:
      'Nos próximos anos, gostaria de conhecer cada vez melhor as atividades que já fazem parte da minha área de trabalho.',
    textoSimples: 'Nos próximos anos, quero conhecer melhor a minha área.',
    polo: 1,
    discrimina: false
  },
  {
    tema: 'adaptacao-carreira',
    subtema: 'Mudança de Responsabilidades',
    texto:
      'Se minhas responsabilidades continuarem semelhantes às atuais, ainda posso me imaginar satisfeito(a) com minha trajetória profissional.',
    textoSimples: 'Fico satisfeito se minhas tarefas continuarem parecidas.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'adaptacao-carreira',
    subtema: 'Aprendizado Futuro',
    texto:
      'Tenho interesse em aprender assuntos diferentes dos que utilizo atualmente no trabalho.',
    textoSimples: 'Quero aprender coisas diferentes do que uso hoje.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'adaptacao-carreira',
    subtema: 'Trajetória Profissional',
    texto:
      'Consigo me imaginar seguindo uma trajetória profissional parecida com a que tenho hoje.',
    textoSimples: 'Me imagino seguindo um caminho parecido com o de hoje.',
    polo: 1,
    discrimina: true
  },
  {
    tema: 'adaptacao-carreira',
    subtema: 'Relação com Novas Oportunidades',
    texto:
      'Quando aparece uma oportunidade profissional diferente, costumo avaliar bastante antes de considerar uma mudança.',
    textoSimples:
      'Se surge uma chance diferente, penso bastante antes de mudar.',
    polo: 1,
    discrimina: true
  }
];

export const ITENS_DO_INSTRUMENTO: ItemDoInstrumento[] = ITENS.map(
  (item, indice) => ({ id: `I${String(indice + 1).padStart(2, '0')}`, ...item })
);

const ITEM_POR_ID = new Map(
  ITENS_DO_INSTRUMENTO.map((item) => [item.id, item])
);

export function getItem(itemId: string): ItemDoInstrumento | null {
  return ITEM_POR_ID.get(itemId) ?? null;
}

const ITENS_POR_TEMA = ITENS_DO_INSTRUMENTO.reduce((mapa, item) => {
  const lista = mapa.get(item.tema) ?? [];
  lista.push(item);
  mapa.set(item.tema, lista);
  return mapa;
}, new Map<FitAxisId, ItemDoInstrumento[]>());

export function itensDoTema(tema: FitAxisId): ItemDoInstrumento[] {
  return ITENS_POR_TEMA.get(tema) ?? [];
}

/**
 * A resposta no sentido do tema: espelhada (6 − valor) quando o item tem
 * polo −1. É o que permite tirar média de frases de um par oposto sem que
 * uma anule a outra.
 */
export function alinharAoPolo(item: ItemDoInstrumento, valor: number): number {
  return item.polo === 1 ? valor : ESCALA_MIN + ESCALA_MAX - valor;
}

/* ------------------------------------------------------------------ *
 * Pares
 * ------------------------------------------------------------------ */

export type ParDeItens = {
  /** Item de referência (polo 1). */
  itemA: string;
  itemB: string;
  subtema: string;
  /** O polo que o "concordo" do item A descreve. */
  poloA: string;
  /** O polo que o "concordo" do item B descreve. */
  poloB: string;
};

/**
 * Subtemas que se repetem entre temas com sentidos **opostos**.
 *
 * Concordar com uma frase do par equivale a discordar da outra. O item B tem
 * `polo: -1`. Servem a duas coisas: a média do tema não se anula, e a
 * aderência de uma frase pode usar a média da empresa na frase oposta quando
 * a própria não fechou (espelhando o valor).
 */
export const PARES_INVERTIDOS: ParDeItens[] = [
  {
    itemA: 'I01',
    itemB: 'I26',
    subtema: 'Modo de Execução',
    poloA: 'conferir cada etapa',
    poloB: 'seguir sem conferir de novo'
  },
  {
    itemA: 'I03',
    itemB: 'I27',
    subtema: 'Organização do Dia',
    poloA: 'concluir uma antes de outra',
    poloB: 'alternar sem concluir'
  },
  {
    itemA: 'I05',
    itemB: 'I32',
    subtema: 'Tomada de Decisão',
    poloA: 'reunir informação antes de decidir',
    poloB: 'agir sem reunir tudo'
  },
  {
    itemA: 'I08',
    itemB: 'I34',
    subtema: 'Resolução de Falhas',
    poloA: 'investigar a causa antes de retomar',
    poloB: 'garantir a continuidade primeiro'
  },
  {
    itemA: 'I18',
    itemB: 'I36',
    subtema: 'Estilo de Comunicação',
    poloA: 'considerar o contexto de quem recebe',
    poloB: 'transmitir sem acrescentar contexto'
  }
];

/**
 * Subtemas que se repetem com o **mesmo** sentido: a segunda frase confirma a
 * primeira. Não mudam o polo; entram só na comparação entre pares, sem
 * espelhar o valor.
 */
export const PARES_EQUIVALENTES: ParDeItens[] = [
  {
    itemA: 'I02',
    itemB: 'I29',
    subtema: 'Gestão de Prazos',
    poloA: 'avisar do atraso',
    poloB: 'avisar antes de acelerar'
  },
  {
    itemA: 'I04',
    itemB: 'I30',
    subtema: 'Energia de Trabalho',
    poloA: 'ritmo constante',
    poloB: 'ritmo constante'
  },
  {
    itemA: 'I06',
    itemB: 'I44',
    subtema: 'Adoção de Mudanças',
    poloA: 'esperar a mudança firmar',
    poloB: 'esperar antes de mudar'
  },
  {
    itemA: 'I07',
    itemB: 'I33',
    subtema: 'Gestão de Risco',
    poloA: 'o que já foi testado',
    poloB: 'entender as consequências antes'
  },
  {
    itemA: 'I20',
    itemB: 'I39',
    subtema: 'Contato Interno',
    poloA: 'combinar sem formalizar',
    poloB: 'conversar direto'
  }
];

/** A outra frase do par, e se ela está no sentido oposto. */
export function parDoItem(
  itemId: string
): { outro: string; invertido: boolean } | null {
  for (const par of PARES_INVERTIDOS) {
    if (par.itemA === itemId) return { outro: par.itemB, invertido: true };
    if (par.itemB === itemId) return { outro: par.itemA, invertido: true };
  }
  for (const par of PARES_EQUIVALENTES) {
    if (par.itemA === itemId) return { outro: par.itemB, invertido: false };
    if (par.itemB === itemId) return { outro: par.itemA, invertido: false };
  }
  return null;
}

/**
 * A frase discriminante que representa cada tema quando a empresa ainda não
 * tem base para escolher a sua. É a que o candidato recebe, marcada
 * `semBaseDaEmpresa`, e que não pesa até o perfil fechar.
 */
export const ITEM_PADRAO_POR_TEMA: Record<FitAxisId, string> = {
  'orientacao-resultados': 'I03',
  inovacao: 'I06',
  'aprendizado-desenvolvimento': 'I11',
  'foco-cliente': 'I17',
  'etica-seguranca': 'I25',
  'execucao-ritmo': 'I27',
  'regras-decisao': 'I31',
  'interacao-convivencia': 'I35',
  'lideranca-autonomia': 'I40',
  'adaptacao-carreira': 'I47'
};

/* ------------------------------------------------------------------ *
 * Amostragem em matriz (colaborador)
 * ------------------------------------------------------------------ */

/**
 * Quantas frases cada colaborador responde.
 *
 * A conta: com 10 convidados (o máximo que o IEL pede de uma vez, ver
 * `MAX_SAMPLE_SIZE`), cada frase precisa de pelo menos 3 respostas
 * (`MIN_TEAM_RESPONSES`) — são 52 × 3 = 156 respostas. 10 × 15 = 150 não
 * alcança; 10 × 16 = 160 alcança, com 4 frases recebendo uma quarta resposta.
 * Por isso 16, "cerca de 15 frases, uns 5 minutos".
 *
 * Com menos convidados nem toda frase chega a 3, e o tema fecha pelas que
 * chegarem — `perfilDaEmpresa` exige uma frase discriminante fechada por tema,
 * não todas.
 */
export const TAMANHO_DO_BLOCO = 16;

/**
 * A ordem do rodízio: um item de cada tema por vez, com a frase padrão do
 * tema primeiro e as não discriminantes por último.
 *
 * Assim um bloco de 16 frases consecutivas passa por todos os 10 temas, e as
 * frases que o rodízio alcança primeiro são as que mais servem ao candidato.
 */
export const ORDEM_DO_RODIZIO: string[] = (() => {
  const filas = new Map<FitAxisId, string[]>();
  for (const [tema, itens] of ITENS_POR_TEMA) {
    const padrao = ITEM_PADRAO_POR_TEMA[tema];
    const ordenados = [...itens].sort((a, b) => {
      const pesoA = a.id === padrao ? 0 : a.discrimina ? 1 : 2;
      const pesoB = b.id === padrao ? 0 : b.discrimina ? 1 : 2;
      return pesoA - pesoB;
    });
    filas.set(
      tema,
      ordenados.map((item) => item.id)
    );
  }

  const ordem: string[] = [];
  let restantes = ITENS_DO_INSTRUMENTO.length;
  while (restantes > 0) {
    for (const fila of filas.values()) {
      const proximo = fila.shift();
      if (proximo) {
        ordem.push(proximo);
        restantes -= 1;
      }
    }
  }
  return ordem;
})();

/** Deslocamento do rodízio por empresa: estável, derivado do id. */
function deslocamentoDaEmpresa(empresaId: string): number {
  let hash = 0;
  for (const char of `rodizio:${empresaId}`) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash % ORDEM_DO_RODIZIO.length;
}

/** As frases do convite de índice `indice` (0, 1, 2…) naquela empresa. */
export function blocoDoIndice(empresaId: string, indice: number): string[] {
  const total = ORDEM_DO_RODIZIO.length;
  const inicio = deslocamentoDaEmpresa(empresaId) + indice * TAMANHO_DO_BLOCO;
  return Array.from(
    { length: TAMANHO_DO_BLOCO },
    (_, passo) => ORDEM_DO_RODIZIO[(inicio + passo) % total]!
  );
}

/**
 * Os blocos de uma amostra de `nConvidados` pessoas.
 *
 * Rodízio determinístico: o convite 0 começa num ponto da ordem, o convite 1
 * começa 16 frases depois, e assim por diante, dando a volta nas 52. Com 10
 * convidados são 160 posições seguidas, então cada frase aparece 3 ou 4
 * vezes.
 */
export function montarBlocosDoColaborador(
  empresaId: string,
  nConvidados: number
): string[][] {
  return Array.from({ length: Math.max(0, nConvidados) }, (_, indice) =>
    blocoDoIndice(empresaId, indice)
  );
}

/**
 * Posição do convite na amostra da empresa, a partir do id.
 *
 * Os convites têm id sequencial por empresa (`INV-EMP01-03`): o número final
 * é a ordem de envio. Derivar daqui mantém o bloco estável sem gravar nada a
 * mais no convite.
 */
export function indiceDoConvite(inviteId: string): number {
  const final = /(\d+)$/.exec(inviteId);
  if (!final) return 0;
  return Math.max(0, Number(final[1]) - 1);
}

/** As frases que aquele convite responde, na ordem do rodízio. */
export function blocoDoConvite(convite: {
  id: string;
  companyId: string;
}): ItemDoInstrumento[] {
  return blocoDoIndice(convite.companyId, indiceDoConvite(convite.id))
    .map((itemId) => getItem(itemId))
    .filter((item): item is ItemDoInstrumento => item !== null);
}
