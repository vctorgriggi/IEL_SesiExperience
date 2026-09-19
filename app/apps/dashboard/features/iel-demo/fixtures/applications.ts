import type { AnalysisByApplication, Application } from '../types';

/**
 * Dez candidaturas para oito talentos: Ana (vagas 1 e 2) e Carla (vagas 1 e 3)
 * aparecem duas vezes como candidatura e uma vez como talento.
 */
export const DEMO_APPLICATIONS: Application[] = [
  {
    id: 'CAND-01',
    talentId: 'ANA',
    jobId: 'VAG-01',
    appliedAt: '2026-09-05',
    externalStage: 'analise-tecnica',
    analysisStage: 'em-andamento',
    referralStage: 'nao-encaminhada',
    externalRef: {
      system: 'Empregare — demonstração',
      account: 'Cerrado Distribuição',
      id: 'EMPG-DEMO-APP-5501'
    }
  },
  {
    id: 'CAND-02',
    talentId: 'BRUNO',
    jobId: 'VAG-01',
    appliedAt: '2026-09-04',
    externalStage: 'analise-tecnica',
    analysisStage: 'em-andamento',
    referralStage: 'nao-encaminhada',
    externalRef: {
      system: 'Empregare — demonstração',
      account: 'Cerrado Distribuição',
      id: 'EMPG-DEMO-APP-5502'
    }
  },
  {
    id: 'CAND-03',
    talentId: 'CARLA',
    jobId: 'VAG-01',
    appliedAt: '2026-09-06',
    externalStage: 'triagem',
    analysisStage: 'nao-iniciada',
    referralStage: 'nao-encaminhada',
    externalRef: {
      system: 'Empregare — demonstração',
      account: 'Cerrado Distribuição',
      id: 'EMPG-DEMO-APP-5503'
    }
  },
  {
    id: 'CAND-04',
    talentId: 'DIEGO',
    jobId: 'VAG-01',
    appliedAt: '2026-09-02',
    externalStage: 'triagem',
    analysisStage: 'em-andamento',
    referralStage: 'nao-encaminhada',
    externalRef: {
      system: 'Empregare — demonstração',
      account: 'Cerrado Distribuição',
      id: 'EMPG-DEMO-APP-5504'
    }
  },
  {
    id: 'CAND-05',
    talentId: 'ANA',
    jobId: 'VAG-02',
    appliedAt: '2026-07-02',
    externalStage: 'analise-tecnica',
    analysisStage: 'em-andamento',
    referralStage: 'nao-encaminhada',
    externalRef: {
      system: 'Empregare — demonstração',
      account: 'Horizonte Alimentos',
      id: 'EMPG-DEMO-APP-6601'
    }
  },
  {
    id: 'CAND-06',
    talentId: 'ELISA',
    jobId: 'VAG-02',
    appliedAt: '2026-08-28',
    externalStage: 'analise-tecnica',
    analysisStage: 'em-andamento',
    referralStage: 'nao-encaminhada',
    externalRef: {
      system: 'Empregare — demonstração',
      account: 'Horizonte Alimentos',
      id: 'EMPG-DEMO-APP-6602'
    }
  },
  {
    id: 'CAND-07',
    talentId: 'FABIO',
    jobId: 'VAG-02',
    appliedAt: '2026-09-01',
    externalStage: 'inscrito',
    analysisStage: 'nao-iniciada',
    referralStage: 'nao-encaminhada',
    externalRef: {
      system: 'Empregare — demonstração',
      account: 'Horizonte Alimentos',
      id: 'EMPG-DEMO-APP-6603'
    }
  },
  {
    id: 'CAND-08',
    talentId: 'CARLA',
    jobId: 'VAG-03',
    appliedAt: '2026-09-06',
    externalStage: 'triagem',
    analysisStage: 'nao-iniciada',
    referralStage: 'nao-encaminhada',
    externalRef: {
      system: 'Empregare — demonstração',
      account: 'Oficina Pantanal',
      id: 'EMPG-DEMO-APP-7701'
    }
  },
  {
    id: 'CAND-09',
    talentId: 'GABRIELA',
    jobId: 'VAG-03',
    appliedAt: '2026-09-03',
    externalStage: 'triagem',
    analysisStage: 'nao-iniciada',
    referralStage: 'nao-encaminhada',
    externalRef: {
      system: 'Empregare — demonstração',
      account: 'Oficina Pantanal',
      id: 'EMPG-DEMO-APP-7702'
    }
  },
  {
    id: 'CAND-10',
    talentId: 'HUGO',
    jobId: 'VAG-03',
    appliedAt: '2026-09-02',
    externalStage: 'inscrito',
    analysisStage: 'nao-iniciada',
    referralStage: 'nao-encaminhada',
    externalRef: {
      system: 'Empregare — demonstração',
      account: 'Oficina Pantanal',
      id: 'EMPG-DEMO-APP-7703'
    }
  }
];

/**
 * Estado inicial da análise, definido previamente critério por critério.
 * Nenhum valor é calculado por sorteio: cada estado tem nota e evidências.
 */
export const DEMO_ANALYSIS: AnalysisByApplication = {
  // Ana Ribeiro — Assistente de Logística (Cerrado Distribuição)
  'CAND-01': {
    'CRI-101': {
      state: 'alinhamento',
      note: 'Relata conferência de pedidos com identificação de divergências no comércio.',
      evidenceIds: ['EVD-ANA-01']
    },
    'CRI-102': {
      state: 'sem-informacao',
      note: 'Não há informação sobre lançamentos em planilha. Requisito obrigatório sem base para análise.',
      evidenceIds: []
    },
    'CRI-103': {
      state: 'alinhamento',
      note: 'Disponibilidade declarada nesta candidatura cobre o turno da tarde.',
      evidenceIds: ['EVD-ANA-04']
    },
    'CRI-104': {
      state: 'alinhamento',
      note: 'Interesse em rotina de estoque registrado pelo IEL antes desta vaga.',
      evidenceIds: ['EVD-ANA-02']
    },
    'CRI-105': {
      state: 'alinhamento',
      note: 'Expectativa de aprendizado declarada e compatível com a rotina descrita.',
      evidenceIds: ['EVD-ANA-02']
    },
    'CRI-106': {
      state: 'sem-informacao',
      note: 'A expectativa de orientação inicial está registrada, mas a empresa ainda não informou se há acompanhamento no turno.',
      evidenceIds: ['EVD-ANA-03', 'EVD-EQ01-01']
    },
    'CRI-107': {
      state: 'a-esclarecer',
      note: 'A vaga descreve execução autônoma; a expectativa de orientação inicial precisa ser conciliada com essa condição.',
      evidenceIds: ['EVD-ANA-03', 'EVD-EQ01-04']
    },
    'CRI-108': {
      state: 'a-esclarecer',
      note: 'O checklist do início do turno aparece na descrição da vaga e ainda não foi confirmado pela gestora.',
      evidenceIds: ['EVD-EQ01-03']
    }
  },
  // Bruno Costa — Assistente de Logística
  'CAND-02': {
    'CRI-101': {
      state: 'alinhamento',
      note: 'Separação de cargas e conferência de romaneios registradas no currículo.',
      evidenceIds: ['EVD-BRU-01']
    },
    'CRI-102': {
      state: 'alinhamento',
      note: 'Relata registro das saídas em planilha compartilhada.',
      evidenceIds: ['EVD-BRU-02']
    },
    'CRI-103': {
      state: 'alinhamento',
      note: 'Disponibilidade declarada para tarde e noite.',
      evidenceIds: ['EVD-BRU-03']
    },
    'CRI-104': {
      state: 'sem-informacao',
      note: 'Interesse nas atividades de expedição e estoque não informado.',
      evidenceIds: []
    },
    'CRI-105': {
      state: 'sem-informacao',
      note: 'Não há expectativa de aprendizado registrada.',
      evidenceIds: []
    },
    'CRI-106': {
      state: 'sem-informacao',
      note: 'A empresa ainda não informou se há acompanhamento nas primeiras atividades.',
      evidenceIds: ['EVD-EQ01-01']
    },
    'CRI-107': {
      state: 'alinhamento',
      note: 'Preferência declarada por autonomia, compatível com a rotina descrita.',
      evidenceIds: ['EVD-BRU-04', 'EVD-EQ01-04']
    },
    'CRI-108': {
      state: 'a-esclarecer',
      note: 'Prática do checklist ainda não confirmada pela gestora.',
      evidenceIds: ['EVD-EQ01-03']
    }
  },
  // Carla Mendes — Assistente de Logística
  'CAND-03': {
    'CRI-101': {
      state: 'a-esclarecer',
      note: 'Conferência de protocolos administrativos tem relação com o requisito, mas a equivalência precisa ser confirmada.',
      evidenceIds: ['EVD-CAR-01']
    },
    'CRI-102': {
      state: 'a-esclarecer',
      note: 'Operação de planilha exigida pela vaga não verificada no currículo.',
      evidenceIds: ['EVD-CAR-02']
    },
    'CRI-103': {
      state: 'alinhamento',
      note: 'Disponibilidade integral declarada.',
      evidenceIds: ['EVD-CAR-03']
    },
    'CRI-104': {
      state: 'a-esclarecer',
      note: 'O interesse declarado é por rotina administrativa; a relação com expedição precisa ser confirmada.',
      evidenceIds: ['EVD-CAR-04']
    },
    'CRI-105': {
      state: 'alinhamento',
      note: 'Há interesse declarado em aprender controle de materiais.',
      evidenceIds: ['EVD-CAR-04']
    },
    'CRI-106': {
      state: 'sem-informacao',
      note: 'Condição da equipe não informada e expectativa de acompanhamento não registrada.',
      evidenceIds: ['EVD-EQ01-01']
    },
    'CRI-107': {
      state: 'sem-informacao',
      note: 'Não há informação sobre execução autônoma na experiência registrada.',
      evidenceIds: ['EVD-EQ01-04']
    },
    'CRI-108': {
      state: 'a-esclarecer',
      note: 'Prática do checklist ainda não confirmada pela gestora.',
      evidenceIds: ['EVD-EQ01-03']
    }
  },
  // Diego Alves — Assistente de Logística
  'CAND-04': {
    'CRI-101': {
      state: 'alinhamento',
      note: 'Conferência de volumes no carregamento registrada no currículo.',
      evidenceIds: ['EVD-DIE-01']
    },
    'CRI-102': {
      state: 'a-esclarecer',
      note: 'Participação direta no registro das movimentações não confirmada.',
      evidenceIds: ['EVD-DIE-02']
    },
    'CRI-103': {
      state: 'divergencia',
      note: 'Duas fontes discordam: o currículo indica disponibilidade integral (20/11/2025) e o registro IEL de 08/09/2026 indica apenas o período da manhã.',
      evidenceIds: ['EVD-DIE-03', 'EVD-DIE-04']
    },
    'CRI-104': {
      state: 'sem-informacao',
      note: 'Interesse nas atividades não informado.',
      evidenceIds: []
    },
    'CRI-105': {
      state: 'sem-informacao',
      note: 'Não há expectativa de aprendizado registrada.',
      evidenceIds: []
    },
    'CRI-106': {
      state: 'sem-informacao',
      note: 'A empresa ainda não informou se há acompanhamento nas primeiras atividades.',
      evidenceIds: ['EVD-EQ01-01']
    },
    'CRI-107': {
      state: 'alinhamento',
      note: 'Relata conferência final do turno sem supervisão direta.',
      evidenceIds: ['EVD-DIE-05', 'EVD-EQ01-04']
    },
    'CRI-108': {
      state: 'a-esclarecer',
      note: 'Prática do checklist ainda não confirmada pela gestora.',
      evidenceIds: ['EVD-EQ01-03']
    }
  },
  // Ana Ribeiro — Assistente de Estoque (Horizonte Alimentos)
  'CAND-05': {
    'CRI-201': {
      state: 'alinhamento',
      note: 'Conferência de pedidos e identificação de divergências são atividades relacionadas ao controle de materiais.',
      evidenceIds: ['EVD-ANA-01']
    },
    'CRI-202': {
      state: 'a-esclarecer',
      note: 'A conferência na loja era registrada em papel; o uso de planilha ou sistema não está verificado.',
      evidenceIds: ['EVD-ANA-01', 'EVD-EQ02-03']
    },
    'CRI-203': {
      state: 'a-esclarecer',
      note: 'A disponibilidade informada na inscrição é de julho e precisa de reconfirmação para esta oportunidade.',
      evidenceIds: ['EVD-ANA-05']
    },
    'CRI-204': {
      state: 'alinhamento',
      note: 'Interesse em estoque registrado pelo IEL, reaproveitado sem nova coleta.',
      evidenceIds: ['EVD-ANA-02']
    },
    'CRI-205': {
      state: 'alinhamento',
      note: 'A expectativa de orientação inicial encontra apoio confirmado: colega de referência nas primeiras quatro semanas.',
      evidenceIds: ['EVD-ANA-03', 'EVD-EQ02-01']
    },
    'CRI-206': {
      state: 'alinhamento',
      note: 'A equipe confirma reunião semanal de prioridades.',
      evidenceIds: ['EVD-EQ02-02']
    }
  },
  // Elisa Martins — Assistente de Estoque
  'CAND-06': {
    'CRI-201': {
      state: 'alinhamento',
      note: 'Controle de materiais e apoio a inventários registrados no currículo.',
      evidenceIds: ['EVD-ELI-01']
    },
    'CRI-202': {
      state: 'alinhamento',
      note: 'Relata conferência de notas e lançamento em sistema.',
      evidenceIds: ['EVD-ELI-02', 'EVD-EQ02-03']
    },
    'CRI-203': {
      state: 'alinhamento',
      note: 'Disponibilidade integral declarada em agosto de 2026.',
      evidenceIds: ['EVD-ELI-03']
    },
    'CRI-204': {
      state: 'alinhamento',
      note: 'Interesse declarado em seguir na área de estoque.',
      evidenceIds: ['EVD-ELI-04']
    },
    'CRI-205': {
      state: 'sem-informacao',
      note: 'A equipe oferece apoio inicial, mas não há expectativa registrada de Elisa sobre orientação.',
      evidenceIds: ['EVD-EQ02-01']
    },
    'CRI-206': {
      state: 'a-esclarecer',
      note: 'A avaliação externa de 2026 indica menor conforto com mudanças de prioridade, na escala da própria metodologia. Vale conversar sobre como a revisão semanal funciona.',
      evidenceIds: ['EVD-ELI-05', 'EVD-EQ02-02']
    }
  },
  // Fábio Lima — Assistente de Estoque
  'CAND-07': {
    'CRI-201': {
      state: 'sem-informacao',
      note: 'A experiência registrada é de atendimento; não há informação sobre conferência ou controle de materiais.',
      evidenceIds: ['EVD-FAB-01']
    },
    'CRI-202': {
      state: 'sem-informacao',
      note: 'Não há informação sobre registro de entradas e saídas.',
      evidenceIds: []
    },
    'CRI-203': {
      state: 'alinhamento',
      note: 'Disponibilidade declarada para horário comercial.',
      evidenceIds: ['EVD-FAB-02']
    },
    'CRI-204': {
      state: 'a-esclarecer',
      note: 'Busca área administrativa, sem interesse específico em estoque informado.',
      evidenceIds: ['EVD-FAB-03']
    },
    'CRI-205': {
      state: 'sem-informacao',
      note: 'Sem expectativa registrada sobre orientação inicial.',
      evidenceIds: ['EVD-EQ02-01']
    },
    'CRI-206': {
      state: 'sem-informacao',
      note: 'Sem informação sobre preferências de comunicação de prioridades.',
      evidenceIds: ['EVD-EQ02-02']
    }
  },
  // Carla Mendes — Assistente Administrativo (Oficina Pantanal)
  'CAND-08': {
    'CRI-301': {
      state: 'alinhamento',
      note: 'Organização de documentos e notas registrada no currículo.',
      evidenceIds: ['EVD-CAR-01']
    },
    'CRI-302': {
      state: 'alinhamento',
      note: 'Atendimento telefônico na recepção registrado no currículo.',
      evidenceIds: ['EVD-CAR-05']
    },
    'CRI-303': {
      state: 'alinhamento',
      note: 'Disponibilidade integral declarada.',
      evidenceIds: ['EVD-CAR-03']
    },
    'CRI-304': {
      state: 'a-esclarecer',
      note: 'As expectativas registradas apontam interesse em controle de materiais; a relação com a rotina de oficina precisa ser confirmada.',
      evidenceIds: ['EVD-CAR-04']
    },
    'CRI-305': {
      state: 'sem-informacao',
      note: 'Condições da equipe descritas apenas em linhas gerais.',
      evidenceIds: ['EVD-EQ03-01']
    }
  },
  // Gabriela Souza — Assistente Administrativo
  'CAND-09': {
    'CRI-301': {
      state: 'alinhamento',
      note: 'Organização de documentos contábeis e digitalização registradas.',
      evidenceIds: ['EVD-GAB-01']
    },
    'CRI-302': {
      state: 'a-esclarecer',
      note: 'Há contato com clientes para cobrança de prazos; o atendimento telefônico não está detalhado.',
      evidenceIds: ['EVD-GAB-02']
    },
    'CRI-303': {
      state: 'alinhamento',
      note: 'Disponibilidade declarada para o horário completo.',
      evidenceIds: ['EVD-GAB-03']
    },
    'CRI-304': {
      state: 'alinhamento',
      note: 'Expectativas registradas e compatíveis com o apoio a orçamentos.',
      evidenceIds: ['EVD-GAB-04']
    },
    'CRI-305': {
      state: 'sem-informacao',
      note: 'Condições da equipe descritas apenas em linhas gerais.',
      evidenceIds: ['EVD-EQ03-01']
    }
  },
  // Hugo Santos — Assistente Administrativo
  'CAND-10': {
    'CRI-301': {
      state: 'alinhamento',
      note: 'Apoio a orçamentos e organização de pastas de serviço registrados.',
      evidenceIds: ['EVD-HUG-01']
    },
    'CRI-302': {
      state: 'sem-informacao',
      note: 'Não há informação sobre atendimento telefônico.',
      evidenceIds: []
    },
    'CRI-303': {
      state: 'a-esclarecer',
      note: 'Disponibilidade declarada até as 17h, uma hora antes do fim do expediente da vaga. Pode ser negociável.',
      evidenceIds: ['EVD-HUG-02']
    },
    'CRI-304': {
      state: 'sem-informacao',
      note: 'Nenhuma expectativa profissional registrada até agora.',
      evidenceIds: []
    },
    'CRI-305': {
      state: 'sem-informacao',
      note: 'Condições da equipe descritas apenas em linhas gerais.',
      evidenceIds: ['EVD-EQ03-01']
    }
  }
};
