import type { Job } from '../types';

/**
 * Vagas da base demo. Cada vaga traz uma lista pequena e explícita de
 * critérios, com dimensão, obrigatoriedade e quem confirmou o requisito.
 */
export const DEMO_JOBS: Job[] = [
  {
    id: 'VAG-01',
    title: 'Assistente de Logística',
    companyId: 'EMP-01',
    teamId: 'EQ-01',
    location: 'Goiânia, GO',
    workShift: 'Turno da tarde (13h às 22h)',
    stage: 'em-selecao',
    summary:
      'Apoio à expedição: conferência de pedidos, registro de saídas e organização das cargas do turno da tarde.',
    essentialRequirements: [
      'Conferência de pedidos com identificação de divergências',
      'Registro das movimentações em planilha',
      'Disponibilidade para o turno da tarde'
    ],
    organizationalContext:
      'Equipe com pouca sobreposição entre turnos. O apoio nas primeiras atividades ainda não foi confirmado pela empresa.',
    criteria: [
      {
        id: 'CRI-101',
        label: 'Conferência de pedidos',
        question:
          'Há registro de experiência conferindo pedidos e identificando divergências?',
        dimension: 'tecnica',
        required: true,
        confirmedBy: 'Descrição da vaga (Empregare — demonstração)'
      },
      {
        id: 'CRI-102',
        label: 'Registro em planilha',
        question:
          'Há registro de operação de planilha para lançar movimentações?',
        dimension: 'tecnica',
        required: true,
        confirmedBy: 'Requisito confirmado pela gestora Marina Duarte'
      },
      {
        id: 'CRI-103',
        label: 'Disponibilidade no turno',
        question: 'A disponibilidade declarada cobre o turno das 13h às 22h?',
        dimension: 'profissional',
        required: true,
        confirmedBy: 'Descrição da vaga (Empregare — demonstração)'
      },
      {
        id: 'CRI-104',
        label: 'Interesse nas atividades',
        question:
          'Existe interesse declarado nas atividades de expedição e estoque?',
        dimension: 'profissional',
        required: false,
        confirmedBy: 'Registro IEL — demonstração'
      },
      {
        id: 'CRI-105',
        label: 'Expectativa de aprendizado',
        question:
          'A expectativa de aprendizado declarada é compatível com a rotina oferecida?',
        dimension: 'profissional',
        required: false,
        confirmedBy: 'Registro IEL — demonstração'
      },
      {
        id: 'CRI-106',
        label: 'Apoio inicial',
        question:
          'Há acompanhamento disponível nas primeiras atividades, no turno da vaga?',
        dimension: 'organizacional',
        required: false,
        confirmedBy: 'A confirmar com a empresa'
      },
      {
        id: 'CRI-107',
        label: 'Autonomia na execução',
        question:
          'A rotina exige execução autônoma durante boa parte do turno; há informação sobre isso?',
        dimension: 'organizacional',
        required: false,
        confirmedBy: 'Descrição da vaga (Empregare — demonstração)'
      },
      {
        id: 'CRI-108',
        label: 'Comunicação de prioridades',
        question:
          'A forma de comunicar prioridades (checklist no início do turno) está confirmada?',
        dimension: 'organizacional',
        required: false,
        confirmedBy: 'Descrição da vaga (Empregare — demonstração)'
      }
    ],
    externalRef: {
      system: 'Empregare — demonstração',
      account: 'Cerrado Distribuição',
      id: 'EMPG-DEMO-3391'
    },
    updatedAt: '2026-09-13'
  },
  {
    id: 'VAG-02',
    title: 'Assistente de Estoque',
    companyId: 'EMP-02',
    teamId: 'EQ-02',
    location: 'Anápolis, GO',
    workShift: 'Horário comercial (8h às 17h)',
    stage: 'em-selecao',
    summary:
      'Apoio administrativo ao estoque: controle de materiais, registro de entradas e saídas e apoio a inventários.',
    essentialRequirements: [
      'Controle de materiais',
      'Registro de entradas e saídas',
      'Disponibilidade em horário comercial'
    ],
    organizationalContext:
      'O gestor confirmou colega de referência nas primeiras quatro semanas e reunião semanal de prioridades.',
    criteria: [
      {
        id: 'CRI-201',
        label: 'Controle de materiais',
        question:
          'Há registro de experiência com controle ou conferência de materiais?',
        dimension: 'tecnica',
        required: true,
        confirmedBy: 'Requisito confirmado pelo gestor Rafael Nogueira'
      },
      {
        id: 'CRI-202',
        label: 'Registro de entradas e saídas',
        question:
          'Há registro de lançamentos em planilha ou sistema de estoque?',
        dimension: 'tecnica',
        required: true,
        confirmedBy: 'Requisito confirmado pelo gestor Rafael Nogueira'
      },
      {
        id: 'CRI-203',
        label: 'Disponibilidade no horário',
        question:
          'A disponibilidade declarada cobre o horário comercial e está atualizada?',
        dimension: 'profissional',
        required: true,
        confirmedBy: 'Descrição da vaga (Empregare — demonstração)'
      },
      {
        id: 'CRI-204',
        label: 'Interesse em estoque',
        question: 'Existe interesse declarado nas atividades de estoque?',
        dimension: 'profissional',
        required: false,
        confirmedBy: 'Registro IEL — demonstração'
      },
      {
        id: 'CRI-205',
        label: 'Apoio inicial',
        question:
          'A expectativa de orientação inicial encontra apoio na equipe?',
        dimension: 'organizacional',
        required: false,
        confirmedBy: 'Condição confirmada pelo gestor Rafael Nogueira'
      },
      {
        id: 'CRI-206',
        label: 'Revisão de prioridades',
        question:
          'A forma de revisar prioridades da equipe está registrada e confirmada?',
        dimension: 'organizacional',
        required: false,
        confirmedBy: 'Condição confirmada pelo gestor Rafael Nogueira'
      }
    ],
    externalRef: {
      system: 'Empregare — demonstração',
      account: 'Horizonte Alimentos',
      id: 'EMPG-DEMO-4127'
    },
    updatedAt: '2026-09-12'
  },
  {
    id: 'VAG-03',
    title: 'Assistente Administrativo',
    companyId: 'EMP-03',
    teamId: 'EQ-03',
    location: 'Campo Grande, MS',
    workShift: 'Horário comercial (8h às 18h)',
    stage: 'aberta',
    summary:
      'Assistência administrativa: organização de documentos, atendimento telefônico e apoio a orçamentos.',
    essentialRequirements: [
      'Organização de documentos',
      'Disponibilidade em horário comercial'
    ],
    organizationalContext:
      'Atividades e expectativas da equipe estão parcialmente documentadas; o contexto organizacional ainda é insuficiente para comparar candidatos nessa dimensão.',
    criteria: [
      {
        id: 'CRI-301',
        label: 'Organização de documentos',
        question:
          'Há registro de experiência organizando documentos e arquivos?',
        dimension: 'tecnica',
        required: true,
        confirmedBy: 'Descrição da vaga (Empregare — demonstração)'
      },
      {
        id: 'CRI-302',
        label: 'Atendimento telefônico',
        question: 'Há registro de atendimento telefônico ou ao público?',
        dimension: 'tecnica',
        required: false,
        confirmedBy: 'Descrição da vaga (Empregare — demonstração)'
      },
      {
        id: 'CRI-303',
        label: 'Disponibilidade no horário',
        question: 'A disponibilidade declarada cobre o horário comercial?',
        dimension: 'profissional',
        required: true,
        confirmedBy: 'Descrição da vaga (Empregare — demonstração)'
      },
      {
        id: 'CRI-304',
        label: 'Expectativas profissionais',
        question:
          'As expectativas profissionais registradas dialogam com a oportunidade?',
        dimension: 'profissional',
        required: false,
        confirmedBy: 'Registro IEL — demonstração'
      },
      {
        id: 'CRI-305',
        label: 'Contexto da equipe',
        question:
          'As condições de trabalho da equipe estão documentadas o suficiente para analisar?',
        dimension: 'organizacional',
        required: false,
        confirmedBy: 'A confirmar com a empresa'
      }
    ],
    externalRef: {
      system: 'Empregare — demonstração',
      account: 'Oficina Pantanal',
      id: 'EMPG-DEMO-2055'
    },
    updatedAt: '2026-09-08'
  }
];
