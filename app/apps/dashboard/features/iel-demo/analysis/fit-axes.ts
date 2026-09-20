/**
 * Os temas do fit: as dimensões em que empresa e pessoa são comparadas.
 *
 * Até 2026-09-19 eram cinco "pontos do dia a dia" com três alternativas cada.
 * O cliente entregou o instrumento dele (`docs/cliente/04-perguntas-empresa.xlsx`):
 * 52 afirmações em primeira pessoa, agrupadas em temas, respondidas numa
 * escala de concordância. Os temas da planilha viram as dimensões do fit; as
 * afirmações moram em `instrumento.ts`.
 *
 * A planilha traz 11 tópicos, e são os 11 temas daqui. Até 2026-09-20
 * "EXPECTATIVAS FUTURAS" tinha sido juntado a "ADAPTAÇÃO A MUDANÇAS E
 * CARREIRA"; o dono do produto desfez a junção ("não muda as perguntas, nem
 * o sentido dela, nem a categoria"): o instrumento tem a estrutura que o
 * cliente desenhou, e a tela lê "os 11 temas". O "IDERANÇA" da planilha é
 * "LIDERANÇA".
 *
 * Duas restrições continuam moldando o vocabulário:
 *
 * - O enunciado veda dado de saúde e manda tratar bem-estar pela perspectiva
 *   do ambiente e das relações de trabalho. Os temas descrevem como se
 *   trabalha, nunca traço de personalidade.
 * - A dimensão organizacional "considera contexto, não semelhança de
 *   personalidade entre as pessoas". Nenhum tema tem lado certo.
 */

export type FitAxisId =
  | 'orientacao-resultados'
  | 'inovacao'
  | 'aprendizado-desenvolvimento'
  | 'foco-cliente'
  | 'etica-seguranca'
  | 'execucao-ritmo'
  | 'regras-decisao'
  | 'interacao-convivencia'
  | 'lideranca-autonomia'
  | 'adaptacao-carreira'
  | 'expectativas-futuras';

export type FitAxis = {
  id: FitAxisId;
  /**
   * O que a pessoa lê na tela: o tópico da planilha do cliente, em caixa de
   * frase.
   *
   * Até 2026-09-20 era uma palavra comum inventada aqui ("Jeito de
   * entregar", "Ritmo do turno"). O dono do produto pediu a nomenclatura do
   * cliente: a planilha "foi feita com rigor" e mudar nome, frase ou
   * categoria "é meio paia". O que precisa de espaço curto usa
   * `AXIS_SHORT_LABEL` (`copy.ts`), derivado deste nome. O `id` não muda.
   */
  label: string;
  /** O tópico como está na planilha do cliente (caixa alta lá; grafia corrigida). */
  tituloOriginal: string;
  /** O que o tema descreve, para a leitura não virar julgamento de pessoa. */
  description: string;
  /** Pergunta de confirmação para a gestão, quando o tema fica em aberto. */
  companyQuestion: string;
  /** Pergunta de coleta dirigida para a pessoa, quando falta o lado dela. */
  talentQuestion: string;
};

export const FIT_AXES: FitAxis[] = [
  {
    id: 'orientacao-resultados',
    label: 'Orientação para resultados',
    tituloOriginal: 'Orientação para resultados',
    description:
      'Como a entrega acontece: conferir cada etapa, terminar uma coisa antes da outra, avisar quando vai atrasar.',
    companyQuestion:
      'Na equipe, o esperado é conferir cada etapa e concluir uma tarefa antes da outra?',
    talentQuestion:
      'Você prefere terminar uma tarefa antes de começar outra, conferindo cada etapa?'
  },
  {
    id: 'inovacao',
    label: 'Inovação',
    tituloOriginal: 'Inovação',
    description:
      'Como a equipe lida com ferramenta nova, jeito novo de fazer e situação fora do procedimento.',
    companyQuestion:
      'Quando chega ferramenta ou método novo, a equipe adota logo ou espera a mudança firmar?',
    talentQuestion:
      'Quando chega uma ferramenta nova, você prefere usar logo ou esperar a mudança firmar?'
  },
  {
    id: 'aprendizado-desenvolvimento',
    label: 'Aprendizado e desenvolvimento',
    tituloOriginal: 'Aprendizado e desenvolvimento',
    description:
      'Quanto a função pede conhecer outras atividades e assumir responsabilidade nova.',
    companyQuestion:
      'A função pede conhecer outras atividades além da rotina principal?',
    talentQuestion:
      'Você gosta de conhecer outras tarefas, além da sua rotina principal?'
  },
  {
    id: 'foco-cliente',
    label: 'Foco no cliente',
    tituloOriginal: 'Foco no cliente',
    description:
      'Quanto a entrega considera a próxima etapa e as pessoas que vão usar o resultado.',
    companyQuestion:
      'Na equipe, cada um se concentra na própria tarefa ou pensa junto com a próxima etapa?',
    talentQuestion:
      'Você prefere se concentrar na sua tarefa ou acompanhar quem vai receber o seu serviço?'
  },
  {
    id: 'etica-seguranca',
    label: 'Ética, segurança e respeito',
    tituloOriginal: 'Ética, segurança e respeito',
    description:
      'Atenção à segurança, forma de discordar, previsibilidade da escala e reação à pressão.',
    companyQuestion:
      'Quando o ritmo aperta, a equipe ajusta o jeito de fazer ou mantém o mesmo ritmo?',
    talentQuestion:
      'Quando o serviço aperta, você prefere ajustar o jeito de fazer ou manter o ritmo?'
  },
  {
    id: 'execucao-ritmo',
    label: 'Execução e ritmo de trabalho',
    tituloOriginal: 'Execução e ritmo de trabalho',
    description:
      'Se o turno pede alternar entre demandas ou seguir uma de cada vez, e quanto o ritmo varia.',
    companyQuestion:
      'No turno, as demandas chegam juntas e é preciso alternar entre elas?',
    talentQuestion:
      'Você consegue alternar entre várias tarefas ou prefere uma de cada vez?'
  },
  {
    id: 'regras-decisao',
    label: 'Regras, métodos e decisão',
    tituloOriginal: 'Regras, métodos e decisão',
    description:
      'Se a decisão espera entender a regra e as consequências, ou se é preciso agir rápido.',
    companyQuestion:
      'Diante do imprevisto, a equipe para para entender a regra ou decide rápido?',
    talentQuestion:
      'Diante de algo diferente, você prefere entender a regra antes ou decidir rápido?'
  },
  {
    id: 'interacao-convivencia',
    label: 'Interação social e convivência',
    tituloOriginal: 'Interação social e convivência',
    description:
      'Quanto o trabalho acontece em conversa com os outros, e como os combinados circulam.',
    companyQuestion:
      'Os combinados do dia a dia são feitos conversando direto entre as pessoas?',
    talentQuestion:
      'Você prefere combinar as coisas conversando direto com as pessoas?'
  },
  {
    id: 'lideranca-autonomia',
    label: 'Liderança, autonomia e aprendizagem',
    tituloOriginal: 'Liderança, autonomia e aprendizagem',
    description:
      'Quanto acompanhamento a pessoa recebe da chefia, e quanto se espera que se organize sozinha.',
    companyQuestion:
      'Depois de receber o objetivo, a pessoa se organiza sozinha ou tem acompanhamento próximo?',
    talentQuestion:
      'Você prefere se organizar sozinho ou ter alguém acompanhando de perto?'
  },
  {
    id: 'adaptacao-carreira',
    label: 'Adaptação a mudanças e carreira',
    tituloOriginal: 'Adaptação a mudanças e carreira',
    description:
      'Flexibilidade de horário, relação com mudança de método e como a pessoa retoma o trabalho depois de uma correção.',
    companyQuestion:
      'A função pede reorganizar horários com frequência e mudar de método com pouco aviso?',
    talentQuestion:
      'Você consegue mudar seus horários quando o trabalho precisa?'
  },
  {
    id: 'expectativas-futuras',
    label: 'Expectativas futuras',
    tituloOriginal: 'Expectativas futuras',
    description:
      'O caminho que a pessoa imagina para si nos próximos anos: aprofundar o que já faz ou aprender assuntos diferentes.',
    companyQuestion:
      'Na função, o caminho esperado é aprofundar a mesma atividade ou há passagem para outras áreas?',
    talentQuestion:
      'Nos próximos anos, você prefere conhecer melhor a sua área ou aprender assuntos diferentes?'
  }
];

export function getFitAxis(axisId: FitAxisId): FitAxis {
  return FIT_AXES.find((axis) => axis.id === axisId) ?? FIT_AXES[0]!;
}

/** Os ids dos 11 temas, na ordem da planilha do cliente. */
export const FIT_AXIS_IDS: FitAxisId[] = FIT_AXES.map((axis) => axis.id);

/**
 * Quantas competências a empresa pode escolher para o questionário.
 *
 * O IEL escreveu o limite (20/09/2026): "o fluxo de envio do questionário
 * para os colaboradores da empresa responder deve ser adaptável a escolher
 * quais competências a empresa julga relevante dentre as 11 criadas, podendo
 * selecionar entre 3 a 11 competências".
 *
 * O piso de 3 não é enfeite de formulário: abaixo disso a aderência vira um
 * número sobre quase nada — 100% em dois temas não diz o mesmo que 100% em
 * oito —, e o denominador visível (`coverage`) perderia o sentido. Por isso a
 * regra mora no reducer, e não só na tela.
 */
export const MINIMO_DE_COMPETENCIAS = 3;
export const MAXIMO_DE_COMPETENCIAS = FIT_AXES.length;

/**
 * A escolha da empresa, normalizada: sem id desconhecido, sem repetição e
 * sempre na ordem de `FIT_AXES` — a ordem é do instrumento do cliente, não a
 * ordem em que alguém clicou nas caixas.
 */
export function ordenarCompetencias(
  axisIds: readonly FitAxisId[]
): FitAxisId[] {
  const escolhidos = new Set(axisIds);
  return FIT_AXIS_IDS.filter((id) => escolhidos.has(id));
}
