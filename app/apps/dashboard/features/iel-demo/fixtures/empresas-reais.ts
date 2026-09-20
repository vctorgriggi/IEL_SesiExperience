import {
  addDays,
  buildInviteToken,
  CULTURE_CONSENT_VERSION,
  CULTURE_INVITE_DEADLINE_DAYS,
  CULTURE_INVITE_TOKEN_SEED,
  type CultureInviteRole
} from '../analysis/culture-invites';
import type { FitAxisId } from '../analysis/fit-axes';
import {
  blocoDoConvite,
  itensDoTema,
  type ItemDoInstrumento,
  type ValorDaEscala
} from '../analysis/instrumento';
import type {
  Company,
  CultureAnswer,
  CultureRespondentInvite,
  Job,
  Team
} from '../types';
import {
  createRandom,
  responderFrase,
  type AlvoCultural
} from './respostas-sinteticas';

/**
 * Empresas reais de Cuiabá na base de demonstração.
 *
 * O dono do produto pediu uma base "mais realista": empresas que existem,
 * com o que elas mesmas publicam sobre si. Cinco entraram, todas com sede em
 * Cuiabá e informação pública suficiente para sustentar um traçado
 * ilustrativo (a lista de fontes por empresa está em
 * `docs/cliente/05-seed-empresas-reais.md`):
 *
 * - **EMP-04 Colatte** — software sob medida, equipe pequena. Fonte:
 *   https://www.colatte.io/ (consultado em 19/09/2026). É a empresa da vaga
 *   principal da demonstração.
 * - **EMP-05 Log,Lab Inteligência Digital** — TI para o setor público, mais
 *   de 200 colaboradores, CMMI nível 5, GPTW. Fontes:
 *   https://www.loglabdigital.com.br/ e https://loglabdigital.com.br/carreira.
 * - **EMP-06 Amaggi** — agronegócio e logística, matriz em Cuiabá, cerca de
 *   10 mil colaboradores. Fontes: https://www.amaggi.com.br/trabalhe-na-amaggi/
 *   e os relatórios de sustentabilidade publicados no mesmo site.
 * - **EMP-07 Grupo Norte Logística** — transporte, armazenagem e
 *   distribuição, Distrito Industrial de Cuiabá. Fonte:
 *   https://gruponortelogistica.com.br/.
 * - **EMP-08 Bom Futuro** — agroindústria (grãos, algodão, sementes,
 *   energia), matriz em Cuiabá, mais de 8 mil colaboradores. Fontes:
 *   https://bomfuturo.com.br/pt-br/sobre e https://bomfuturo.com.br/pt-br/carreira.
 *
 * ## O limite ético, escrito antes do dado
 *
 * No produto, o perfil cultural de uma empresa é **o que a amostra de
 * colaboradores responde** (R2). Não temos essa amostra para nenhuma destas
 * empresas. O que está aqui é um **traçado ilustrativo, derivado da cultura
 * que cada uma declara publicamente** no próprio site — e o mapeamento de
 * tema a tema, com a frase pública que sustenta cada valor, está no
 * comentário de cada empresa abaixo. Onde o valor é inferência nossa (porte,
 * setor), o comentário diz "inferência".
 *
 * A mesma ressalva está gravada na descrição institucional de cada empresa,
 * que a tela mostra, e vai continuar valendo até a empresa responder pela
 * própria tela: as respostas sintéticas voltam a cada carga e a declaração
 * real da gestão as substitui.
 *
 * **Nenhuma pessoa real entra.** Contato é o canal genérico do site (nunca
 * e-mail pessoal); gestor de equipe é "gestão da área", sem nome; os
 * convites da amostra usam endereços `*.example.com`, e não o domínio real,
 * para não existir na base um e-mail que possa ser de alguém. Candidatos são
 * fictícios (`candidatos-reais.ts`).
 *
 * ## Como as respostas são produzidas
 *
 * Igual às empresas curadas (`culture.ts`): cada convite respondido responde
 * o próprio bloco de 16 frases (`blocoDoConvite`), no alvo da empresa, com
 * ruído determinístico. Duas diferenças, de propósito:
 *
 * - **Toda resposta de equipe carrega `inviteId`.** É a marca de que a pessoa
 *   respondeu por link, sob a promessa de anonimato, e é o que faz o piso de
 *   `MIN_RESPOSTAS_ANONIMAS` valer. A gestão responde pela tela da empresa,
 *   como declaração, sem convite.
 * - **Cada tema tem uma frase "marcante" escolhida à mão** (`ALVO_*`, campo
 *   `itens`): é ela que `escolherPerguntasDoCandidato` vai eleger para o
 *   candidato daquela empresa. Sem isso a escolha sairia do ruído, e a cena
 *   de reaproveitamento parcial — o candidato da demonstração já respondeu 3
 *   das 10 frases da Colatte numa candidatura à Norte Logística — dependeria
 *   de sorte. Colatte e Norte compartilham exatamente três frases (I25, I39,
 *   I40).
 */

/** Semente própria: acrescentar empresas não desloca nada do que já existia. */
const SEED_EMPRESAS_REAIS = 20260926;

const CONSULTADO_EM = '19/09/2026';

/** Texto que acompanha cada descrição institucional. */
function notaDePerfilIlustrativo(url: string): string {
  return `Perfil ilustrativo, derivado de informação pública em ${url} (consultado em ${CONSULTADO_EM}); a empresa responde pela própria tela.`;
}

/* ------------------------------------------------------------------ *
 * Empresas
 * ------------------------------------------------------------------ */

export const EMPRESAS_REAIS: Company[] = [
  {
    id: 'EMP-04',
    name: 'Colatte',
    sector: 'Tecnologia — software sob medida',
    location: 'Cuiabá, MT',
    institutionalDescription: `Desenvolve sites, sistemas, automações e produtos digitais sob medida, "feitos em Cuiabá" e "por quem você conhece pelo nome". Declara trabalhar em ciclos curtos, com o cliente validando cada etapa, sem intermediários e com escopo, prazo e preço no papel antes de começar. ${notaDePerfilIlustrativo('colatte.io')}`,
    contactName: 'Contato institucional (site)',
    contactEmail: 'contato@colatte.io',
    sourceId: 'FONTE-EMPRESA',
    updatedAt: '2026-09-18',
    cultureSuggestions: [
      {
        axisId: 'interacao-convivencia',
        value: 5,
        excerpt: 'Sem intermediários: você fala com quem escreve o código.',
        sourceLabel: 'Site da empresa — colatte.io (consultado em 19/09/2026)',
        sourceId: 'FONTE-EMPRESA'
      },
      {
        axisId: 'orientacao-resultados',
        value: 4,
        excerpt:
          'Nenhuma linha de código antes de entender o problema. Software bom começa ouvindo.',
        sourceLabel: 'Site da empresa — colatte.io (consultado em 19/09/2026)',
        sourceId: 'FONTE-EMPRESA'
      },
      {
        axisId: 'execucao-ritmo',
        value: 2,
        excerpt:
          'Ciclos curtos, com você validando cada etapa. Ninguém some por três meses pra voltar com surpresa.',
        sourceLabel: 'Site da empresa — colatte.io (consultado em 19/09/2026)',
        sourceId: 'FONTE-EMPRESA'
      }
    ]
  },
  {
    id: 'EMP-05',
    name: 'Log,Lab Inteligência Digital',
    sector: 'Tecnologia — sistemas para o setor público',
    location: 'Cuiabá, MT — Jardim Aclimação',
    institutionalDescription: `Há mais de 20 anos desenvolve sistemas de gestão para órgãos públicos (saúde, educação, contratos). Declara mais de 200 colaboradores, certificação CMMI nível 5 e GPTW, e valores de "eficiência, inovação, integridade, excelência, ética e transparência". ${notaDePerfilIlustrativo('loglabdigital.com.br')}`,
    contactName: 'Contato institucional (site)',
    contactEmail: 'contato@loglab.example.com',
    sourceId: 'FONTE-EMPRESA',
    updatedAt: '2026-09-16',
    cultureSuggestions: [
      {
        axisId: 'regras-decisao',
        value: 5,
        excerpt:
          'Conquistou recentemente a CMMI Nível 5. Apenas ela e mais uma outra empresa no Brasil possuem essa chancela.',
        sourceLabel:
          'Site da empresa — loglabdigital.com.br (consultado em 19/09/2026)',
        sourceId: 'FONTE-EMPRESA'
      },
      {
        axisId: 'aprendizado-desenvolvimento',
        value: 5,
        excerpt:
          'Aprendizado constante; investe em cursos e certificações internacionais.',
        sourceLabel:
          'Página de carreiras — loglabdigital.com.br/carreira (consultado em 19/09/2026)',
        sourceId: 'FONTE-EMPRESA'
      }
    ]
  },
  {
    id: 'EMP-06',
    name: 'Amaggi',
    sector: 'Agronegócio e logística',
    location: 'Cuiabá, MT — Alvorada (matriz)',
    institutionalDescription: `Companhia de grãos e fibras com sede em Cuiabá, presente da produção agrícola à originação, processamento, logística e energia renovável; declara cerca de 10 mil colaboradores. Valores publicados: integridade, simplicidade ("foco no essencial, agilidade e simplificação"), humildade, comprometimento e gestão participativa. ${notaDePerfilIlustrativo('amaggi.com.br')}`,
    contactName: 'Contato institucional (site)',
    contactEmail: 'contato@amaggi.example.com',
    sourceId: 'FONTE-EMPRESA',
    updatedAt: '2026-09-15',
    cultureSuggestions: [
      {
        axisId: 'interacao-convivencia',
        value: 4,
        excerpt:
          'Gestão participativa: estimula a participação, promove reconhecimento e crescimento profissional, envolve as pessoas em processos importantes da companhia.',
        sourceLabel:
          'Relatório de Sustentabilidade — amaggi.com.br (consultado em 19/09/2026)',
        sourceId: 'FONTE-EMPRESA'
      },
      {
        axisId: 'regras-decisao',
        value: 4,
        excerpt: 'Integridade: ser ético, justo e coerente.',
        sourceLabel:
          'Trabalhe na Amaggi — amaggi.com.br (consultado em 19/09/2026)',
        sourceId: 'FONTE-EMPRESA'
      }
    ]
  },
  {
    id: 'EMP-07',
    name: 'Grupo Norte Logística',
    sector: 'Distribuição e logística',
    location: 'Cuiabá, MT — Distrito Industrial',
    institutionalDescription: `Transporte, armazenagem e distribuição de cargas em Mato Grosso e Pará, com sede no Distrito Industrial de Cuiabá e cinco unidades; fundada em 2010. Declara como valores "padrão de qualidade", "construir parcerias duradouras", "profissionais capacitados em todos os setores" e "segurança em ponto de apoio estratégico". ${notaDePerfilIlustrativo('gruponortelogistica.com.br')}`,
    contactName: 'Contato institucional (site)',
    contactEmail: 'contato@gruponorte.example.com',
    sourceId: 'FONTE-EMPRESA',
    updatedAt: '2026-09-17',
    cultureSuggestions: [
      {
        axisId: 'etica-seguranca',
        value: 4,
        excerpt: 'Segurança em Ponto de Apoio Estratégico.',
        sourceLabel:
          'Site da empresa — gruponortelogistica.com.br (consultado em 19/09/2026)',
        sourceId: 'FONTE-EMPRESA'
      },
      {
        axisId: 'aprendizado-desenvolvimento',
        value: 4,
        excerpt: 'Profissionais Capacitados em Todos os Setores.',
        sourceLabel:
          'Site da empresa — gruponortelogistica.com.br (consultado em 19/09/2026)',
        sourceId: 'FONTE-EMPRESA'
      }
    ]
  },
  {
    id: 'EMP-08',
    name: 'Bom Futuro',
    sector: 'Agroindústria',
    location: 'Cuiabá, MT (matriz)',
    institutionalDescription: `Grupo agroindustrial fundado em 1982, com matriz em Cuiabá: produção de grãos e algodão, beneficiamento de sementes, energia e serviços; declara mais de 8 mil colaboradores. Valores publicados: comprometimento, empreendedorismo, ética, simplicidade e sustentabilidade; missão de "inovar na produção de commodities agrícolas". ${notaDePerfilIlustrativo('bomfuturo.com.br')}`,
    contactName: 'Contato institucional (site)',
    contactEmail: 'contato@bomfuturo.example.com',
    sourceId: 'FONTE-EMPRESA',
    updatedAt: '2026-09-14',
    cultureSuggestions: [
      {
        axisId: 'inovacao',
        value: 2,
        excerpt:
          'Inovar na produção de commodities agrícolas, diversificar e promover a sinergia nos demais segmentos de atuação.',
        sourceLabel:
          'Sobre nós — bomfuturo.com.br/pt-br/sobre (consultado em 19/09/2026)',
        sourceId: 'FONTE-EMPRESA'
      }
    ]
  }
];

/* ------------------------------------------------------------------ *
 * Equipes
 * ------------------------------------------------------------------ */

const GESTAO = 'Gestão da área (sem nome na base)';

export const EQUIPES_REAIS: Team[] = [
  {
    id: 'EQ-04',
    companyId: 'EMP-04',
    name: 'Desenvolvimento e suporte',
    routine:
      'Atendimento a clientes, testes das telas entregues em cada ciclo, registro de ocorrências e apoio a implantação, em horário comercial.',
    managerName: GESTAO,
    managerEmail: 'contato@colatte.io',
    conditions: [
      {
        id: 'COND-401',
        axisId: 'execucao-ritmo',
        label: 'Demandas simultâneas',
        value:
          'Vários clientes ao mesmo tempo: um chamado interrompe o teste em andamento e é preciso alternar.',
        status: 'da-descricao',
        origin: 'Descrição da vaga (Empregare)',
        updatedAt: '2026-09-18'
      },
      {
        id: 'COND-402',
        axisId: 'interacao-convivencia',
        label: 'Comunicação com o cliente',
        value:
          'Quem atende fala direto com o cliente e com quem escreve o código, sem intermediário.',
        status: 'da-descricao',
        origin: 'Site da empresa — colatte.io',
        updatedAt: '2026-09-18'
      },
      {
        id: 'COND-403',
        axisId: 'lideranca-autonomia',
        label: 'Apoio nas primeiras atividades',
        value: 'Ainda não informado pela empresa.',
        status: 'a-confirmar',
        informed: false,
        origin: 'Contexto da empresa',
        updatedAt: '2026-09-18'
      }
    ]
  },
  {
    id: 'EQ-05',
    companyId: 'EMP-05',
    name: 'Service desk — sistemas de saúde',
    routine:
      'Atendimento de chamados de unidades de saúde e prefeituras, registro em ferramenta de tickets, escalonamento por procedimento, das 7h às 19h em turnos.',
    managerName: GESTAO,
    managerEmail: 'contato@loglab.example.com',
    conditions: [
      {
        id: 'COND-501',
        axisId: 'regras-decisao',
        label: 'Procedimento de atendimento',
        value:
          'Todo chamado segue roteiro de classificação e escalonamento documentado (processo certificado).',
        status: 'da-descricao',
        origin: 'Site da empresa — loglabdigital.com.br',
        updatedAt: '2026-09-16'
      },
      {
        id: 'COND-502',
        axisId: 'aprendizado-desenvolvimento',
        label: 'Trilha de aprendizado',
        value:
          'Cursos e certificações internos, declarados na página de carreiras.',
        status: 'da-descricao',
        origin: 'Página de carreiras — loglabdigital.com.br/carreira',
        updatedAt: '2026-09-16'
      }
    ]
  },
  {
    id: 'EQ-06',
    companyId: 'EMP-06',
    name: 'Apoio à logística — matriz',
    routine:
      'Conferência de documentos de transporte, acompanhamento de cargas com transportadoras e registro em sistema, em horário comercial com picos na safra.',
    managerName: GESTAO,
    managerEmail: 'contato@amaggi.example.com',
    conditions: [
      {
        id: 'COND-601',
        axisId: 'adaptacao-carreira',
        label: 'Horários na safra',
        value:
          'Na safra a rotina se estende e os horários são reorganizados (inferência a partir do setor; a confirmar).',
        status: 'a-confirmar',
        origin: 'Contexto da empresa',
        updatedAt: '2026-09-15'
      },
      {
        id: 'COND-602',
        axisId: 'regras-decisao',
        label: 'Registro e conformidade',
        value:
          'Toda movimentação segue procedimento escrito e programa de integridade.',
        status: 'da-descricao',
        origin: 'Trabalhe na Amaggi — amaggi.com.br',
        updatedAt: '2026-09-15'
      }
    ]
  },
  {
    id: 'EQ-07',
    companyId: 'EMP-07',
    name: 'Armazém e conferência — Distrito Industrial',
    routine:
      'Recebimento e conferência de cargas fracionadas, separação por rota e carregamento, em turnos da manhã e da noite.',
    managerName: GESTAO,
    managerEmail: 'contato@gruponorte.example.com',
    conditions: [
      {
        id: 'COND-701',
        axisId: 'execucao-ritmo',
        label: 'Ritmo do pátio',
        value:
          'As cargas chegam juntas no início do turno; quem confere alterna entre docas.',
        status: 'da-descricao',
        origin: 'Descrição da vaga (Empregare)',
        updatedAt: '2026-09-17'
      },
      {
        id: 'COND-702',
        axisId: 'lideranca-autonomia',
        label: 'Apoio nas primeiras atividades',
        value: 'Encarregado do turno acompanha a primeira semana.',
        status: 'confirmado',
        origin: 'Contexto da empresa — informado na ligação',
        updatedAt: '2026-09-17'
      }
    ]
  },
  {
    id: 'EQ-08',
    companyId: 'EMP-08',
    name: 'Almoxarifado — matriz',
    routine:
      'Recebimento de materiais, conferência de notas, organização do almoxarifado e atendimento às áreas internas, em horário comercial.',
    managerName: GESTAO,
    managerEmail: 'contato@bomfuturo.example.com',
    conditions: [
      {
        id: 'COND-801',
        axisId: 'regras-decisao',
        label: 'Registro de movimentações',
        value: 'Sistema interno com procedimento de entrada e saída.',
        status: 'da-descricao',
        origin: 'Descrição da vaga (Empregare)',
        updatedAt: '2026-09-14'
      }
    ]
  }
];

/* ------------------------------------------------------------------ *
 * Vagas
 * ------------------------------------------------------------------ */

const SYSTEM = 'Empregare';

export const VAGAS_REAIS: Job[] = [
  {
    // A vaga principal da demonstração: é nela que o candidato responde ao
    // vivo, no celular, e aparece na mesa.
    id: 'VAG-06',
    title: 'Assistente de Suporte e Testes de Software',
    companyId: 'EMP-04',
    teamId: 'EQ-04',
    location: 'Cuiabá, MT',
    workShift: 'Horário comercial (9h às 18h)',
    stage: 'em-selecao',
    summary:
      'Atender clientes dos sistemas entregues, testar as telas de cada ciclo seguindo roteiro, registrar o que deu errado e apoiar a implantação com quem escreve o código.',
    essentialRequirements: [
      'Atendimento a clientes com registro de chamados',
      'Testes seguindo roteiro e registro de ocorrências',
      'Planilha e comunicação escrita clara',
      'Curso técnico em informática ou experiência equivalente'
    ],
    organizationalContext:
      'Equipe pequena, sem intermediário entre quem atende e quem programa. Os chamados chegam de vários clientes ao mesmo tempo e interrompem o teste em andamento. O apoio nas primeiras semanas ainda não foi confirmado pela empresa.',
    criteria: [
      {
        id: 'CRI-601',
        label: 'Atendimento e registro de chamados',
        question:
          'Há registro de atendimento a clientes com abertura e acompanhamento de chamados?',
        dimension: 'tecnica',
        required: true,
        confirmedBy: 'Descrição da vaga (Empregare)'
      },
      {
        id: 'CRI-602',
        label: 'Testes seguindo roteiro',
        question:
          'Há registro de conferência ou teste seguindo roteiro, com registro do que saiu diferente?',
        dimension: 'tecnica',
        required: true,
        confirmedBy: 'Descrição da vaga (Empregare)'
      },
      {
        id: 'CRI-603',
        label: 'Planilha e registro de ocorrências',
        question:
          'Há registro de operação de planilha ou sistema para lançar ocorrências?',
        dimension: 'tecnica',
        required: false,
        confirmedBy: 'Descrição da vaga (Empregare)'
      },
      {
        id: 'CRI-604',
        label: 'Formação em informática',
        question:
          'Há curso técnico em informática concluído ou em andamento, ou experiência equivalente?',
        dimension: 'tecnica',
        required: false,
        confirmedBy: 'Descrição da vaga (Empregare)'
      },
      {
        id: 'CRI-605',
        label: 'Disponibilidade em horário comercial',
        question: 'A disponibilidade declarada cobre o horário das 9h às 18h?',
        dimension: 'profissional',
        required: true,
        confirmedBy: 'Descrição da vaga (Empregare)'
      },
      {
        id: 'CRI-606',
        label: 'Interesse em tecnologia',
        question:
          'Existe interesse declarado em trabalhar com software e atendimento técnico?',
        dimension: 'profissional',
        required: false,
        confirmedBy: 'Registro IEL'
      },
      {
        id: 'CRI-607',
        label: 'Apoio inicial',
        question:
          'Há acompanhamento disponível nas primeiras semanas, para quem vem de outra área?',
        dimension: 'organizacional',
        required: false,
        confirmedBy: 'A confirmar com a empresa'
      },
      {
        id: 'CRI-608',
        label: 'Demandas simultâneas',
        question:
          'A rotina alterna entre chamados e testes; há informação sobre como a pessoa lida com isso?',
        dimension: 'organizacional',
        required: false,
        confirmedBy: 'Descrição da vaga (Empregare)'
      }
    ],
    axisWeights: {
      // O ritmo é o que decide esta vaga: chamado interrompe teste, e quem
      // precisa terminar uma coisa antes de começar outra sente isso no
      // primeiro mês. Conversa direta pesa alto pelo mesmo motivo — não há
      // intermediário entre quem atende e quem programa.
      'execucao-ritmo': 'alto',
      'interacao-convivencia': 'alto',
      'lideranca-autonomia': 'medio',
      inovacao: 'medio',
      'aprendizado-desenvolvimento': 'medio',
      'regras-decisao': 'baixo'
    },
    axisWeightSuggestions: [
      {
        axisId: 'execucao-ritmo',
        weight: 'alto',
        excerpt:
          'Os chamados chegam de vários clientes ao mesmo tempo e interrompem o teste em andamento.',
        sourceLabel: 'Contexto organizacional da vaga',
        sourceId: 'FONTE-EMPREGARE'
      },
      {
        axisId: 'interacao-convivencia',
        weight: 'alto',
        excerpt: 'Sem intermediários: você fala com quem escreve o código.',
        sourceLabel: 'Site da empresa — colatte.io',
        sourceId: 'FONTE-EMPRESA'
      }
    ],
    externalRef: { system: SYSTEM, account: 'Colatte', id: 'EMPG-DEMO-6001' },
    updatedAt: '2026-09-20'
  },
  {
    id: 'VAG-07',
    title: 'Auxiliar Administrativo e Financeiro',
    companyId: 'EMP-04',
    teamId: 'EQ-04',
    location: 'Cuiabá, MT',
    workShift: 'Horário comercial (9h às 18h)',
    stage: 'aberta',
    summary:
      'Emissão de notas e propostas, controle de recebimentos e organização dos contratos de cada projeto.',
    essentialRequirements: [
      'Emissão de notas fiscais de serviço',
      'Controle de contas a receber em planilha',
      'Organização de documentos e contratos'
    ],
    organizationalContext:
      'Mesma equipe pequena da vaga de suporte; a rotina administrativa é dividida com os sócios.',
    criteria: [
      {
        id: 'CRI-701',
        label: 'Emissão de notas',
        question: 'Há registro de emissão de notas fiscais de serviço?',
        dimension: 'tecnica',
        required: true,
        confirmedBy: 'Descrição da vaga (Empregare)'
      },
      {
        id: 'CRI-702',
        label: 'Controle de recebimentos',
        question:
          'Há registro de controle de contas a receber em planilha ou sistema?',
        dimension: 'tecnica',
        required: true,
        confirmedBy: 'Descrição da vaga (Empregare)'
      },
      {
        id: 'CRI-703',
        label: 'Disponibilidade no horário',
        question: 'A disponibilidade declarada cobre o horário comercial?',
        dimension: 'profissional',
        required: true,
        confirmedBy: 'Descrição da vaga (Empregare)'
      },
      {
        id: 'CRI-704',
        label: 'Rotina dividida',
        question:
          'As expectativas registradas dialogam com uma rotina administrativa dividida com os sócios?',
        dimension: 'organizacional',
        required: false,
        confirmedBy: 'Registro IEL'
      }
    ],
    axisWeights: {
      'interacao-convivencia': 'alto',
      'regras-decisao': 'medio',
      'execucao-ritmo': 'medio'
    },
    axisWeightSuggestions: [],
    externalRef: { system: SYSTEM, account: 'Colatte', id: 'EMPG-DEMO-6002' },
    updatedAt: '2026-09-18'
  },
  {
    id: 'VAG-08',
    title: 'Analista de Suporte Júnior (Service Desk)',
    companyId: 'EMP-05',
    teamId: 'EQ-05',
    location: 'Cuiabá, MT — Jardim Aclimação',
    workShift: 'Turnos entre 7h e 19h (escala fixa)',
    stage: 'em-selecao',
    summary:
      'Atender chamados de unidades de saúde e prefeituras que usam os sistemas da empresa, classificar e escalonar seguindo o procedimento, e registrar tudo na ferramenta de tickets.',
    essentialRequirements: [
      'Atendimento a usuários por telefone e chat',
      'Registro e classificação de chamados',
      'Ensino médio completo; curso de TI é diferencial'
    ],
    organizationalContext:
      'Processo de atendimento documentado (certificação CMMI nível 5); trilha de cursos declarada na página de carreiras.',
    criteria: [
      {
        id: 'CRI-801',
        label: 'Atendimento a usuários',
        question:
          'Há registro de atendimento a usuários ou clientes por telefone ou chat?',
        dimension: 'tecnica',
        required: true,
        confirmedBy: 'Descrição da vaga (Empregare)'
      },
      {
        id: 'CRI-802',
        label: 'Registro de chamados',
        question: 'Há registro de uso de ferramenta de chamados ou tickets?',
        dimension: 'tecnica',
        required: true,
        confirmedBy: 'Descrição da vaga (Empregare)'
      },
      {
        id: 'CRI-803',
        label: 'Disponibilidade em escala',
        question: 'A disponibilidade declarada cobre a escala entre 7h e 19h?',
        dimension: 'profissional',
        required: true,
        confirmedBy: 'Descrição da vaga (Empregare)'
      },
      {
        id: 'CRI-804',
        label: 'Procedimento de atendimento',
        question:
          'Há informação sobre como a pessoa lida com roteiro fixo de classificação e escalonamento?',
        dimension: 'organizacional',
        required: false,
        confirmedBy: 'Site da empresa — loglabdigital.com.br'
      }
    ],
    axisWeights: {
      'regras-decisao': 'alto',
      'aprendizado-desenvolvimento': 'alto',
      'orientacao-resultados': 'medio',
      'interacao-convivencia': 'medio'
    },
    axisWeightSuggestions: [
      {
        axisId: 'regras-decisao',
        weight: 'alto',
        excerpt:
          'Classificar e escalonar seguindo o procedimento, e registrar tudo na ferramenta de tickets.',
        sourceLabel: 'Resumo da vaga',
        sourceId: 'FONTE-EMPREGARE'
      }
    ],
    externalRef: {
      system: SYSTEM,
      account: 'Log,Lab Inteligência Digital',
      id: 'EMPG-DEMO-6101'
    },
    updatedAt: '2026-09-17'
  },
  {
    id: 'VAG-09',
    title: 'Assistente de Logística — Matriz',
    companyId: 'EMP-06',
    teamId: 'EQ-06',
    location: 'Cuiabá, MT — Alvorada',
    workShift: 'Horário comercial (7h30 às 17h30)',
    stage: 'em-selecao',
    summary:
      'Conferir documentos de transporte, acompanhar cargas com as transportadoras e registrar as movimentações no sistema, com picos de volume na safra.',
    essentialRequirements: [
      'Conferência de documentos de transporte (CT-e, notas)',
      'Registro em sistema e planilha',
      'Disponibilidade para horas adicionais na safra'
    ],
    organizationalContext:
      'Procedimento escrito para toda movimentação e programa de integridade declarado; na safra os horários são reorganizados (a confirmar).',
    criteria: [
      {
        id: 'CRI-901',
        label: 'Conferência de documentos',
        question:
          'Há registro de conferência de notas ou documentos de transporte?',
        dimension: 'tecnica',
        required: true,
        confirmedBy: 'Descrição da vaga (Empregare)'
      },
      {
        id: 'CRI-902',
        label: 'Registro em sistema',
        question: 'Há registro de lançamentos em sistema ou planilha?',
        dimension: 'tecnica',
        required: true,
        confirmedBy: 'Descrição da vaga (Empregare)'
      },
      {
        id: 'CRI-903',
        label: 'Disponibilidade na safra',
        question:
          'A disponibilidade declarada aceita horas adicionais nos picos da safra?',
        dimension: 'profissional',
        required: true,
        confirmedBy: 'Descrição da vaga (Empregare)'
      },
      {
        id: 'CRI-904',
        label: 'Procedimento e conformidade',
        question:
          'Há informação sobre como a pessoa lida com procedimento escrito para cada movimentação?',
        dimension: 'organizacional',
        required: false,
        confirmedBy: 'Trabalhe na Amaggi — amaggi.com.br'
      }
    ],
    axisWeights: {
      'regras-decisao': 'alto',
      'adaptacao-carreira': 'alto',
      'etica-seguranca': 'medio',
      'execucao-ritmo': 'medio'
    },
    axisWeightSuggestions: [
      {
        axisId: 'adaptacao-carreira',
        weight: 'alto',
        excerpt: 'Disponibilidade para horas adicionais na safra',
        sourceLabel: 'Requisitos essenciais da vaga',
        sourceId: 'FONTE-EMPREGARE'
      }
    ],
    externalRef: { system: SYSTEM, account: 'Amaggi', id: 'EMPG-DEMO-6201' },
    updatedAt: '2026-09-16'
  },
  {
    id: 'VAG-10',
    title: 'Auxiliar de Armazém e Conferência',
    companyId: 'EMP-07',
    teamId: 'EQ-07',
    location: 'Cuiabá, MT — Distrito Industrial',
    workShift: 'Turno da manhã (6h às 14h20)',
    stage: 'aberta',
    summary:
      'Receber e conferir cargas fracionadas, separar por rota e apoiar o carregamento no turno da manhã.',
    essentialRequirements: [
      'Conferência de volumes e romaneios',
      'Separação por rota',
      'Disponibilidade para o turno da manhã'
    ],
    organizationalContext:
      'As cargas chegam juntas no início do turno e quem confere alterna entre docas. O encarregado acompanha a primeira semana (confirmado na ligação).',
    criteria: [
      {
        id: 'CRI-1001',
        label: 'Conferência de volumes',
        question: 'Há registro de conferência de volumes ou romaneios?',
        dimension: 'tecnica',
        required: true,
        confirmedBy: 'Descrição da vaga (Empregare)'
      },
      {
        id: 'CRI-1002',
        label: 'Disponibilidade no turno',
        question: 'A disponibilidade declarada cobre o turno da manhã?',
        dimension: 'profissional',
        required: true,
        confirmedBy: 'Descrição da vaga (Empregare)'
      },
      {
        id: 'CRI-1003',
        label: 'Apoio inicial',
        question: 'O acompanhamento da primeira semana atende à expectativa?',
        dimension: 'organizacional',
        required: false,
        confirmedBy: 'Condição informada na ligação'
      }
    ],
    axisWeights: {
      'execucao-ritmo': 'alto',
      'lideranca-autonomia': 'medio',
      'adaptacao-carreira': 'medio'
    },
    axisWeightSuggestions: [],
    externalRef: {
      system: SYSTEM,
      account: 'Grupo Norte Logística',
      id: 'EMPG-DEMO-6301'
    },
    updatedAt: '2026-09-18'
  },
  {
    // Processo de março, encerrado: é daqui que vem a resposta antiga do
    // candidato da demonstração (3 das 10 frases da Colatte coincidem).
    id: 'VAG-11',
    title: 'Conferente de Carga — turno da noite',
    companyId: 'EMP-07',
    teamId: 'EQ-07',
    location: 'Cuiabá, MT — Distrito Industrial',
    workShift: 'Turno da noite (22h às 6h)',
    stage: 'encerrada',
    summary:
      'Conferência de cargas no recebimento noturno e registro de divergências. Processo de março de 2026, encerrado.',
    essentialRequirements: [
      'Conferência de romaneios',
      'Disponibilidade para o turno da noite'
    ],
    organizationalContext:
      'Processo encerrado em abril de 2026. Fica na base porque é dele que vem a resposta de quem se candidatou em março.',
    criteria: [
      {
        id: 'CRI-1101',
        label: 'Conferência de romaneios',
        question: 'Há registro de conferência de romaneios?',
        dimension: 'tecnica',
        required: true,
        confirmedBy: 'Descrição da vaga (Empregare)'
      },
      {
        id: 'CRI-1102',
        label: 'Disponibilidade à noite',
        question: 'A disponibilidade declarada cobria o turno da noite?',
        dimension: 'profissional',
        required: true,
        confirmedBy: 'Descrição da vaga (Empregare)'
      }
    ],
    axisWeights: { 'execucao-ritmo': 'alto' },
    axisWeightSuggestions: [],
    externalRef: {
      system: SYSTEM,
      account: 'Grupo Norte Logística',
      id: 'EMPG-DEMO-6288'
    },
    updatedAt: '2026-04-08'
  },
  {
    id: 'VAG-12',
    title: 'Auxiliar de Almoxarifado — Matriz',
    companyId: 'EMP-08',
    teamId: 'EQ-08',
    location: 'Cuiabá, MT',
    workShift: 'Horário comercial (7h30 às 17h18)',
    stage: 'aberta',
    summary:
      'Receber materiais, conferir notas, organizar o almoxarifado e atender às áreas internas da matriz.',
    essentialRequirements: [
      'Conferência de notas e materiais',
      'Registro de entradas e saídas em sistema',
      'Disponibilidade em horário comercial'
    ],
    organizationalContext:
      'Sistema interno com procedimento de entrada e saída; demais condições da equipe ainda não informadas.',
    criteria: [
      {
        id: 'CRI-1201',
        label: 'Conferência de materiais',
        question: 'Há registro de conferência de notas ou materiais?',
        dimension: 'tecnica',
        required: true,
        confirmedBy: 'Descrição da vaga (Empregare)'
      },
      {
        id: 'CRI-1202',
        label: 'Registro em sistema',
        question: 'Há registro de lançamentos de entrada e saída em sistema?',
        dimension: 'tecnica',
        required: true,
        confirmedBy: 'Descrição da vaga (Empregare)'
      },
      {
        id: 'CRI-1203',
        label: 'Disponibilidade no horário',
        question: 'A disponibilidade declarada cobre o horário comercial?',
        dimension: 'profissional',
        required: true,
        confirmedBy: 'Descrição da vaga (Empregare)'
      }
    ],
    axisWeights: { 'regras-decisao': 'alto', 'execucao-ritmo': 'medio' },
    axisWeightSuggestions: [],
    externalRef: {
      system: SYSTEM,
      account: 'Bom Futuro',
      id: 'EMPG-DEMO-6401'
    },
    updatedAt: '2026-09-15'
  }
];

/* ------------------------------------------------------------------ *
 * Traçado ilustrativo, tema a tema
 * ------------------------------------------------------------------ */

/**
 * O alvo de cada empresa. `temas` é o valor no sentido do tema (1..5);
 * `itens` fixa a frase marcante de cada tema no valor **da frase** (já
 * espelhado quando o polo é −1). Ver o mapeamento e a fonte de cada valor
 * nos comentários.
 */
type Tracado = {
  equipe: AlvoCultural;
  /** A gestão, quando responde diferente da equipe em algum tema. */
  gestao?: AlvoCultural;
  /** A frase escolhida por tema, para conferência e para a documentação. */
  escolhidas: Record<FitAxisId, string>;
};

/*
 * Colatte (colatte.io). Sentido de cada tema no instrumento: 5 concorda com
 * as frases de polo 1 do tema.
 *
 * - Jeito de entregar 4 — "Nenhuma linha de código antes de entender o
 *   problema" → I05 (reunir informação antes de decidir) = 5.
 * - Mudanças e novidades 2 (adota ferramenta nova, não espera consolidar) —
 *   inferência: empresa que faz "sites, sistemas, automações e produtos
 *   digitais" → I06 = 1.
 * - Aprender coisas novas 4 — inferência de porte: equipe pequena, cada um
 *   passa por várias frentes (sites, automações, consultoria) → I11 = 5.
 * - Pensar em quem recebe 2 (o trabalho depende de interação com o cliente)
 *   — "Ciclos curtos, com você validando cada etapa" → I17 (concentro sem
 *   depender de interações) = 1.
 * - Segurança e respeito 4 — "Ninguém some por três meses pra voltar com
 *   surpresa" → I25 (ajusta a forma quando o ritmo aperta) = 5.
 * - Ritmo do turno 2 (alterna demandas de vários clientes) — inferência de
 *   porte e de serviço → I27 (polo −1, "alterno sem concluir") = 5.
 * - Regras e decisões 2,5 (tenta o jeito novo antes de mapear tudo) —
 *   inferência → I33 = 1.
 * - Convivência 5 — "Sem intermediários: você fala com quem escreve o
 *   código" → I39 (combinados direto) = 5.
 * - Autonomia 4,5 — "feitos por quem você conhece pelo nome" (equipe curta,
 *   cada um toca o seu) → I40 = 5; I41 (quer validação por etapa) = 4,
 *   porque o processo declarado valida cada etapa com o cliente.
 * - Carreira e futuro 3,5 — produtos variados (Crema, Brio, sites) →
 *   I50 (aprender assuntos diferentes) = 5.
 *
 * A gestão (declaração pela tela) difere da equipe num tema: acha que cada
 * um termina uma coisa antes de começar outra (Ritmo 4). É a divergência que
 * a analista vai comentar na demonstração — e é justamente o tema em que o
 * candidato da demonstração difere da equipe.
 */
const COLATTE_EQUIPE: AlvoCultural = {
  temas: {
    'orientacao-resultados': 4,
    inovacao: 2,
    'aprendizado-desenvolvimento': 4,
    'foco-cliente': 2,
    'etica-seguranca': 4,
    'execucao-ritmo': 2,
    'regras-decisao': 2.5,
    'interacao-convivencia': 4.5,
    'lideranca-autonomia': 4.5,
    'adaptacao-carreira': 3.5,
    'expectativas-futuras': 3.5
  },
  itens: {
    I05: 5,
    I06: 1,
    I11: 5,
    I17: 1,
    I20: 2,
    I25: 5,
    I27: 5,
    I33: 1,
    I39: 5,
    I40: 5,
    I41: 4,
    I50: 5
  }
};

const COLATTE: Tracado = {
  equipe: COLATTE_EQUIPE,
  gestao: {
    temas: { ...COLATTE_EQUIPE.temas, 'execucao-ritmo': 4 },
    itens: { ...COLATTE_EQUIPE.itens, I27: 2 }
  },
  escolhidas: {
    'orientacao-resultados': 'I05',
    inovacao: 'I06',
    'aprendizado-desenvolvimento': 'I11',
    'foco-cliente': 'I17',
    'etica-seguranca': 'I25',
    'execucao-ritmo': 'I27',
    'regras-decisao': 'I33',
    'interacao-convivencia': 'I39',
    'lideranca-autonomia': 'I40',
    'adaptacao-carreira': 'I47',
    'expectativas-futuras': 'I50'
  }
};

/*
 * Log,Lab (loglabdigital.com.br e /carreira).
 *
 * - Jeito de entregar 4,5 — CMMI nível 5 é maturidade de processo →
 *   I01 (conferir cada etapa) = 5.
 * - Mudanças e novidades 3,5 — "inovação" é valor declarado, mas processo
 *   certificado é seguir o procedimento antes de improvisar → I10 = 5.
 * - Aprender coisas novas 4,5 — "aprendizado constante", "cursos e
 *   certificações internacionais" → I11 = 5.
 * - Pensar em quem recebe 3 — "parceira dos nossos clientes", transparência
 *   → I18 (considera o contexto de quem recebe) = 5.
 * - Segurança e respeito 4 — "ética e transparência" → I23 (segue sem
 *   confirmar cada etapa) = 1: em processo certificado, confirma.
 * - Ritmo do turno 3,5 — atendimento por tickets, prazo e escalonamento →
 *   I29 (avisar antes de acelerar) = 5.
 * - Regras e decisões 4,5 — CMMI 5 → I31 (entender a regra antes) = 5.
 * - Convivência 3,5 — "cultura colaborativa" → I36 (polo −1, "passo sem
 *   contexto") = 1.
 * - Autonomia 3,5 — inferência: quality gates de processo → I41 (quer saber
 *   se está de acordo antes de seguir) = 5.
 * - Carreira e futuro 3,5 — "promoções internas e progressão de carreira",
 *   certificações → I50 = 5.
 */
const LOGLAB: Tracado = {
  equipe: {
    temas: {
      'orientacao-resultados': 4.5,
      inovacao: 3.5,
      'aprendizado-desenvolvimento': 4.5,
      'foco-cliente': 3,
      'etica-seguranca': 4,
      'execucao-ritmo': 3.5,
      'regras-decisao': 4.5,
      'interacao-convivencia': 3.5,
      'lideranca-autonomia': 3.5,
      'adaptacao-carreira': 3.5,
      'expectativas-futuras': 3.5
    },
    itens: {
      I01: 5,
      I10: 5,
      I11: 5,
      I18: 5,
      I23: 1,
      I29: 5,
      I31: 5,
      I36: 1,
      I41: 5,
      I50: 5
    }
  },
  escolhidas: {
    'orientacao-resultados': 'I01',
    inovacao: 'I10',
    'aprendizado-desenvolvimento': 'I11',
    'foco-cliente': 'I18',
    'etica-seguranca': 'I23',
    'execucao-ritmo': 'I29',
    'regras-decisao': 'I31',
    'interacao-convivencia': 'I36',
    'lideranca-autonomia': 'I41',
    'adaptacao-carreira': 'I47',
    'expectativas-futuras': 'I50'
  }
};

/*
 * Amaggi (amaggi.com.br/trabalhe-na-amaggi e relatórios de sustentabilidade).
 *
 * - Jeito de entregar 4 — "Integridade: ser ético, justo e coerente" →
 *   I02 (comunicar o atraso a entregar fora do procedimento) = 5.
 * - Mudanças e novidades 3,5 — operação de armazém e logística com
 *   procedimento → I07 (formas já testadas) = 5. Inferência de setor.
 * - Aprender coisas novas 3 — "gestão participativa: reconhecimento e
 *   crescimento profissional" → I14 ("não vejo necessidade de buscar novas
 *   responsabilidades") = 1.
 * - Pensar em quem recebe 3 — "Comprometimento: vestir a camisa" → I19
 *   (concluo primeiro o meu) = 1: apoia o colega.
 * - Segurança e respeito 4,5 — segurança é o primeiro item de qualquer
 *   operação agroindustrial (inferência) → I25 = 5.
 * - Ritmo do turno 3 — rotina de armazém → I28 (mantenho ritmo em rotina
 *   que muda pouco) = 5.
 * - Regras e decisões 4 — programa de integridade, "treinamentos com
 *   colaboradores em todas as unidades" → I31 = 5.
 * - Convivência 4 — "Humildade: respeito por todas as pessoas", gestão
 *   participativa → I38 (avalio se posso contribuir) = 5.
 * - Autonomia 3 — "Simplicidade: foco no essencial" (inferência) → I42
 *   (conhecer bem antes de assumir outras) = 5.
 * - Carreira e futuro 4 — safra reorganiza horários (inferência de setor)
 *   → I47 = 5.
 */
const AMAGGI: Tracado = {
  equipe: {
    temas: {
      'orientacao-resultados': 4,
      inovacao: 3.5,
      'aprendizado-desenvolvimento': 3,
      'foco-cliente': 3,
      'etica-seguranca': 4.5,
      'execucao-ritmo': 3,
      'regras-decisao': 4,
      'interacao-convivencia': 4,
      'lideranca-autonomia': 3,
      'adaptacao-carreira': 4,
      'expectativas-futuras': 4
    },
    itens: {
      I02: 5,
      I07: 5,
      I14: 1,
      I19: 1,
      I25: 5,
      I28: 5,
      I31: 5,
      I38: 5,
      I42: 5,
      I47: 5
    }
  },
  escolhidas: {
    'orientacao-resultados': 'I02',
    inovacao: 'I07',
    'aprendizado-desenvolvimento': 'I14',
    'foco-cliente': 'I19',
    'etica-seguranca': 'I25',
    'execucao-ritmo': 'I28',
    'regras-decisao': 'I31',
    'interacao-convivencia': 'I38',
    'lideranca-autonomia': 'I42',
    'adaptacao-carreira': 'I47',
    'expectativas-futuras': 'I49'
  }
};

/*
 * Grupo Norte Logística (gruponortelogistica.com.br).
 *
 * - Jeito de entregar 3,5 — pátio de carga fracionada: várias cargas ao
 *   mesmo tempo (inferência de setor) → I03 (concluir uma antes de outra)
 *   = 1.
 * - Mudanças e novidades 3,5 — "Padrão de Qualidade" → I09 (rotina estável
 *   em tarefas repetitivas) = 5.
 * - Aprender coisas novas 3,5 — "Profissionais Capacitados em Todos os
 *   Setores" → I15 (conduzo sem orientação depois de entender) = 5.
 * - Pensar em quem recebe 3,5 — "Construir Parcerias Duradouras" → I19 = 1
 *   (ajuda o colega antes de fechar o seu).
 * - Segurança e respeito 4 — "Segurança em Ponto de Apoio Estratégico" →
 *   I25 = 5.
 * - Ritmo do turno 1,5 — carga fracionada, redespacho: o turno alterna →
 *   I26 (polo −1, "não paro para conferir de novo") = 5.
 * - Regras e decisões 3,5 — decisão rápida no pátio (inferência) → I32
 *   (polo −1, "decido sem reunir tudo") = 5.
 * - Convivência 4,5 — combinado no rádio e na doca (inferência de setor) →
 *   I39 = 5.
 * - Autonomia 4,5 — cada conferente responde pela própria doca
 *   (inferência) → I40 = 5.
 * - Carreira e futuro 4 — escala e horário mudam com a rota → I47 = 5.
 *
 * Três frases coincidem com as da Colatte de propósito: I25, I39 e I40.
 */
const NORTE: Tracado = {
  equipe: {
    temas: {
      'orientacao-resultados': 3.5,
      inovacao: 3.5,
      'aprendizado-desenvolvimento': 3.5,
      'foco-cliente': 3.5,
      'etica-seguranca': 4,
      'execucao-ritmo': 1.5,
      'regras-decisao': 3.5,
      'interacao-convivencia': 4.5,
      'lideranca-autonomia': 4.5,
      'adaptacao-carreira': 4,
      'expectativas-futuras': 4
    },
    itens: {
      I03: 1,
      I09: 5,
      I15: 5,
      I19: 1,
      I25: 5,
      I26: 5,
      I32: 5,
      I39: 5,
      I40: 5,
      I47: 5
    }
  },
  escolhidas: {
    'orientacao-resultados': 'I03',
    inovacao: 'I09',
    'aprendizado-desenvolvimento': 'I15',
    'foco-cliente': 'I19',
    'etica-seguranca': 'I25',
    'execucao-ritmo': 'I26',
    'regras-decisao': 'I32',
    'interacao-convivencia': 'I39',
    'lideranca-autonomia': 'I40',
    'adaptacao-carreira': 'I47',
    'expectativas-futuras': 'I49'
  }
};

/*
 * Bom Futuro (bomfuturo.com.br/pt-br/sobre e /carreira).
 *
 * - Jeito de entregar 4 — "Comprometimento" → I04 (mesmo ritmo com mais
 *   demanda) = 5.
 * - Mudanças e novidades 2,5 — missão "inovar na produção de commodities"
 *   → I08 (investigar a causa antes de retomar) = 5.
 * - Aprender coisas novas 4 — "Empreendedorismo" → I11 = 5.
 * - Pensar em quem recebe 3 — sem frase pública que sustente; fica no
 *   meio.
 * - Segurança e respeito 4,5 — "Ética", "Sustentabilidade" → I25 = 5.
 * - Ritmo do turno 3,5 — almoxarifado de matriz (inferência) → I28 = 5.
 * - Regras e decisões 4 — "Ética" → I31 = 5.
 * - Convivência 3,5 — "Simplicidade" → I39 = 5.
 * - Autonomia 4 — inferência → I40 = 5.
 * - Carreira e futuro 3,5 — "Prêmio por tempo de empresa" → I45 (a mesma
 *   atividade continua interessante) = 5.
 *
 */
const BOM_FUTURO: Tracado = {
  equipe: {
    temas: {
      'orientacao-resultados': 4,
      inovacao: 2.5,
      'aprendizado-desenvolvimento': 4,
      'foco-cliente': 3,
      'etica-seguranca': 4.5,
      'execucao-ritmo': 3.5,
      'regras-decisao': 4,
      'interacao-convivencia': 3.5,
      'lideranca-autonomia': 4,
      'adaptacao-carreira': 3.5,
      'expectativas-futuras': 3.5
    },
    itens: {
      I04: 5,
      I08: 5,
      I11: 5,
      I25: 5,
      I28: 5,
      I31: 5,
      I39: 5,
      I40: 5,
      I45: 5
    }
  },
  // "Pensar em quem recebe" não tem frase fixada: a eleita (I20) sai do
  // ruído, e é a única que não está sustentada por frase pública.
  escolhidas: {
    'orientacao-resultados': 'I04',
    inovacao: 'I08',
    'aprendizado-desenvolvimento': 'I11',
    'foco-cliente': 'I20',
    'etica-seguranca': 'I25',
    'execucao-ritmo': 'I28',
    'regras-decisao': 'I31',
    'interacao-convivencia': 'I39',
    'lideranca-autonomia': 'I40',
    'adaptacao-carreira': 'I45',
    'expectativas-futuras': 'I49'
  }
};

/**
 * As competências que cada empresa real pediu no questionário (R11).
 *
 * A Colatte é a empresa que exercita o pedido do IEL: **8 das 11**. É uma
 * casa de software de equipe curta, e as três que ela não pede são as que o
 * próprio traçado público não sustenta:
 *
 * - **Regras, métodos e decisão** — não há manual de procedimento para
 *   medir aderência a ele; o que existe é combinado conversado, e isso já é
 *   Interação social e convivência. (O valor 2,5 do traçado era inferência
 *   nossa, sem frase pública por trás.)
 * - **Adaptação a mudanças e carreira** — único tema da Colatte sem frase
 *   marcante escolhida à mão, porque o site não diz nada sobre horário
 *   flexível nem mudança de método.
 * - **Expectativas futuras** — cinco pessoas não têm trilha de carreira a
 *   oferecer; perguntar onde a pessoa se vê em três anos e medir a distância
 *   seria cobrar um alinhamento que a empresa não tem como honrar.
 *
 * O que ela mantém é o que ela publica sobre si: ciclos curtos com o cliente
 * validando (Foco no cliente), "sem intermediários" (Interação),
 * "feitos por quem você conhece pelo nome" (Liderança e autonomia),
 * "ninguém some por três meses" (Ética, segurança e respeito).
 *
 * As demais empresas pedem as 11 — por isso não aparecem aqui: ausência na
 * chave é "as 11" (`competenciasDaEmpresa`).
 */
export const COMPETENCIAS_REAIS: Record<string, FitAxisId[]> = {
  'EMP-04': [
    'orientacao-resultados',
    'inovacao',
    'aprendizado-desenvolvimento',
    'foco-cliente',
    'etica-seguranca',
    'execucao-ritmo',
    'interacao-convivencia',
    'lideranca-autonomia'
  ]
};

export const TRACADO_REAL: Record<string, Tracado> = {
  'EMP-04': COLATTE,
  'EMP-05': LOGLAB,
  'EMP-06': AMAGGI,
  'EMP-07': NORTE,
  'EMP-08': BOM_FUTURO
};

/** As frases que cada empresa real deve eleger para o candidato. */
export const FRASES_ESCOLHIDAS_REAIS: Record<
  string,
  Record<FitAxisId, string>
> = Object.fromEntries(
  Object.entries(TRACADO_REAL).map(([id, tracado]) => [id, tracado.escolhidas])
);

/* ------------------------------------------------------------------ *
 * Convites
 * ------------------------------------------------------------------ */

type InviteSeed = {
  id: string;
  companyId: string;
  corporateEmail: string;
  role: CultureInviteRole;
  area: string;
  sentAt: string;
  answeredAt: string | null;
};

function buildInvite(seed: InviteSeed): CultureRespondentInvite {
  return {
    id: seed.id,
    companyId: seed.companyId,
    corporateEmail: seed.corporateEmail,
    role: seed.role,
    area: seed.area,
    token: buildInviteToken(seed.id, CULTURE_INVITE_TOKEN_SEED),
    sentAt: seed.sentAt,
    expiresAt: addDays(seed.sentAt, CULTURE_INVITE_DEADLINE_DAYS),
    answeredAt: seed.answeredAt,
    consentVersion: seed.answeredAt ? CULTURE_CONSENT_VERSION : null,
    resendCount: 0
  };
}

/**
 * Uma amostra de equipe: `n` convites numerados a partir de `inicio`, com os
 * `respondidos` primeiros respondidos. O e-mail é `colaborador-NN@<domínio
 * example.com>`: não existe endereço real na base.
 */
function amostra(params: {
  companyId: string;
  numero: string;
  dominio: string;
  area: string;
  inicio: number;
  n: number;
  respondidos: number;
  sentAt: string;
  answeredAt: string;
}): InviteSeed[] {
  return Array.from({ length: params.n }, (_, i) => {
    const ordem = params.inicio + i;
    return {
      id: `INV-EMP${params.numero}-${String(ordem).padStart(2, '0')}`,
      companyId: params.companyId,
      corporateEmail: `colaborador-${String(ordem).padStart(2, '0')}@${params.dominio}.example.com`,
      role: 'equipe' as const,
      area: params.area,
      sentAt: params.sentAt,
      answeredAt: i < params.respondidos ? params.answeredAt : null
    };
  });
}

const INVITE_SEEDS: InviteSeed[] = [
  // Colatte: consulta fechada — 10 de 10 da primeira leva responderam; um
  // convite a mais saiu no dia 13 e ainda está no prazo (é o "cobrar 1 que
  // falta" da tela, sem deixar tema em aberto). A gestão declarou pela tela
  // (sem convite).
  ...amostra({
    companyId: 'EMP-04',
    numero: '04',
    dominio: 'colatte',
    area: 'Desenvolvimento e suporte',
    inicio: 1,
    n: 10,
    respondidos: 10,
    sentAt: '2026-09-14',
    answeredAt: '2026-09-16'
  }),
  {
    id: 'INV-EMP04-11',
    companyId: 'EMP-04',
    corporateEmail: 'colaborador-11@colatte.example.com',
    role: 'equipe',
    area: 'Desenvolvimento e suporte',
    sentAt: '2026-09-19',
    answeredAt: null
  },

  // Log,Lab: gestão e RH por convite, mais 11 de 11 da equipe.
  {
    id: 'INV-EMP05-01',
    companyId: 'EMP-05',
    corporateEmail: 'gestao-servicedesk@loglab.example.com',
    role: 'gestao',
    area: 'Service desk',
    sentAt: '2026-09-09',
    answeredAt: '2026-09-10'
  },
  {
    id: 'INV-EMP05-02',
    companyId: 'EMP-05',
    corporateEmail: 'gente@loglab.example.com',
    role: 'rh',
    area: 'Gente e cultura',
    sentAt: '2026-09-09',
    answeredAt: '2026-09-10'
  },
  ...amostra({
    companyId: 'EMP-05',
    numero: '05',
    dominio: 'loglab',
    area: 'Service desk',
    inicio: 3,
    n: 11,
    respondidos: 11,
    sentAt: '2026-09-10',
    answeredAt: '2026-09-12'
  }),

  // Amaggi: 12 de 12 da equipe.
  ...amostra({
    companyId: 'EMP-06',
    numero: '06',
    dominio: 'amaggi',
    area: 'Logística — matriz',
    inicio: 1,
    n: 12,
    respondidos: 12,
    sentAt: '2026-09-08',
    answeredAt: '2026-09-10'
  }),

  // Norte Logística: perfil fechado há meses (a vaga de março já usou
  // estas frases) e renovado em agosto; 11 de 11.
  ...amostra({
    companyId: 'EMP-07',
    numero: '07',
    dominio: 'gruponorte',
    area: 'Armazém',
    inicio: 1,
    n: 11,
    respondidos: 11,
    sentAt: '2026-08-30',
    answeredAt: '2026-09-01'
  }),

  // Bom Futuro: 10 de 10.
  ...amostra({
    companyId: 'EMP-08',
    numero: '08',
    dominio: 'bomfuturo',
    area: 'Almoxarifado',
    inicio: 1,
    n: 10,
    respondidos: 10,
    sentAt: '2026-09-15',
    answeredAt: '2026-09-17'
  })
];

export const CONVITES_REAIS: CultureRespondentInvite[] =
  INVITE_SEEDS.map(buildInvite);

/* ------------------------------------------------------------------ *
 * Respostas
 * ------------------------------------------------------------------ */

/**
 * Empresas em que a gestão respondeu pela tela, como declaração, em todos os
 * temas. Sem `inviteId`: quem confirma pela tela fala em nome da empresa.
 */
const GESTAO_DECLARA: Record<string, string> = {
  'EMP-04': '2026-09-15',
  'EMP-06': '2026-09-09',
  'EMP-07': '2026-08-31',
  'EMP-08': '2026-09-16'
};

/** Ruído menor na frase marcante: é o que a torna marcante. */
const ESPALHAMENTO_MARCANTE = 0.3;

function responder(
  item: ItemDoInstrumento,
  alvo: AlvoCultural,
  random: () => number
): ValorDaEscala {
  const marcante = alvo.itens?.[item.id] !== undefined;
  return responderFrase(
    item,
    alvo,
    random,
    marcante ? ESPALHAMENTO_MARCANTE : 0.9
  );
}

function construirRespostas(): CultureAnswer[] {
  const random = createRandom(SEED_EMPRESAS_REAIS);
  const respostas: CultureAnswer[] = [];

  for (const convite of CONVITES_REAIS) {
    if (!convite.answeredAt) continue;
    const tracado = TRACADO_REAL[convite.companyId];
    if (!tracado) continue;
    const alvo =
      convite.role === 'equipe'
        ? tracado.equipe
        : (tracado.gestao ?? tracado.equipe);
    // O bloco da semente é o inteiro, de propósito, mesmo onde a empresa
    // hoje pede menos competências: a consulta da Colatte foi respondida em
    // setembro, quando ela ainda media as 11, e a escolha de 8 veio depois.
    // É o que o produto promete — resposta de tema retirado continua
    // guardada e volta a contar se a empresa reincluir o tema —, e é o que
    // deixa a demonstração poder reincluir um tema ao vivo e ver o número
    // mudar. Quem abre o link **agora** recebe o bloco já filtrado
    // (`getInviteByToken`).
    for (const item of blocoDoConvite(convite)) {
      respostas.push({
        id: `CUL-${convite.id}-${item.id}`,
        companyId: convite.companyId,
        itemId: item.id,
        value: responder(item, alvo, random),
        respondent: convite.role,
        count: 1,
        answeredAt: convite.answeredAt,
        // A promessa de anonimato viaja com a resposta: é isto que faz o
        // piso valer (`MIN_RESPOSTAS_ANONIMAS`).
        inviteId: convite.id
      });
    }
  }

  for (const [companyId, answeredAt] of Object.entries(GESTAO_DECLARA)) {
    const tracado = TRACADO_REAL[companyId];
    if (!tracado) continue;
    const alvo = tracado.gestao ?? tracado.equipe;
    for (const tema of Object.keys(tracado.escolhidas) as FitAxisId[]) {
      for (const item of itensDoTema(tema)) {
        respostas.push({
          id: `CUL-${companyId}-gestao-${item.id}`,
          companyId,
          itemId: item.id,
          value: responderFrase(item, alvo, random, 0),
          respondent: 'gestao',
          count: 1,
          answeredAt
        });
      }
    }
  }

  return respostas;
}

export const RESPOSTAS_CULTURA_REAIS: CultureAnswer[] = construirRespostas();
