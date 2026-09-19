import type { Evidence } from '../types';

/**
 * Evidências da base demo.
 *
 * Cada registro guarda a informação, a origem, a natureza (relato, condição
 * confirmada, avaliação externa), a data fixa, o escopo de visibilidade e os
 * critérios que ajuda a analisar. Um registro pode sustentar mais de um
 * critério, desde que o vínculo seja justificável.
 */
export const DEMO_EVIDENCES: Evidence[] = [
  // --- Ana Ribeiro ---
  {
    id: 'EVD-ANA-01',
    talentId: 'ANA',
    teamId: null,
    information:
      'Conferia pedidos recebidos e identificava divergências de quantidade.',
    sourceId: 'FONTE-EMPREGARE',
    originLabel: 'Currículo — experiência na Loja Horizonte (fictícia)',
    nature: 'relato-do-candidato',
    updatedAt: '2026-08-02',
    visibility: 'compartilhavel',
    links: [
      { jobId: 'VAG-01', criterionId: 'CRI-101' },
      { jobId: 'VAG-02', criterionId: 'CRI-201' },
      { jobId: 'VAG-02', criterionId: 'CRI-202' }
    ],
    interpretation:
      'Experiência relacionada à conferência de pedidos. A autonomia na execução e o uso de planilha ainda não foram verificados.'
  },
  {
    id: 'EVD-ANA-02',
    talentId: 'ANA',
    teamId: null,
    information: 'Quer aprender a rotina de estoque.',
    sourceId: 'FONTE-IEL',
    originLabel: 'Registro IEL — expectativa coletada em atendimento',
    nature: 'registro-iel',
    updatedAt: '2026-08-12',
    visibility: 'compartilhavel',
    links: [
      { jobId: 'VAG-01', criterionId: 'CRI-104' },
      { jobId: 'VAG-01', criterionId: 'CRI-105' },
      { jobId: 'VAG-02', criterionId: 'CRI-204' }
    ],
    interpretation:
      'Interesse declarado nas atividades de estoque, registrado antes desta vaga: não foi preciso pedir a informação novamente.'
  },
  {
    id: 'EVD-ANA-03',
    talentId: 'ANA',
    teamId: null,
    information:
      'Espera orientação de alguém da equipe nas primeiras semanas em uma função nova.',
    sourceId: 'FONTE-IEL',
    originLabel: 'Registro IEL — expectativa coletada em atendimento',
    nature: 'registro-iel',
    updatedAt: '2026-08-12',
    visibility: 'compartilhavel',
    links: [
      { jobId: 'VAG-01', criterionId: 'CRI-106' },
      { jobId: 'VAG-01', criterionId: 'CRI-107' },
      { jobId: 'VAG-02', criterionId: 'CRI-205' }
    ],
    interpretation:
      'Expectativa sobre condições de trabalho. Precisa ser comparada com o apoio que cada equipe oferece, não com a capacidade da pessoa.'
  },
  {
    id: 'EVD-ANA-04',
    talentId: 'ANA',
    teamId: null,
    information:
      'Disponibilidade declarada para o turno da tarde na inscrição desta vaga.',
    sourceId: 'FONTE-EMPREGARE',
    originLabel: 'Candidatura EMPG-DEMO-CAND-8801 (Cerrado Distribuição)',
    nature: 'relato-do-candidato',
    updatedAt: '2026-09-05',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-01', criterionId: 'CRI-103' }],
    interpretation:
      'Informação recente e específica desta candidatura: cobre o turno das 13h às 22h.'
  },
  {
    id: 'EVD-ANA-05',
    talentId: 'ANA',
    teamId: null,
    information:
      'A inscrição na Horizonte Alimentos é de 02/07/2026 e o registro IEL de 10/09/2026 pede reconfirmação da disponibilidade para esta oportunidade.',
    sourceId: 'FONTE-IEL',
    originLabel: 'Registro IEL — anotação de análise',
    nature: 'registro-iel',
    updatedAt: '2026-09-10',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-02', criterionId: 'CRI-203' }],
    interpretation:
      'A disponibilidade existe na base, mas está desatualizada para esta vaga. Precisa de reconfirmação antes do encaminhamento.'
  },

  // --- Bruno Costa ---
  {
    id: 'EVD-BRU-01',
    talentId: 'BRUNO',
    teamId: null,
    information: 'Separava cargas e conferia romaneios antes do carregamento.',
    sourceId: 'FONTE-EMPREGARE',
    originLabel: 'Currículo — experiência na Transportes Araguaia (fictícia)',
    nature: 'relato-do-candidato',
    updatedAt: '2026-08-04',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-01', criterionId: 'CRI-101' }],
    interpretation:
      'Conferência de documentos de carga é atividade relacionada à conferência de pedidos, mesmo com título de cargo diferente.'
  },
  {
    id: 'EVD-BRU-02',
    talentId: 'BRUNO',
    teamId: null,
    information: 'Registrava as saídas do dia em planilha compartilhada.',
    sourceId: 'FONTE-EMPREGARE',
    originLabel: 'Currículo — experiência na Transportes Araguaia (fictícia)',
    nature: 'relato-do-candidato',
    updatedAt: '2026-08-04',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-01', criterionId: 'CRI-102' }],
    interpretation:
      'Há relato de operação de planilha para lançamentos, requisito confirmado pela gestora.'
  },
  {
    id: 'EVD-BRU-03',
    talentId: 'BRUNO',
    teamId: null,
    information: 'Disponibilidade declarada para turnos da tarde e da noite.',
    sourceId: 'FONTE-EMPREGARE',
    originLabel: 'Candidatura EMPG-DEMO-CAND-8802 (Cerrado Distribuição)',
    nature: 'relato-do-candidato',
    updatedAt: '2026-09-04',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-01', criterionId: 'CRI-103' }],
    interpretation: 'Cobre o turno das 13h às 22h.'
  },
  {
    id: 'EVD-BRU-04',
    talentId: 'BRUNO',
    teamId: null,
    information:
      'Declara preferência por autonomia e por decidir a ordem das próprias tarefas.',
    sourceId: 'FONTE-IEL',
    originLabel: 'Registro IEL — expectativa coletada em atendimento',
    nature: 'registro-iel',
    updatedAt: '2026-08-18',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-01', criterionId: 'CRI-107' }],
    interpretation:
      'Preferência declarada sobre condições de trabalho. Não indica maior ou menor capacidade técnica.'
  },

  // --- Carla Mendes ---
  {
    id: 'EVD-CAR-01',
    talentId: 'CARLA',
    teamId: null,
    information:
      'Organizava documentos e notas fiscais e conferia protocolos de entrega.',
    sourceId: 'FONTE-EMPREGARE',
    originLabel: 'Currículo — experiência na Clínica Vale Verde (fictícia)',
    nature: 'relato-do-candidato',
    updatedAt: '2026-07-28',
    visibility: 'compartilhavel',
    links: [
      { jobId: 'VAG-01', criterionId: 'CRI-101' },
      { jobId: 'VAG-03', criterionId: 'CRI-301' }
    ],
    interpretation:
      'Conferência de protocolos tem relação com conferência de pedidos, mas a atividade descrita é administrativa: a equivalência precisa ser confirmada.'
  },
  {
    id: 'EVD-CAR-02',
    talentId: 'CARLA',
    teamId: null,
    information:
      'O currículo cita uso do sistema interno da clínica e não menciona operação de planilhas.',
    sourceId: 'FONTE-EMPREGARE',
    originLabel: 'Currículo — experiência na Clínica Vale Verde (fictícia)',
    nature: 'relato-do-candidato',
    updatedAt: '2026-07-28',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-01', criterionId: 'CRI-102' }],
    interpretation:
      'Requisito obrigatório da vaga 1 sem verificação. Sinalizar e esclarecer, não eliminar automaticamente.'
  },
  {
    id: 'EVD-CAR-03',
    talentId: 'CARLA',
    teamId: null,
    information: 'Disponibilidade integral declarada nas duas inscrições.',
    sourceId: 'FONTE-EMPREGARE',
    originLabel: 'Candidaturas EMPG-DEMO-CAND-8803 e 7712',
    nature: 'relato-do-candidato',
    updatedAt: '2026-09-06',
    visibility: 'compartilhavel',
    links: [
      { jobId: 'VAG-01', criterionId: 'CRI-103' },
      { jobId: 'VAG-03', criterionId: 'CRI-303' }
    ],
    interpretation: 'Cobre os horários das duas vagas em que está inscrita.'
  },
  {
    id: 'EVD-CAR-04',
    talentId: 'CARLA',
    teamId: null,
    information:
      'Quer continuar em rotina administrativa e tem interesse em aprender controle de materiais.',
    sourceId: 'FONTE-IEL',
    originLabel: 'Registro IEL — expectativa coletada em atendimento',
    nature: 'registro-iel',
    updatedAt: '2026-08-20',
    visibility: 'compartilhavel',
    links: [
      { jobId: 'VAG-01', criterionId: 'CRI-104' },
      { jobId: 'VAG-01', criterionId: 'CRI-105' },
      { jobId: 'VAG-03', criterionId: 'CRI-304' }
    ],
    interpretation:
      'O interesse em aprender está registrado; a relação com a rotina de cada vaga precisa ser confirmada com a própria pessoa.'
  },
  {
    id: 'EVD-CAR-05',
    talentId: 'CARLA',
    teamId: null,
    information: 'Atendia o telefone da recepção e direcionava chamadas.',
    sourceId: 'FONTE-EMPREGARE',
    originLabel: 'Currículo — experiência na Clínica Vale Verde (fictícia)',
    nature: 'relato-do-candidato',
    updatedAt: '2026-07-28',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-03', criterionId: 'CRI-302' }],
    interpretation:
      'Atendimento telefônico registrado em rotina administrativa.'
  },

  // --- Diego Alves ---
  {
    id: 'EVD-DIE-01',
    talentId: 'DIEGO',
    teamId: null,
    information:
      'Conferia volumes durante o carregamento e organizava as docas do depósito.',
    sourceId: 'FONTE-EMPREGARE',
    originLabel: 'Currículo — experiência no Depósito Serra Azul (fictício)',
    nature: 'relato-do-candidato',
    updatedAt: '2026-08-06',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-01', criterionId: 'CRI-101' }],
    interpretation:
      'Conferência de volumes é atividade próxima da conferência de pedidos da vaga.'
  },
  {
    id: 'EVD-DIE-02',
    talentId: 'DIEGO',
    teamId: null,
    information:
      'O currículo indica que os lançamentos eram feitos pelo conferente do turno, sem detalhar a participação em planilhas.',
    sourceId: 'FONTE-EMPREGARE',
    originLabel: 'Currículo — experiência no Depósito Serra Azul (fictício)',
    nature: 'relato-do-candidato',
    updatedAt: '2026-08-06',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-01', criterionId: 'CRI-102' }],
    interpretation:
      'Há indício de contato com o registro das movimentações, mas a operação direta da planilha não está confirmada.'
  },
  {
    id: 'EVD-DIE-03',
    talentId: 'DIEGO',
    teamId: null,
    information: 'Disponibilidade integral declarada no currículo.',
    sourceId: 'FONTE-EMPREGARE',
    originLabel: 'Currículo — campo de disponibilidade (versão de 20/11/2025)',
    nature: 'relato-do-candidato',
    updatedAt: '2025-11-20',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-01', criterionId: 'CRI-103' }],
    interpretation:
      'Informação antiga. Conflita com o registro mais recente do IEL.'
  },
  {
    id: 'EVD-DIE-04',
    talentId: 'DIEGO',
    teamId: null,
    information:
      'Informou em atendimento que hoje só consegue trabalhar no período da manhã.',
    sourceId: 'FONTE-IEL',
    originLabel: 'Registro IEL — atendimento de 08/09/2026',
    nature: 'registro-iel',
    updatedAt: '2026-09-08',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-01', criterionId: 'CRI-103' }],
    interpretation:
      'Informação mais recente, em conflito explícito com o currículo. A divergência deve ser exibida e confirmada com a pessoa.'
  },
  {
    id: 'EVD-DIE-05',
    talentId: 'DIEGO',
    teamId: null,
    information:
      'Executava a conferência final do turno sem supervisão direta.',
    sourceId: 'FONTE-EMPREGARE',
    originLabel: 'Currículo — experiência no Depósito Serra Azul (fictício)',
    nature: 'relato-do-candidato',
    updatedAt: '2026-08-06',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-01', criterionId: 'CRI-107' }],
    interpretation:
      'Relato compatível com a execução autônoma descrita na vaga.'
  },

  // --- Elisa Martins ---
  {
    id: 'EVD-ELI-01',
    talentId: 'ELISA',
    teamId: null,
    information:
      'Controlava materiais de consumo e apoiava os inventários trimestrais.',
    sourceId: 'FONTE-EMPREGARE',
    originLabel: 'Currículo — experiência na Indústria Sol Nascente (fictícia)',
    nature: 'relato-do-candidato',
    updatedAt: '2026-08-10',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-02', criterionId: 'CRI-201' }],
    interpretation: 'Atividade diretamente relacionada ao requisito da vaga.'
  },
  {
    id: 'EVD-ELI-02',
    talentId: 'ELISA',
    teamId: null,
    information:
      'Conferia notas de entrada e lançava as movimentações no sistema da indústria.',
    sourceId: 'FONTE-EMPREGARE',
    originLabel: 'Currículo — experiência na Indústria Sol Nascente (fictícia)',
    nature: 'relato-do-candidato',
    updatedAt: '2026-08-10',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-02', criterionId: 'CRI-202' }],
    interpretation:
      'Há relato de lançamento em sistema; a equipe usa planilha e sistema interno.'
  },
  {
    id: 'EVD-ELI-03',
    talentId: 'ELISA',
    teamId: null,
    information: 'Disponibilidade integral declarada na inscrição.',
    sourceId: 'FONTE-EMPREGARE',
    originLabel: 'Candidatura EMPG-DEMO-CAND-9015 (Horizonte Alimentos)',
    nature: 'relato-do-candidato',
    updatedAt: '2026-08-28',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-02', criterionId: 'CRI-203' }],
    interpretation: 'Cobre o horário comercial da vaga.'
  },
  {
    id: 'EVD-ELI-04',
    talentId: 'ELISA',
    teamId: null,
    information: 'Declara interesse em seguir na área de estoque.',
    sourceId: 'FONTE-IEL',
    originLabel: 'Registro IEL — expectativa coletada em atendimento',
    nature: 'registro-iel',
    updatedAt: '2026-08-22',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-02', criterionId: 'CRI-204' }],
    interpretation: 'Interesse declarado e específico para a área da vaga.'
  },
  {
    id: 'EVD-ELI-05',
    talentId: 'ELISA',
    teamId: null,
    information:
      'Avaliação externa fictícia de 30/07/2026: preferência por rotinas estruturadas 4 de 5; conforto com mudanças de prioridade 2 de 5.',
    sourceId: 'FONTE-AVALIACAO',
    originLabel:
      'Inventário Fictício de Preferências de Trabalho — avaliação externa (demonstração)',
    nature: 'avaliacao-externa',
    updatedAt: '2026-07-30',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-02', criterionId: 'CRI-206' }],
    interpretation:
      'Resultado de metodologia e escala próprias, aplicado em processo anterior. Sugere conversar sobre como as prioridades são revisadas; não é nota de qualidade da pessoa.'
  },

  // --- Fábio Lima ---
  {
    id: 'EVD-FAB-01',
    talentId: 'FABIO',
    teamId: null,
    information:
      'Atendia clientes no balcão, emitia pedidos e apoiava o caixa.',
    sourceId: 'FONTE-EMPREGARE',
    originLabel:
      'Currículo — experiência na Distribuidora Boa Vista (fictícia)',
    nature: 'relato-do-candidato',
    updatedAt: '2026-08-15',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-02', criterionId: 'CRI-201' }],
    interpretation:
      'A experiência é de atendimento. Não há informação sobre conferência de pedidos recebidos ou controle de materiais.'
  },
  {
    id: 'EVD-FAB-02',
    talentId: 'FABIO',
    teamId: null,
    information: 'Disponibilidade declarada para horário comercial.',
    sourceId: 'FONTE-EMPREGARE',
    originLabel: 'Candidatura EMPG-DEMO-CAND-9016 (Horizonte Alimentos)',
    nature: 'relato-do-candidato',
    updatedAt: '2026-09-01',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-02', criterionId: 'CRI-203' }],
    interpretation: 'Cobre o horário da vaga.'
  },
  {
    id: 'EVD-FAB-03',
    talentId: 'FABIO',
    teamId: null,
    information:
      'Busca a primeira oportunidade em área administrativa; não informou interesse específico em estoque.',
    sourceId: 'FONTE-IEL',
    originLabel: 'Registro IEL — expectativa coletada em atendimento',
    nature: 'registro-iel',
    updatedAt: '2026-09-01',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-02', criterionId: 'CRI-204' }],
    interpretation:
      'O interesse geral existe; o interesse pelas atividades de estoque precisa ser esclarecido.'
  },

  // --- Gabriela Souza ---
  {
    id: 'EVD-GAB-01',
    talentId: 'GABRIELA',
    teamId: null,
    information:
      'Organizava documentos contábeis, digitalizava arquivos e controlava prazos de entrega.',
    sourceId: 'FONTE-EMPREGARE',
    originLabel:
      'Currículo — experiência na Contabilidade Rio Claro (fictícia)',
    nature: 'relato-do-candidato',
    updatedAt: '2026-08-09',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-03', criterionId: 'CRI-301' }],
    interpretation: 'Atividade diretamente relacionada ao requisito da vaga.'
  },
  {
    id: 'EVD-GAB-02',
    talentId: 'GABRIELA',
    teamId: null,
    information:
      'Cobrava prazos com clientes, sem detalhar se o contato era por telefone.',
    sourceId: 'FONTE-EMPREGARE',
    originLabel:
      'Currículo — experiência na Contabilidade Rio Claro (fictícia)',
    nature: 'relato-do-candidato',
    updatedAt: '2026-08-09',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-03', criterionId: 'CRI-302' }],
    interpretation:
      'Há contato com clientes; o atendimento telefônico em si precisa ser confirmado.'
  },
  {
    id: 'EVD-GAB-03',
    talentId: 'GABRIELA',
    teamId: null,
    information: 'Disponibilidade declarada para horário comercial completo.',
    sourceId: 'FONTE-EMPREGARE',
    originLabel: 'Candidatura EMPG-DEMO-CAND-7713 (Oficina Pantanal)',
    nature: 'relato-do-candidato',
    updatedAt: '2026-09-03',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-03', criterionId: 'CRI-303' }],
    interpretation: 'Cobre o horário das 8h às 18h.'
  },
  {
    id: 'EVD-GAB-04',
    talentId: 'GABRIELA',
    teamId: null,
    information:
      'Busca rotina administrativa estável e tem interesse em aprender rotinas financeiras.',
    sourceId: 'FONTE-IEL',
    originLabel: 'Registro IEL — expectativa coletada em atendimento',
    nature: 'registro-iel',
    updatedAt: '2026-08-25',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-03', criterionId: 'CRI-304' }],
    interpretation:
      'Expectativas registradas e compatíveis com o apoio a orçamentos descrito na vaga.'
  },

  // --- Hugo Santos ---
  {
    id: 'EVD-HUG-01',
    talentId: 'HUGO',
    teamId: null,
    information:
      'Apoiava a emissão de orçamentos, conferia cadastros e organizava pastas de serviço.',
    sourceId: 'FONTE-EMPREGARE',
    originLabel: 'Currículo — experiência na Autopeças Guaicurus (fictícia)',
    nature: 'relato-do-candidato',
    updatedAt: '2026-08-30',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-03', criterionId: 'CRI-301' }],
    interpretation:
      'Rotina próxima da vaga, incluindo organização de documentos de serviço.'
  },
  {
    id: 'EVD-HUG-02',
    talentId: 'HUGO',
    teamId: null,
    information:
      'Disponibilidade declarada até as 17h; a vaga prevê expediente até as 18h.',
    sourceId: 'FONTE-EMPREGARE',
    originLabel: 'Candidatura EMPG-DEMO-CAND-7714 (Oficina Pantanal)',
    nature: 'relato-do-candidato',
    updatedAt: '2026-09-02',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-03', criterionId: 'CRI-303' }],
    interpretation:
      'Diferença de uma hora em relação ao horário da vaga. Pode ser negociável: precisa de confirmação das duas partes.'
  },

  // --- Condições das equipes ---
  {
    id: 'EVD-EQ01-01',
    talentId: null,
    teamId: 'EQ-01',
    information:
      'Solicitação de contexto enviada em 28/08/2026 sem resposta: não há informação sobre acompanhamento nas primeiras atividades no turno da tarde.',
    sourceId: 'FONTE-IEL',
    originLabel: 'Registro IEL — pedido de contexto à empresa',
    nature: 'registro-iel',
    updatedAt: '2026-08-28',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-01', criterionId: 'CRI-106' }],
    interpretation:
      'Espaço não mapeado do contexto organizacional. A ausência de dados não é um ponto negativo da equipe nem dos candidatos.'
  },
  {
    id: 'EVD-EQ01-02',
    talentId: null,
    teamId: 'EQ-01',
    information:
      'A equipe tem pouca sobreposição entre turnos: a tarde começa quando a manhã encerra.',
    sourceId: 'FONTE-EMPRESA',
    originLabel: 'Descrição da vaga (Empregare — demonstração)',
    nature: 'descricao-da-vaga',
    updatedAt: '2026-09-02',
    visibility: 'compartilhavel',
    links: [
      { jobId: 'VAG-01', criterionId: 'CRI-106' },
      { jobId: 'VAG-01', criterionId: 'CRI-107' }
    ],
    interpretation:
      'A pouca sobreposição limita o acompanhamento presencial por colegas de outro turno.'
  },
  {
    id: 'EVD-EQ01-03',
    talentId: null,
    teamId: 'EQ-01',
    information:
      'Prioridades comunicadas por checklist impresso no início do turno.',
    sourceId: 'FONTE-EMPRESA',
    originLabel: 'Descrição da vaga (Empregare — demonstração)',
    nature: 'descricao-da-vaga',
    updatedAt: '2026-09-02',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-01', criterionId: 'CRI-108' }],
    interpretation:
      'Condição descrita na vaga, ainda não confirmada pela gestora responsável.'
  },
  {
    id: 'EVD-EQ01-04',
    talentId: null,
    teamId: 'EQ-01',
    information:
      'A rotina é executada sem supervisão direta durante a maior parte do turno.',
    sourceId: 'FONTE-EMPRESA',
    originLabel: 'Descrição da vaga (Empregare — demonstração)',
    nature: 'descricao-da-vaga',
    updatedAt: '2026-09-02',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-01', criterionId: 'CRI-107' }],
    interpretation:
      'Condição da vaga que deve ser comparada às expectativas declaradas de cada pessoa.'
  },
  {
    id: 'EVD-EQ02-01',
    talentId: null,
    teamId: 'EQ-02',
    information:
      'Colega de referência acompanha a pessoa nas primeiras quatro semanas.',
    sourceId: 'FONTE-EMPRESA',
    originLabel: 'Contexto da empresa — confirmado pelo gestor Rafael Nogueira',
    nature: 'confirmado-pelo-gestor',
    updatedAt: '2026-08-30',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-02', criterionId: 'CRI-205' }],
    interpretation:
      'Condição confirmada pela empresa: existe apoio inicial estruturado nesta equipe.'
  },
  {
    id: 'EVD-EQ02-02',
    talentId: null,
    teamId: 'EQ-02',
    information: 'Reunião semanal de prioridades com o gestor da área.',
    sourceId: 'FONTE-EMPRESA',
    originLabel: 'Contexto da empresa — confirmado pelo gestor Rafael Nogueira',
    nature: 'confirmado-pelo-gestor',
    updatedAt: '2026-08-30',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-02', criterionId: 'CRI-206' }],
    interpretation: 'Prática de comunicação registrada e confirmada.'
  },
  {
    id: 'EVD-EQ02-03',
    talentId: null,
    teamId: 'EQ-02',
    information:
      'Movimentações registradas em planilha compartilhada e no sistema interno de estoque.',
    sourceId: 'FONTE-EMPRESA',
    originLabel: 'Contexto da empresa — confirmado pelo gestor Rafael Nogueira',
    nature: 'confirmado-pelo-gestor',
    updatedAt: '2026-08-30',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-02', criterionId: 'CRI-202' }],
    interpretation:
      'Define o que o requisito de registro significa nesta equipe.'
  },
  {
    id: 'EVD-EQ03-01',
    talentId: null,
    teamId: 'EQ-03',
    information:
      'Atividades e condições da equipe descritas apenas em linhas gerais, sem detalhamento de apoio ou rotina.',
    sourceId: 'FONTE-EMPRESA',
    originLabel: 'Descrição da vaga (Empregare — demonstração)',
    nature: 'descricao-da-vaga',
    updatedAt: '2026-08-12',
    visibility: 'compartilhavel',
    links: [{ jobId: 'VAG-03', criterionId: 'CRI-305' }],
    interpretation:
      'Sem informação suficiente para comparar candidatos na dimensão organizacional desta vaga.'
  }
];
