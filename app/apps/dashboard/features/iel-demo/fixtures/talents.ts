import type { ExternalAssessment, Talent } from '../types';

/**
 * Oito talentos únicos. Ana e Carla participam de duas vagas, mas continuam
 * sendo um único perfil: a duplicação acontece na candidatura, não no talento.
 */
export const DEMO_TALENTS: Talent[] = [
  {
    id: 'ANA',
    name: 'Ana Ribeiro',
    headline: 'Apoio a comércio e conferência de pedidos',
    summary:
      'Trabalhou em comércio com conferência de pedidos e atendimento. Quer aprender rotina de estoque e espera orientação nas primeiras semanas.',
    city: 'Goiânia, GO',
    email: 'ana.ribeiro@example.com',
    experiences: [
      {
        id: 'EXP-ANA-01',
        role: 'Auxiliar de loja',
        organization: 'Loja Horizonte (fictícia)',
        period: 'mar/2024 — fev/2026',
        activities:
          'Conferia pedidos recebidos, identificava divergências de quantidade e organizava a reposição das prateleiras.'
      },
      {
        id: 'EXP-ANA-02',
        role: 'Atendente',
        organization: 'Papelaria Aurora (fictícia)',
        period: 'jan/2023 — fev/2024',
        activities:
          'Atendimento ao cliente, emissão de pedidos e organização de arquivos de notas.'
      }
    ],
    declaredSkills: [
      'Conferência de pedidos',
      'Organização de estoque de loja',
      'Atendimento ao cliente'
    ],
    expectations: [
      'Aprender rotina de estoque',
      'Receber orientação nas primeiras semanas',
      'Trabalho fixo próximo de casa'
    ],
    externalRefs: [
      {
        system: 'Empregare — demonstração',
        account: 'Cerrado Distribuição',
        id: 'EMPG-DEMO-CAND-8801'
      },
      {
        system: 'Empregare — demonstração',
        account: 'Horizonte Alimentos',
        id: 'EMPG-DEMO-CAND-9014'
      }
    ]
  },
  {
    id: 'BRUNO',
    name: 'Bruno Costa',
    headline: 'Expedição e separação de cargas',
    summary:
      'Experiência declarada em logística de expedição, com preferência por autonomia na execução da rotina.',
    city: 'Aparecida de Goiânia, GO',
    email: 'bruno.costa@example.com',
    experiences: [
      {
        id: 'EXP-BRU-01',
        role: 'Auxiliar de expedição',
        organization: 'Transportes Araguaia (fictícia)',
        period: 'ago/2023 — jul/2026',
        activities:
          'Separação de cargas, conferência de romaneios e registro das saídas em planilha compartilhada.'
      }
    ],
    declaredSkills: [
      'Separação de cargas',
      'Conferência de romaneio',
      'Planilha de saídas'
    ],
    expectations: [
      'Preferência por autonomia na execução',
      'Turnos com horário previsível'
    ],
    externalRefs: [
      {
        system: 'Empregare — demonstração',
        account: 'Cerrado Distribuição',
        id: 'EMPG-DEMO-CAND-8802'
      }
    ]
  },
  {
    id: 'CARLA',
    name: 'Carla Mendes',
    headline: 'Rotina administrativa e documentos',
    summary:
      'Experiência administrativa com documentos, notas e atendimento. Participa de dois processos distintos na base demo.',
    city: 'Goiânia, GO',
    email: 'carla.mendes@example.com',
    experiences: [
      {
        id: 'EXP-CAR-01',
        role: 'Auxiliar administrativa',
        organization: 'Clínica Vale Verde (fictícia)',
        period: 'fev/2022 — mai/2026',
        activities:
          'Organizava documentos e notas fiscais, conferia protocolos de entrega e atendia o telefone da recepção.'
      }
    ],
    declaredSkills: [
      'Organização de documentos',
      'Conferência de protocolos',
      'Atendimento telefônico'
    ],
    expectations: [
      'Continuar em rotina administrativa',
      'Interesse em aprender controle de materiais'
    ],
    externalRefs: [
      {
        system: 'Empregare — demonstração',
        account: 'Cerrado Distribuição',
        id: 'EMPG-DEMO-CAND-8803'
      },
      {
        system: 'Empregare — demonstração',
        account: 'Oficina Pantanal',
        id: 'EMPG-DEMO-CAND-7712'
      }
    ]
  },
  {
    id: 'DIEGO',
    name: 'Diego Alves',
    headline: 'Apoio à expedição e carregamento',
    summary:
      'Experiência relacionada à expedição. A base demo guarda duas informações de disponibilidade em conflito.',
    city: 'Trindade, GO',
    email: 'diego.alves@example.com',
    experiences: [
      {
        id: 'EXP-DIE-01',
        role: 'Ajudante de carga',
        organization: 'Depósito Serra Azul (fictício)',
        period: 'mai/2024 — abr/2026',
        activities:
          'Conferência de volumes no carregamento e apoio na organização das docas.'
      }
    ],
    declaredSkills: ['Conferência de volumes', 'Organização de docas'],
    expectations: ['Voltar para a área de expedição'],
    externalRefs: [
      {
        system: 'Empregare — demonstração',
        account: 'Cerrado Distribuição',
        id: 'EMPG-DEMO-CAND-8804'
      }
    ]
  },
  {
    id: 'ELISA',
    name: 'Elisa Martins',
    headline: 'Controle de materiais em indústria',
    summary:
      'Relata controle de materiais e interesse em estoque. Possui avaliação externa fictícia já realizada, com escala própria preservada.',
    city: 'Anápolis, GO',
    email: 'elisa.martins@example.com',
    experiences: [
      {
        id: 'EXP-ELI-01',
        role: 'Auxiliar de materiais',
        organization: 'Indústria Sol Nascente (fictícia)',
        period: 'jan/2024 — ago/2026',
        activities:
          'Controle de materiais de consumo, apoio a inventários trimestrais e conferência de notas de entrada.'
      }
    ],
    declaredSkills: [
      'Controle de materiais',
      'Apoio a inventário',
      'Conferência de notas'
    ],
    expectations: ['Seguir em estoque', 'Rotina com procedimentos definidos'],
    externalRefs: [
      {
        system: 'Empregare — demonstração',
        account: 'Horizonte Alimentos',
        id: 'EMPG-DEMO-CAND-9015'
      }
    ]
  },
  {
    id: 'FABIO',
    name: 'Fábio Lima',
    headline: 'Atendimento e apoio comercial',
    summary:
      'Experiência de atendimento. A base não tem informação suficiente sobre conferência de pedidos ou controle de materiais.',
    city: 'Anápolis, GO',
    email: 'fabio.lima@example.com',
    experiences: [
      {
        id: 'EXP-FAB-01',
        role: 'Atendente de balcão',
        organization: 'Distribuidora Boa Vista (fictícia)',
        period: 'jun/2023 — jul/2026',
        activities:
          'Atendimento a clientes no balcão, emissão de pedidos e apoio ao caixa.'
      }
    ],
    declaredSkills: ['Atendimento ao cliente', 'Emissão de pedidos'],
    expectations: ['Busca primeira oportunidade em área administrativa'],
    externalRefs: [
      {
        system: 'Empregare — demonstração',
        account: 'Horizonte Alimentos',
        id: 'EMPG-DEMO-CAND-9016'
      }
    ]
  },
  {
    id: 'GABRIELA',
    name: 'Gabriela Souza',
    headline: 'Organização de documentos e arquivo',
    summary:
      'Experiência em organização de documentos, com expectativas profissionais registradas em atendimento no IEL.',
    city: 'Campo Grande, MS',
    email: 'gabriela.souza@example.com',
    experiences: [
      {
        id: 'EXP-GAB-01',
        role: 'Auxiliar de arquivo',
        organization: 'Contabilidade Rio Claro (fictícia)',
        period: 'set/2023 — jun/2026',
        activities:
          'Organização de documentos contábeis, digitalização de arquivos e controle de prazos de entrega.'
      }
    ],
    declaredSkills: [
      'Organização de arquivos',
      'Digitalização de documentos',
      'Controle de prazos'
    ],
    expectations: [
      'Rotina administrativa estável',
      'Interesse em aprender rotinas financeiras'
    ],
    externalRefs: [
      {
        system: 'Empregare — demonstração',
        account: 'Oficina Pantanal',
        id: 'EMPG-DEMO-CAND-7713'
      }
    ]
  },
  {
    id: 'HUGO',
    name: 'Hugo Santos',
    headline: 'Apoio administrativo geral',
    summary:
      'Experiência em apoio administrativo. O contexto organizacional da vaga 3 ainda é insuficiente para comparação nessa dimensão.',
    city: 'Campo Grande, MS',
    email: 'hugo.santos@example.com',
    experiences: [
      {
        id: 'EXP-HUG-01',
        role: 'Auxiliar administrativo',
        organization: 'Autopeças Guaicurus (fictícia)',
        period: 'out/2024 — ago/2026',
        activities:
          'Apoio à emissão de orçamentos, conferência de cadastros e organização de pastas de serviço.'
      }
    ],
    declaredSkills: ['Apoio a orçamentos', 'Conferência de cadastros'],
    expectations: [],
    externalRefs: [
      {
        system: 'Empregare — demonstração',
        account: 'Oficina Pantanal',
        id: 'EMPG-DEMO-CAND-7714'
      }
    ]
  }
];

/**
 * Avaliação externa já existente. O protótipo apenas exibe o resultado de
 * origem: não aplica nova avaliação nem converte a escala em nota global.
 */
export const DEMO_ASSESSMENTS: ExternalAssessment[] = [
  {
    id: 'AVL-01',
    talentId: 'ELISA',
    method:
      'Inventário Fictício de Preferências de Trabalho (metodologia de demonstração)',
    sourceId: 'FONTE-AVALIACAO',
    appliedAt: '2026-07-30',
    scale: 'Escala própria de 1 a 5 por preferência declarada',
    results: [
      { label: 'Preferência por rotinas estruturadas', value: '4 de 5' },
      { label: 'Preferência por trabalho em equipe', value: '3 de 5' },
      { label: 'Conforto com mudanças de prioridade', value: '2 de 5' }
    ],
    note: 'Resultado aplicado em processo anterior, em 30/07/2026. Escala, método e data pertencem à avaliação de origem e não devem ser somados a outras metodologias.'
  }
];
