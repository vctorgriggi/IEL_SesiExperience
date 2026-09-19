/**
 * Eixos de aderência ao contexto de trabalho.
 *
 * O enunciado dedica uma página inteira ao fit cultural: diz que a abordagem
 * gera valor e que o desafio é "ampliar essa abordagem, reduzir suas
 * limitações e integrá-la a uma jornada centralizada". As limitações listadas
 * são custo, tempo, escala e o fato de viver numa plataforma separada.
 *
 * Nada disso se resolve com um resultado de fit vindo de fora. Resolve-se
 * quando os dois lados são descritos nos mesmos termos, dentro da jornada, a
 * partir do que já foi informado: a equipe declara como trabalha, a pessoa
 * declara o que espera, e a leitura acontece eixo a eixo.
 *
 * Duas restrições moldam este vocabulário:
 *
 * - O enunciado veda usar dados de saúde e manda tratar bem-estar "sob a
 *   perspectiva do ambiente, bem-estar, relações de trabalho, pertencimento e
 *   condições organizacionais". Todos os eixos aqui são condições de trabalho
 *   observáveis, não traços de personalidade.
 * - O briefing reforça: a dimensão organizacional "considera contexto, não
 *   semelhança de personalidade entre as pessoas". "Precisa de orientação
 *   inicial" descreve uma condição, não uma limitação da pessoa.
 */

export type FitAxisId =
  | 'apoio-inicial'
  | 'autonomia'
  | 'comunicacao-prioridades'
  | 'ritmo-turno'
  | 'aprendizado';

export type FitAxis = {
  id: FitAxisId;
  label: string;
  /** O que o eixo descreve, para a leitura não virar julgamento de pessoa. */
  description: string;
  /** Como a condição é perguntada à empresa. */
  companyQuestion: string;
  /** Como a preferência é perguntada à pessoa. */
  talentQuestion: string;
};

export const FIT_AXES: FitAxis[] = [
  {
    id: 'apoio-inicial',
    label: 'Apoio nas primeiras atividades',
    description:
      'Se há alguém acompanhando nas primeiras semanas, e o que a pessoa espera nesse período.',
    companyQuestion:
      'Quem acompanha a pessoa nas primeiras atividades, e em quais horários?',
    talentQuestion:
      'No início em uma função nova, você prefere acompanhamento de alguém da equipe ou seguir por conta?'
  },
  {
    id: 'autonomia',
    label: 'Autonomia na execução',
    description:
      'Quanto da rotina é executado sem supervisão direta, e como a pessoa prefere trabalhar.',
    companyQuestion:
      'A rotina é executada com ou sem supervisão direta durante o turno?',
    talentQuestion:
      'Você prefere uma rotina definida por outra pessoa ou organizar o próprio trabalho?'
  },
  {
    id: 'comunicacao-prioridades',
    label: 'Comunicação de prioridades',
    description:
      'Como as prioridades chegam à pessoa no dia a dia, e como ela prefere recebê-las.',
    companyQuestion: 'Como as prioridades do dia chegam até a equipe?',
    talentQuestion:
      'Você prefere receber as prioridades por escrito, verbalmente no início do turno, ou combinar?'
  },
  {
    id: 'ritmo-turno',
    label: 'Turno e previsibilidade',
    description:
      'O turno praticado e o quanto a disponibilidade da pessoa é firme ou negociável.',
    companyQuestion:
      'Qual o turno e há variação de horário ao longo da semana?',
    talentQuestion:
      'O turno informado é firme para você ou há margem de negociação?'
  },
  {
    id: 'aprendizado',
    label: 'Aprendizado na função',
    description:
      'O que a função exige aprender no início e o que a pessoa espera aprender.',
    companyQuestion: 'O que a pessoa precisa aprender nas primeiras semanas?',
    talentQuestion: 'O que você espera aprender nesta oportunidade?'
  }
];

export function getFitAxis(axisId: FitAxisId): FitAxis {
  return FIT_AXES.find((axis) => axis.id === axisId) ?? FIT_AXES[0]!;
}
