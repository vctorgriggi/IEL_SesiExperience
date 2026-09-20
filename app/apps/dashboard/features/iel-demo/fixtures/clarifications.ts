import type {
  Clarification,
  ClarificationEffect,
  ClarificationRecipientKind,
  CriterionState,
  SyncEvent
} from '../types';

/**
 * Esclarecimentos que já existem na base demo: a reconfirmação de
 * disponibilidade de Ana na vaga 2 e a dúvida de disponibilidade de Diego na
 * vaga 1. As respostas são preparadas e revisáveis, nunca sorteadas.
 */
export const DEMO_CLARIFICATIONS: Clarification[] = [
  {
    id: 'ESC-01',
    jobId: 'VAG-02',
    applicationId: 'CAND-05',
    criterionId: 'CRI-203',
    recipient: {
      kind: 'candidato',
      name: 'Ana Ribeiro',
      role: 'Candidata — Assistente de Estoque',
      email: 'ana.ribeiro@example.com',
      companyId: null,
      teamId: null,
      talentId: 'ANA'
    },
    question:
      // R5: o candidato conversa com o IEL, não com a empresa. A pergunta
      // situa a vaga pela atividade e pelo horário — nunca pelo nome de quem
      // contrata, que só aparece quando a empresa decide se apresentar.
      'Você segue disponível para o horário das 8h às 17h nesta vaga de assistente de estoque numa indústria de alimentos?',
    sharedInfo:
      'Título da vaga, setor da empresa e horário previsto. Sem o nome de quem contrata, sem outros candidatos e sem anotações internas.',
    reason:
      'A disponibilidade registrada é da inscrição de 08/07/2026 e precisa de reconfirmação antes do encaminhamento.',
    state: 'solicitada',
    createdAt: '2026-09-10T13:00:00.000Z',
    answeredAt: null,
    answer: null,
    preparedAnswer:
      'Sim, continuo disponível para o horário das 8h às 17h. Posso começar a partir de outubro.',
    effects: [
      {
        applicationId: 'CAND-05',
        criterionId: 'CRI-203',
        suggestedState: 'alinhamento',
        note: 'Disponibilidade reconfirmada pela própria candidata para esta oportunidade.'
      }
    ],
    incorporatedAt: null,
    teamConditionUpdate: null
  },
  {
    id: 'ESC-02',
    jobId: 'VAG-01',
    applicationId: 'CAND-04',
    criterionId: 'CRI-103',
    recipient: {
      kind: 'candidato',
      name: 'Diego Alves',
      role: 'Candidato — Assistente de Logística',
      email: 'diego.alves@example.com',
      companyId: null,
      teamId: null,
      talentId: 'DIEGO'
    },
    question:
      'Temos duas informações diferentes sobre sua disponibilidade. Hoje você consegue trabalhar no turno das 13h às 22h?',
    sharedInfo:
      'As duas informações de disponibilidade registradas e o turno da vaga. Nada sobre outros candidatos.',
    reason:
      'O currículo indica disponibilidade integral (26/11/2025) e o registro IEL de 14/09/2026 indica apenas o período da manhã.',
    state: 'solicitada',
    createdAt: '2026-09-11T11:30:00.000Z',
    answeredAt: null,
    answer: null,
    preparedAnswer:
      'Hoje consigo trabalhar apenas no período da manhã. A informação de disponibilidade integral está desatualizada.',
    effects: [
      {
        applicationId: 'CAND-04',
        criterionId: 'CRI-103',
        suggestedState: 'divergencia',
        note: 'Conflito resolvido com a própria pessoa: a informação mais recente prevalece e não cobre o turno da vaga. Requisito obrigatório não atendido — registrar a decisão em vez de descartar automaticamente.'
      }
    ],
    incorporatedAt: null,
    teamConditionUpdate: null
  }
];

export type ClarificationTemplate = {
  jobId: string;
  criterionId: string;
  recipientKind: ClarificationRecipientKind;
  /** Pergunta sugerida pela análise assistida, revisável pelo analista. */
  suggestedQuestion: string;
  suggestedSharedInfo: string;
  reason: string;
  /** Resposta fictícia preparada, que o destinatário revisa antes de enviar. */
  preparedAnswer: string | null;
  /** Condição da equipe confirmada pela resposta. */
  teamConditionUpdate?: {
    teamId: string;
    conditionId: string;
    value: string;
  };
  /** Efeito sobre a candidatura que originou a solicitação. */
  selfEffect?: { suggestedState: CriterionState; note: string };
  /** Efeitos fixos sobre candidaturas da vaga (perguntas sobre a equipe). */
  teamEffects?: ClarificationEffect[];
};

/**
 * Perguntas e respostas preparadas para os pontos que a demonstração percorre.
 * Quando o analista cria uma solicitação fora deste catálogo, a pergunta é
 * montada a partir do critério e a resposta fica em aberto para o destinatário.
 */
export const DEMO_CLARIFICATION_TEMPLATES: ClarificationTemplate[] = [
  {
    jobId: 'VAG-01',
    criterionId: 'CRI-106',
    recipientKind: 'gestor',
    suggestedQuestion:
      'Quem poderá orientar a pessoa nas primeiras atividades e em quais horários?',
    suggestedSharedInfo:
      'Título da vaga, turno e o critério em análise. Nenhum nome de candidato e nenhuma anotação interna do IEL.',
    reason:
      'O apoio nas primeiras atividades não está informado e afeta a leitura das expectativas declaradas pelos candidatos.',
    preparedAnswer:
      'No turno desta vaga não haverá acompanhamento inicial; precisamos de alguém que já execute a rotina com independência.',
    teamConditionUpdate: {
      teamId: 'EQ-01',
      conditionId: 'COND-01',
      value:
        'Sem acompanhamento inicial no turno da tarde: a pessoa precisa executar a rotina com independência (confirmado pela gestora).'
    },
    teamEffects: [
      {
        applicationId: 'CAND-01',
        criterionId: 'CRI-106',
        suggestedState: 'divergencia',
        note: 'A expectativa de orientação inicial de Ana entra em conflito com a condição informada pela empresa. O critério não é obrigatório: a candidatura segue em análise com a diferença registrada.'
      },
      {
        applicationId: 'CAND-02',
        criterionId: 'CRI-106',
        suggestedState: 'alinhamento',
        note: 'Bruno declara preferência por autonomia, compatível com a ausência de acompanhamento inicial.'
      },
      {
        applicationId: 'CAND-03',
        criterionId: 'CRI-106',
        suggestedState: 'a-esclarecer',
        note: 'A condição da equipe agora está confirmada, mas não há expectativa registrada de Carla sobre acompanhamento.'
      },
      {
        applicationId: 'CAND-04',
        criterionId: 'CRI-106',
        suggestedState: 'a-esclarecer',
        note: 'A condição da equipe agora está confirmada, mas não há expectativa registrada de Diego sobre acompanhamento.'
      }
    ]
  },
  {
    jobId: 'VAG-01',
    criterionId: 'CRI-108',
    recipientKind: 'gestor',
    suggestedQuestion:
      'O checklist de prioridades no início do turno está em uso? Quem o entrega para a equipe?',
    suggestedSharedInfo:
      'Título da vaga e o trecho da descrição que menciona o checklist.',
    reason:
      'A prática aparece na descrição da vaga e ainda não foi confirmada por quem conduz a equipe.',
    preparedAnswer:
      'Sim, o checklist é entregue pelo líder do turno anterior e revisado no meio do turno.',
    teamConditionUpdate: {
      teamId: 'EQ-01',
      conditionId: 'COND-03',
      value:
        'Checklist impresso entregue pelo líder do turno anterior e revisado no meio do turno (confirmado pela gestora).'
    },
    teamEffects: [
      {
        applicationId: 'CAND-01',
        criterionId: 'CRI-108',
        suggestedState: 'alinhamento',
        note: 'Prática de comunicação de prioridades confirmada pela gestora.'
      },
      {
        applicationId: 'CAND-02',
        criterionId: 'CRI-108',
        suggestedState: 'alinhamento',
        note: 'Prática de comunicação de prioridades confirmada pela gestora.'
      },
      {
        applicationId: 'CAND-03',
        criterionId: 'CRI-108',
        suggestedState: 'alinhamento',
        note: 'Prática de comunicação de prioridades confirmada pela gestora.'
      },
      {
        applicationId: 'CAND-04',
        criterionId: 'CRI-108',
        suggestedState: 'alinhamento',
        note: 'Prática de comunicação de prioridades confirmada pela gestora.'
      }
    ]
  },
  {
    jobId: 'VAG-01',
    criterionId: 'CRI-102',
    recipientKind: 'candidato',
    suggestedQuestion:
      'Você já registrou movimentações de mercadoria em planilha? Se sim, como fazia esse registro?',
    suggestedSharedInfo:
      'Empresa, título da vaga e o motivo da pergunta. Nada sobre outros candidatos.',
    reason:
      'O registro em planilha é requisito obrigatório e não aparece nas informações disponíveis.',
    preparedAnswer:
      'Na loja eu anotava as conferências em uma ficha de papel e passava para a encarregada lançar no sistema. Nunca operei a planilha diretamente.',
    selfEffect: {
      suggestedState: 'a-esclarecer',
      note: 'A pessoa confirma contato com o registro das movimentações, mas não operou planilha. Requisito obrigatório parcialmente atendido: decisão do analista fica registrada.'
    }
  },
  {
    jobId: 'VAG-02',
    criterionId: 'CRI-202',
    recipientKind: 'candidato',
    suggestedQuestion:
      'Você já lançou entradas e saídas de materiais em planilha ou sistema? Como era esse registro?',
    suggestedSharedInfo:
      'Empresa, título da vaga e o motivo da pergunta. Nada sobre outros candidatos.',
    reason:
      'A equipe registra movimentações em planilha e sistema; a prática da pessoa não está verificada.',
    preparedAnswer:
      'Eu anotava as entradas em uma ficha e a encarregada lançava no sistema. Já usei planilha simples para controlar reposição.',
    selfEffect: {
      suggestedState: 'a-esclarecer',
      note: 'Há contato com registro de movimentações e uso simples de planilha; a operação no padrão da equipe ainda precisa de acompanhamento inicial.'
    }
  },
  {
    jobId: 'VAG-02',
    criterionId: 'CRI-203',
    recipientKind: 'candidato',
    suggestedQuestion:
      'Você segue disponível para o horário das 8h às 17h nesta oportunidade?',
    suggestedSharedInfo:
      'Empresa, título da vaga e horário previsto. Nada sobre outros candidatos.',
    reason:
      'A disponibilidade registrada precisa de reconfirmação para esta vaga.',
    preparedAnswer:
      'Sim, continuo disponível para o horário das 8h às 17h. Posso começar a partir de outubro.',
    selfEffect: {
      suggestedState: 'alinhamento',
      note: 'Disponibilidade reconfirmada pela própria pessoa para esta oportunidade.'
    }
  },
  {
    jobId: 'VAG-03',
    criterionId: 'CRI-305',
    recipientKind: 'gestor',
    suggestedQuestion:
      'Como é a rotina da equipe administrativa e que apoio a pessoa terá nas primeiras semanas?',
    suggestedSharedInfo:
      'Título da vaga e os critérios organizacionais em análise.',
    reason:
      'As condições da equipe estão descritas em linhas gerais e impedem a análise da dimensão organizacional.',
    preparedAnswer:
      'A equipe tem três pessoas. Nas duas primeiras semanas a pessoa acompanha a rotina comigo e depois assume os orçamentos.',
    teamConditionUpdate: {
      teamId: 'EQ-03',
      conditionId: 'COND-09',
      value:
        'Duas semanas de acompanhamento com a responsável antes de assumir os orçamentos (confirmado pela gestora).'
    },
    teamEffects: [
      {
        applicationId: 'CAND-08',
        criterionId: 'CRI-305',
        suggestedState: 'alinhamento',
        note: 'Condições da equipe informadas pela gestora: existe acompanhamento nas duas primeiras semanas.'
      },
      {
        applicationId: 'CAND-09',
        criterionId: 'CRI-305',
        suggestedState: 'alinhamento',
        note: 'Condições da equipe informadas pela gestora: existe acompanhamento nas duas primeiras semanas.'
      },
      {
        applicationId: 'CAND-10',
        criterionId: 'CRI-305',
        suggestedState: 'alinhamento',
        note: 'Condições da equipe informadas pela gestora: existe acompanhamento nas duas primeiras semanas.'
      }
    ]
  },
  {
    jobId: 'VAG-03',
    criterionId: 'CRI-302',
    recipientKind: 'candidato',
    suggestedQuestion:
      'No seu trabalho anterior, o contato com clientes acontecia por telefone? Com que frequência?',
    suggestedSharedInfo:
      'Empresa, título da vaga e o motivo da pergunta. Nada sobre outros candidatos.',
    reason:
      'A vaga prevê atendimento telefônico e a informação disponível não detalha o canal de contato.',
    preparedAnswer:
      'Sim, eu ligava para clientes quase todos os dias para confirmar documentos e prazos.',
    selfEffect: {
      suggestedState: 'alinhamento',
      note: 'Atendimento telefônico confirmado pela própria pessoa.'
    }
  }
];

export function findClarificationTemplate(
  jobId: string,
  criterionId: string,
  recipientKind: ClarificationRecipientKind
): ClarificationTemplate | null {
  return (
    DEMO_CLARIFICATION_TEMPLATES.find(
      (template) =>
        template.jobId === jobId &&
        template.criterionId === criterionId &&
        template.recipientKind === recipientKind
    ) ?? null
  );
}

/**
 * Evento fixo de atualização recebida das fontes. Aplicar o mesmo evento duas
 * vezes não pode criar candidatura nem talento duplicado.
 */
export const DEMO_SYNC_EVENTS: SyncEvent[] = [
  {
    id: 'SYNC-01',
    sourceId: 'FONTE-EMPREGARE',
    title: 'Candidatura atualizada — Fábio Lima (Assistente de Estoque)',
    description:
      'A origem informa que a candidatura EMPG-DEMO-APP-6603 passou de "Inscrito" para "Triagem".',
    payload: {
      jobId: 'VAG-02',
      talentId: 'FABIO',
      applicationId: 'CAND-07',
      externalStage: 'triagem'
    }
  }
];
