import type { Company, DataSource, Team } from '../types';

/**
 * Data de referência da base demo. Todas as informações fictícias usam datas
 * fixas para que a interface não mude de conteúdo entre renderizações.
 */
export const DEMO_REFERENCE_DATE = '2026-09-20';

export const DEMO_DATA_SOURCES: DataSource[] = [
  {
    id: 'FONTE-EMPREGARE',
    name: 'Empregare',
    kind: 'Sistema de recrutamento',
    description:
      'Vagas, candidaturas e experiências declaradas no currículo, recebidas do sistema de recrutamento do IEL.',
    lastSyncAt: '2026-09-13T18:20:00.000Z',
    receivedRecords: 21,
    status: 'ativa',
    lastError: null
  },
  {
    id: 'FONTE-AVALIACAO',
    name: 'Avaliação externa',
    kind: 'Avaliação de aderência',
    description:
      'Resultados de avaliações já realizadas em processos anteriores. A escala, o método e a data de origem são preservados: nada é convertido em nota global.',
    lastSyncAt: '2026-08-02T12:00:00.000Z',
    receivedRecords: 1,
    status: 'ativa',
    lastError: null
  },
  {
    id: 'FONTE-EMPRESA',
    name: 'Contexto da empresa',
    kind: 'Informações da empresa e da equipe',
    description:
      'Atividades, rotina e condições de trabalho informadas pela empresa. Cada condição indica se foi confirmada pelo gestor ou apenas descrita na vaga.',
    lastSyncAt: '2026-08-30T14:10:00.000Z',
    receivedRecords: 9,
    status: 'ativa',
    lastError: null
  },
  {
    id: 'FONTE-IEL',
    name: 'Registro IEL',
    kind: 'Registro interno de análise',
    description:
      'Expectativas coletadas em atendimento, anotações de análise, esclarecimentos e encaminhamentos. É a fonte que a equipe do IEL escreve.',
    lastSyncAt: '2026-09-14T08:05:00.000Z',
    receivedRecords: 12,
    status: 'ativa',
    lastError: null
  }
];

export const DEMO_COMPANIES: Company[] = [
  {
    id: 'EMP-01',
    name: 'Cerrado Distribuição',
    sector: 'Distribuição e logística',
    location: 'Cuiabá, MT',
    institutionalDescription:
      'A empresa se descreve como colaborativa, com metas diárias de expedição e comunicação direta entre as equipes.',
    contactName: 'Marina Duarte',
    contactEmail: 'marina.duarte@example.com',
    sourceId: 'FONTE-EMPRESA',
    updatedAt: '2026-09-03',
    cultureSuggestions: [
      {
        axisId: 'lideranca-autonomia',
        value: 3,
        excerpt: 'comunicação direta entre as equipes',
        sourceLabel: 'Descrição institucional informada pela empresa',
        sourceId: 'FONTE-EMPRESA'
      },
      {
        axisId: 'regras-decisao',
        value: 2,
        excerpt:
          'A rotina é executada sem supervisão direta durante a maior parte do turno.',
        sourceLabel: 'Descrição da vaga Assistente de Logística',
        sourceId: 'FONTE-EMPREGARE'
      },
      {
        axisId: 'interacao-convivencia',
        value: 2,
        excerpt: 'Checklist impresso entregue no início do turno.',
        sourceLabel: 'Descrição da vaga Assistente de Logística',
        sourceId: 'FONTE-EMPREGARE'
      },
      {
        axisId: 'execucao-ritmo',
        value: 4,
        excerpt: 'Turno da tarde (13h às 22h)',
        sourceLabel: 'Descrição da vaga Assistente de Logística',
        sourceId: 'FONTE-EMPREGARE'
      }
    ]
  },
  {
    id: 'EMP-02',
    name: 'Horizonte Alimentos',
    sector: 'Indústria de alimentos',
    location: 'Várzea Grande, MT',
    institutionalDescription:
      'A empresa se descreve como formal nos processos, com procedimentos escritos para movimentação de materiais.',
    contactName: 'Rafael Nogueira',
    contactEmail: 'rafael.nogueira@example.com',
    sourceId: 'FONTE-EMPRESA',
    updatedAt: '2026-09-05',
    cultureSuggestions: [
      {
        axisId: 'lideranca-autonomia',
        value: 2,
        excerpt:
          'Colega de referência acompanha a pessoa nas primeiras quatro semanas.',
        sourceLabel: 'Contexto da equipe confirmado pelo gestor',
        sourceId: 'FONTE-EMPRESA'
      },
      {
        axisId: 'interacao-convivencia',
        value: 2,
        excerpt: 'procedimentos escritos para movimentação de materiais',
        sourceLabel: 'Descrição institucional informada pela empresa',
        sourceId: 'FONTE-EMPRESA'
      }
    ]
  },
  {
    id: 'EMP-03',
    name: 'Oficina Pantanal',
    sector: 'Manutenção automotiva',
    location: 'Cáceres, MT',
    institutionalDescription:
      'A empresa se descreve como enxuta, com equipe pequena e divisão informal de tarefas administrativas.',
    contactName: 'Sônia Prado',
    contactEmail: 'sonia.prado@example.com',
    sourceId: 'FONTE-EMPRESA',
    updatedAt: '2026-08-18',
    cultureSuggestions: [
      {
        axisId: 'regras-decisao',
        value: 2,
        excerpt: 'divisão informal de tarefas administrativas',
        sourceLabel: 'Descrição institucional informada pela empresa',
        sourceId: 'FONTE-EMPRESA'
      }
    ]
  }
];

export const DEMO_TEAMS: Team[] = [
  {
    id: 'EQ-01',
    companyId: 'EMP-01',
    name: 'Expedição — turno da tarde',
    routine:
      'Conferência de cargas, separação de pedidos e registro de saídas entre 13h e 22h.',
    managerName: 'Marina Duarte',
    managerEmail: 'marina.duarte@example.com',
    conditions: [
      {
        id: 'COND-01',
        axisId: 'lideranca-autonomia',
        label: 'Apoio nas primeiras atividades',
        value: 'Ainda não informado pela empresa.',
        status: 'a-confirmar',
        informed: false,
        origin: 'Contexto da empresa',
        updatedAt: '2026-09-03'
      },
      {
        id: 'COND-02',
        axisId: 'execucao-ritmo',
        label: 'Sobreposição entre turnos',
        value:
          'Pouca sobreposição: o turno da tarde inicia quando a equipe da manhã está encerrando.',
        status: 'da-descricao',
        origin: 'Descrição da vaga (Empregare)',
        updatedAt: '2026-09-08'
      },
      {
        id: 'COND-03',
        axisId: 'interacao-convivencia',
        label: 'Comunicação de prioridades',
        value: 'Checklist impresso entregue no início do turno.',
        status: 'da-descricao',
        origin: 'Descrição da vaga (Empregare)',
        updatedAt: '2026-09-08'
      },
      {
        id: 'COND-04',
        axisId: 'regras-decisao',
        label: 'Autonomia esperada',
        value:
          'A rotina é executada sem supervisão direta durante a maior parte do turno.',
        status: 'da-descricao',
        origin: 'Descrição da vaga (Empregare)',
        updatedAt: '2026-09-08'
      }
    ]
  },
  {
    id: 'EQ-02',
    companyId: 'EMP-02',
    name: 'Apoio administrativo ao estoque',
    routine:
      'Controle de entradas e saídas de materiais, apoio a inventários e conferência de notas, das 8h às 17h.',
    managerName: 'Rafael Nogueira',
    managerEmail: 'rafael.nogueira@example.com',
    conditions: [
      {
        id: 'COND-05',
        axisId: 'lideranca-autonomia',
        label: 'Apoio nas primeiras atividades',
        value:
          'Colega de referência acompanha a pessoa nas primeiras quatro semanas.',
        status: 'confirmado',
        origin: 'Contexto da empresa — confirmado pelo gestor',
        updatedAt: '2026-09-05'
      },
      {
        id: 'COND-06',
        axisId: 'interacao-convivencia',
        label: 'Revisão de prioridades',
        value: 'Reunião semanal de prioridades com o gestor da área.',
        status: 'confirmado',
        origin: 'Contexto da empresa — confirmado pelo gestor',
        updatedAt: '2026-09-05'
      },
      {
        id: 'COND-07',
        axisId: 'regras-decisao',
        label: 'Registro de movimentações',
        value: 'Planilha compartilhada somada ao sistema interno de estoque.',
        status: 'confirmado',
        origin: 'Contexto da empresa — confirmado pelo gestor',
        updatedAt: '2026-09-05'
      }
    ]
  },
  {
    id: 'EQ-03',
    companyId: 'EMP-03',
    name: 'Administrativo da oficina',
    routine:
      'Organização de documentos, atendimento telefônico e apoio a orçamentos, das 8h às 18h.',
    managerName: 'Sônia Prado',
    managerEmail: 'sonia.prado@example.com',
    conditions: [
      {
        id: 'COND-08',
        axisId: 'regras-decisao',
        label: 'Atividades detalhadas',
        value:
          'Documentação parcial: as atividades aparecem apenas em linhas gerais.',
        status: 'a-confirmar',
        origin: 'Descrição da vaga (Empregare)',
        updatedAt: '2026-08-18'
      },
      {
        id: 'COND-09',
        axisId: 'lideranca-autonomia',
        label: 'Apoio nas primeiras atividades',
        value: 'Não informado pela empresa.',
        status: 'a-confirmar',
        informed: false,
        origin: 'Contexto da empresa',
        updatedAt: '2026-08-18'
      }
    ]
  }
];
