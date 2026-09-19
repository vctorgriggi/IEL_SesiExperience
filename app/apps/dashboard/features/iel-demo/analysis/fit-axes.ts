/**
 * Os temas do fit: as dimensões em que empresa e pessoa são comparadas.
 *
 * Até 2026-09-19 eram cinco "pontos do dia a dia" com três alternativas cada.
 * O cliente entregou o instrumento dele (`docs/cliente/04-perguntas-empresa.xlsx`):
 * 52 afirmações em primeira pessoa, agrupadas em temas, respondidas numa
 * escala de concordância. Os temas da planilha viram as dimensões do fit; as
 * afirmações moram em `instrumento.ts`.
 *
 * A planilha traz 11 grupos. "EXPECTATIVAS FUTURAS" foi juntado a "ADAPTAÇÃO
 * A MUDANÇAS E CARREIRA": as cinco frases dele falam de trajetória e de
 * oportunidade nova, que é o mesmo assunto das quatro de carreira, e um tema
 * só de futuro ficaria com peso próprio na vaga sem descrever nada que a
 * empresa pratique hoje. Com isso ficam 10 temas, e a tela lê "os 10 temas".
 * O "IDERANÇA" da planilha é "LIDERANÇA".
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
  | 'adaptacao-carreira';

export type FitAxis = {
  id: FitAxisId;
  /**
   * O que a pessoa lê na tela.
   *
   * Palavra comum, não o nome do tópico: quem usa o produto é a analista, o
   * RH de uma indústria e um candidato operacional no celular. "Orientação
   * para resultados" é vocabulário de quem desenhou o instrumento; "jeito de
   * entregar" é a mesma coisa em português corrente. O `id` não muda.
   */
  label: string;
  /** O tópico como está na planilha do cliente (grafia corrigida). */
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
    label: 'Jeito de entregar',
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
    label: 'Mudanças e novidades',
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
    label: 'Aprender coisas novas',
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
    label: 'Pensar em quem recebe',
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
    label: 'Segurança e respeito',
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
    label: 'Ritmo do turno',
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
    label: 'Regras e decisões',
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
    label: 'Convivência',
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
    label: 'Autonomia',
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
    label: 'Carreira e futuro',
    tituloOriginal:
      'Adaptação a mudanças e carreira (com expectativas futuras)',
    description:
      'Flexibilidade de horário, relação com mudança e o caminho que a pessoa imagina para si.',
    companyQuestion:
      'A função pede reorganizar horários com frequência, e há caminho para crescer?',
    talentQuestion:
      'Você consegue mudar seus horários quando o trabalho precisa?'
  }
];

export function getFitAxis(axisId: FitAxisId): FitAxis {
  return FIT_AXES.find((axis) => axis.id === axisId) ?? FIT_AXES[0]!;
}
