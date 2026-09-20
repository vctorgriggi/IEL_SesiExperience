import { CANDIDATE_CONSENT_VERSION } from '../analysis/candidate-questionnaire';
import {
  calcularPerfilCultural,
  escolherPerguntasDoCandidato
} from '../analysis/culture';
import { FIT_AXES, type FitAxisId } from '../analysis/fit-axes';
import type { ValorDaEscala } from '../analysis/instrumento';
import type {
  AnalysisByApplication,
  Application,
  CandidateFitResponse,
  CriterionAnalysis,
  CriterionState,
  Evidence,
  ExternalStage,
  Talent,
  TalentCultureAnswer,
  TalentPreference
} from '../types';
import { RESPOSTAS_CULTURA_REAIS, VAGAS_REAIS } from './empresas-reais';
import {
  createRandom,
  responderQuestionario,
  type AlvoCultural
} from './respostas-sinteticas';

/**
 * Candidatos fictícios das vagas das empresas reais (`empresas-reais.ts`).
 *
 * **Todas as pessoas aqui são inventadas.** Nomes plausíveis de Mato Grosso,
 * empregadores anteriores marcados "(fictícia)", e-mails em `example.com`.
 * Nenhum nome, currículo ou avaliação de pessoa real entrou.
 *
 * ## O candidato da demonstração: Jonas Curvo Dorileo (`TAL-JONAS`)
 *
 * Conferente de carga numa transportadora de Cuiabá por três anos, antes
 * disso atendente numa assistência técnica de celulares. Fez o curso técnico
 * em informática à noite, terminou em julho, e quer mudar de setor: sair do
 * pátio e ir para onde o software é feito. O currículo combina com a vaga da
 * Colatte quase ponto a ponto (match técnico 91): atendimento com registro
 * de chamados, teste seguindo checklist, planilha, curso técnico.
 *
 * O que ele declarou sobre como prefere trabalhar combina com a equipe da
 * Colatte em 9 dos 11 temas. Difere em **Execução e ritmo de trabalho** — no pátio ele
 * aprendeu que quem alterna erra, e prefere fechar uma conferência antes de
 * abrir outra; na Colatte um chamado interrompe o teste em andamento — e,
 * mais de leve, em **Regras, métodos e decisão**: antes de mudar um procedimento ele
 * quer entender por que ele existe, enquanto a equipe tenta o jeito novo
 * primeiro. É a divergência que a analista comenta: a gestão da Colatte
 * também acha que se faz uma coisa de cada vez, e a equipe diz que não.
 *
 * **Ele ainda não respondeu o questionário.** A demonstração ao vivo é ele
 * responder no celular (`/candidatura/CAND-21/fit`) e aparecer na mesa. A
 * candidatura dele é a primeira da lista (`state.applications[0]`), que é a
 * que o atalho "Ver como o candidato vê" abre.
 *
 * Ele tem uma candidatura antiga: **Conferente de Carga na Norte Logística**
 * (`CAND-40`, março de 2026), em que respondeu as 10 frases daquela empresa
 * sob o aceite vigente. Três delas (I25, I39, I40) são as mesmas que a
 * Colatte pergunta, então a abertura do questionário diz "3 de 11 você já
 * respondeu" — a cena do reaproveitamento parcial, com ele.
 *
 * **Kauã Pedroso Arruda (`TAL-KAUA`)** é o "gêmeo": mesma história, mesmo
 * jeito de trabalhar, e já respondeu — para a mesa ter aderência antes de a
 * demonstração começar.
 *
 * Determinístico como o resto: as respostas saem de gerador semeado, as
 * datas são fixas.
 */

const SYSTEM = 'Empregare';
const SEED_CANDIDATOS_REAIS = 20260927;

type Jeito = Record<FitAxisId, number>;

/* ------------------------------------------------------------------ *
 * Jeitos de trabalhar
 * ------------------------------------------------------------------ */

/** Jonas: combina com a Colatte em 8 temas; difere em Ritmo e em Regras. */
const JONAS: Jeito = {
  'orientacao-resultados': 4,
  inovacao: 2,
  'aprendizado-desenvolvimento': 4.5,
  'foco-cliente': 2,
  'etica-seguranca': 4,
  'execucao-ritmo': 4,
  'regras-decisao': 4,
  'interacao-convivencia': 4.5,
  'lideranca-autonomia': 4.5,
  'adaptacao-carreira': 4,
  'expectativas-futuras': 4
};

/** Kauã: o gêmeo — igual, com o ritmo um pouco menos marcado. */
const KAUA: Jeito = { ...JONAS, 'execucao-ritmo': 3.5 };

/** Perto da equipe da Colatte em tudo. */
const COMO_A_COLATTE: Jeito = {
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
};

/** O oposto da Colatte: procedimento, uma coisa de cada vez, acompanhamento. */
const OPOSTO_DA_COLATTE: Jeito = {
  'orientacao-resultados': 4,
  inovacao: 5,
  'aprendizado-desenvolvimento': 2,
  'foco-cliente': 5,
  'etica-seguranca': 3,
  'execucao-ritmo': 5,
  'regras-decisao': 5,
  'interacao-convivencia': 2,
  'lideranca-autonomia': 1.5,
  'adaptacao-carreira': 2.5,
  'expectativas-futuras': 2.5
};

/** Procedimento e acompanhamento: combina com Log,Lab e Amaggi. */
const DE_PROCEDIMENTO: Jeito = {
  'orientacao-resultados': 4.5,
  inovacao: 4,
  'aprendizado-desenvolvimento': 4,
  'foco-cliente': 3.5,
  'etica-seguranca': 4,
  'execucao-ritmo': 4,
  'regras-decisao': 4.5,
  'interacao-convivencia': 3.5,
  'lideranca-autonomia': 3,
  'adaptacao-carreira': 4,
  'expectativas-futuras': 4
};

/** Pátio: alterna demandas, decide rápido, combina direto. */
const DE_PATIO: Jeito = {
  'orientacao-resultados': 3,
  inovacao: 3.5,
  'aprendizado-desenvolvimento': 3.5,
  'foco-cliente': 3,
  'etica-seguranca': 4,
  'execucao-ritmo': 1.5,
  'regras-decisao': 2.5,
  'interacao-convivencia': 4.5,
  'lideranca-autonomia': 4.5,
  'adaptacao-carreira': 4.5,
  'expectativas-futuras': 4.5
};

/** No meio da escala em tudo: não puxa para lado nenhum. */
const NEUTRO: Jeito = Object.fromEntries(
  FIT_AXES.map((axis) => [axis.id, 3])
) as Jeito;

/* ------------------------------------------------------------------ *
 * Pessoas
 * ------------------------------------------------------------------ */

type PreferenciaSeed = {
  axisId: FitAxisId;
  value: string;
  origin?: 'iel' | 'curriculo';
  updatedAt: string;
};

type TalentoSeed = {
  id: string;
  name: string;
  headline: string;
  summary: string;
  city?: string;
  experiences: {
    role: string;
    organization: string;
    period: string;
    activities: string;
  }[];
  skills: string[];
  expectations: string[];
  preferencias?: PreferenciaSeed[];
  account: string;
  externalId: string;
};

const ORIGEM_IEL = 'Registro IEL — expectativa coletada em atendimento';
const ORIGEM_CURRICULO = 'Currículo — informação declarada na inscrição';

function emailDe(name: string): string {
  return `${name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z ]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join('.')}@example.com`;
}

function talento(seed: TalentoSeed): Talent {
  const preferences: TalentPreference[] = (seed.preferencias ?? []).map(
    (pref, index) => ({
      id: `PREF-${seed.id}-${String(index + 1).padStart(2, '0')}`,
      axisId: pref.axisId,
      value: pref.value,
      origin: pref.origin === 'curriculo' ? ORIGEM_CURRICULO : ORIGEM_IEL,
      sourceId: pref.origin === 'curriculo' ? 'FONTE-EMPREGARE' : 'FONTE-IEL',
      updatedAt: pref.updatedAt
    })
  );
  return {
    id: seed.id,
    name: seed.name,
    headline: seed.headline,
    summary: seed.summary,
    city: seed.city ?? 'Cuiabá, MT',
    email: emailDe(seed.name),
    experiences: seed.experiences.map((exp, index) => ({
      id: `EXP-${seed.id}-${String(index + 1).padStart(2, '0')}`,
      ...exp
    })),
    declaredSkills: seed.skills,
    expectations: seed.expectations,
    preferences,
    externalRefs: [
      { system: SYSTEM, account: seed.account, id: seed.externalId }
    ]
  };
}

const CURADOS: TalentoSeed[] = [
  {
    id: 'TAL-JONAS',
    name: 'Jonas Curvo Dorileo',
    headline: 'Conferente de carga que fez técnico em informática',
    summary:
      'Três anos conferindo carga numa transportadora de Cuiabá, antes disso atendente de assistência técnica. Concluiu o técnico em informática em julho de 2026 e quer mudar de setor: sair do pátio e ir para onde o software é feito.',
    experiences: [
      {
        role: 'Conferente de carga',
        organization: 'Transportadora Rio Cuiabá',
        period: 'ago/2023 — jun/2026',
        activities:
          'Conferia romaneios no recebimento, registrava divergências no sistema da transportadora, abria ocorrências e atendia motoristas na doca.'
      },
      {
        role: 'Atendente de assistência técnica',
        organization: 'Assistência Techcell',
        period: 'jan/2022 — jul/2023',
        activities:
          'Registrava chamados de reparo, testava os aparelhos depois do conserto seguindo checklist e explicava o resultado ao cliente.'
      }
    ],
    skills: [
      'Registro de chamados',
      'Teste seguindo checklist',
      'Planilha de ocorrências',
      'Atendimento ao cliente',
      'Técnico em informática (concluído jul/2026)'
    ],
    expectations: [
      'Mudar para a área de tecnologia',
      'Aprender com quem programa',
      'Horário comercial'
    ],
    preferencias: [
      {
        axisId: 'execucao-ritmo',
        value:
          'Prefere fechar uma conferência antes de abrir outra: "no pátio, quem alterna erra".',
        updatedAt: '2026-09-17'
      },
      {
        axisId: 'lideranca-autonomia',
        value:
          'Depois de entender o serviço, prefere tocar sozinho e mostrar o resultado.',
        updatedAt: '2026-09-17'
      },
      {
        axisId: 'interacao-convivencia',
        value: 'Prefere combinar as coisas direto com a pessoa, sem recado.',
        updatedAt: '2026-09-17'
      },
      {
        axisId: 'regras-decisao',
        value:
          'Antes de mudar um procedimento, quer entender por que ele existe.',
        updatedAt: '2026-09-17'
      },
      {
        axisId: 'aprendizado-desenvolvimento',
        value: 'Quer conhecer o processo inteiro, não só a parte dele.',
        origin: 'curriculo',
        updatedAt: '2026-09-19'
      }
    ],
    account: 'Colatte',
    externalId: 'EMPG-DEMO-CAND-6001'
  },
  {
    id: 'TAL-KAUA',
    name: 'Kauã Pedroso Arruda',
    headline: 'Auxiliar de expedição em transição para suporte',
    summary:
      'Dois anos e meio na expedição de uma distribuidora de Várzea Grande, com registro em sistema e atendimento a transportadoras. Terminou o técnico em informática no mesmo período que Jonas e se candidatou à mesma vaga.',
    city: 'Várzea Grande, MT',
    experiences: [
      {
        role: 'Auxiliar de expedição',
        organization: 'Distribuidora Vale do Coxipó',
        period: 'fev/2024 — ago/2026',
        activities:
          'Conferia pedidos separados, lançava saídas no sistema, atendia transportadoras no balcão e registrava as ocorrências do dia.'
      },
      {
        role: 'Estagiário de suporte',
        organization: 'Escola técnica',
        period: 'mar/2026 — jul/2026',
        activities:
          'Atendia chamados do laboratório de informática e testava as máquinas seguindo roteiro.'
      }
    ],
    skills: [
      'Registro em sistema',
      'Atendimento a transportadoras',
      'Teste com roteiro',
      'Técnico em informática (concluído jul/2026)'
    ],
    expectations: ['Trabalhar com software', 'Aprender no dia a dia'],
    preferencias: [
      {
        axisId: 'lideranca-autonomia',
        value: 'Prefere se organizar sozinho depois de entender o objetivo.',
        updatedAt: '2026-09-15'
      },
      {
        axisId: 'execucao-ritmo',
        value: 'Prefere terminar uma tarefa antes de começar outra.',
        updatedAt: '2026-09-15'
      }
    ],
    account: 'Colatte',
    externalId: 'EMPG-DEMO-CAND-6002'
  },
  {
    id: 'TAL-THAIS',
    name: 'Thaís Metelo Figueiredo',
    headline: 'Suporte a sistemas de gestão para lojas',
    summary:
      'Dois anos no suporte de um sistema de gestão para lojas, com atendimento por chat e testes de versão. Procura empresa menor, onde fale direto com quem desenvolve.',
    experiences: [
      {
        role: 'Assistente de suporte',
        organization: 'Softloja Sistemas',
        period: 'mai/2024 — ago/2026',
        activities:
          'Atendia clientes por chat e telefone, registrava chamados, testava as versões novas antes da liberação e escrevia o passo a passo para o cliente.'
      }
    ],
    skills: [
      'Atendimento por chat',
      'Testes de versão',
      'Registro de chamados',
      'Documentação para o cliente'
    ],
    expectations: ['Equipe menor', 'Falar direto com quem desenvolve'],
    preferencias: [
      {
        axisId: 'interacao-convivencia',
        value: 'Prefere resolver direto com quem desenvolve.',
        updatedAt: '2026-09-14'
      }
    ],
    account: 'Colatte',
    externalId: 'EMPG-DEMO-CAND-6003'
  },
  {
    id: 'TAL-WESLEY',
    name: 'Wesley da Guia Proença',
    headline: 'Atendimento em loja de informática',
    summary:
      'Atendente de loja de informática por três anos; monta e configura computadores para clientes. Respondeu o questionário no prazo.',
    experiences: [
      {
        role: 'Atendente',
        organization: 'Infocenter Cuiabá',
        period: 'jun/2023 — ago/2026',
        activities:
          'Atendia clientes no balcão, configurava computadores e registrava as vendas e assistências no sistema da loja.'
      }
    ],
    skills: ['Atendimento ao cliente', 'Configuração de computadores'],
    expectations: ['Primeira oportunidade em empresa de software'],
    account: 'Colatte',
    externalId: 'EMPG-DEMO-CAND-6004'
  },
  {
    id: 'TAL-ANABEATRIZ',
    name: 'Ana Beatriz Pinho e Silva',
    headline: 'Analista de testes em fábrica de software',
    summary:
      'Testadora numa fábrica de software com processo formal: casos de teste escritos, aprovação por etapa e fila de uma tarefa por vez. Match técnico alto; o jeito de trabalhar é o oposto da equipe da Colatte.',
    experiences: [
      {
        role: 'Analista de testes júnior',
        organization: 'Fábrica Sul Digital',
        period: 'jan/2024 — set/2026',
        activities:
          'Executava casos de teste escritos, registrava defeitos na ferramenta e aguardava aprovação do líder antes de passar à próxima tarefa.'
      }
    ],
    skills: [
      'Casos de teste',
      'Registro de defeitos',
      'Ferramenta de chamados',
      'Planilha'
    ],
    expectations: ['Processo definido', 'Uma tarefa de cada vez'],
    preferencias: [
      {
        axisId: 'regras-decisao',
        value: 'Prefere procedimento escrito e aprovação antes de mudar.',
        updatedAt: '2026-09-13'
      },
      {
        axisId: 'lideranca-autonomia',
        value: 'Prefere que alguém valide cada etapa antes de seguir.',
        updatedAt: '2026-09-13'
      }
    ],
    account: 'Colatte',
    externalId: 'EMPG-DEMO-CAND-6005'
  },
  {
    id: 'TAL-RUAN',
    name: 'Ruan Botelho Cintra',
    headline: 'Recepção e atendimento em clínica',
    summary:
      'Recepcionista de clínica por dois anos, sem curso na área. Match técnico baixo; o jeito de trabalhar combina com a Colatte — é o caso de resgate da aba.',
    experiences: [
      {
        role: 'Recepcionista',
        organization: 'Clínica Bela Vista',
        period: 'ago/2024 — ago/2026',
        activities:
          'Atendia pacientes, agendava consultas no sistema e resolvia pendências direto com os médicos.'
      }
    ],
    skills: ['Atendimento ao público', 'Agenda em sistema'],
    expectations: ['Mudar de área', 'Aprender fazendo'],
    preferencias: [
      {
        axisId: 'interacao-convivencia',
        value: 'Resolve as coisas direto com a pessoa.',
        updatedAt: '2026-09-16'
      }
    ],
    account: 'Colatte',
    externalId: 'EMPG-DEMO-CAND-6006'
  },

  // --- Colatte, Auxiliar Administrativo e Financeiro (VAG-07) ---
  {
    id: 'TAL-LARISSA',
    name: 'Larissa Amorim Leite',
    headline: 'Financeiro de escritório de contabilidade',
    summary:
      'Auxiliar financeira em escritório de contabilidade, com emissão de notas e conciliação em planilha.',
    experiences: [
      {
        role: 'Auxiliar financeira',
        organization: 'Contábil Chapada',
        period: 'mar/2023 — ago/2026',
        activities:
          'Emitia notas de serviço para os clientes do escritório, controlava recebimentos em planilha e organizava os contratos.'
      }
    ],
    skills: ['Emissão de NFS-e', 'Contas a receber', 'Planilha'],
    expectations: ['Empresa menor', 'Rotina variada'],
    account: 'Colatte',
    externalId: 'EMPG-DEMO-CAND-6007'
  },
  {
    id: 'TAL-DIEGOP',
    name: 'Diego Fontes Padilha',
    headline: 'Apoio administrativo em construtora',
    summary:
      'Apoio administrativo em construtora, com organização de documentos e apoio ao financeiro.',
    experiences: [
      {
        role: 'Auxiliar administrativo',
        organization: 'Construtora Coxipó',
        period: 'out/2024 — set/2026',
        activities:
          'Organizava documentos de obra, lançava notas no sistema e apoiava o fechamento mensal.'
      }
    ],
    skills: ['Organização de documentos', 'Lançamento de notas'],
    expectations: ['Crescer no financeiro'],
    account: 'Colatte',
    externalId: 'EMPG-DEMO-CAND-6008'
  },
  {
    id: 'TAL-MADU',
    name: 'Maria Eduarda Correa Rondon',
    headline: 'Atendimento e caixa em comércio',
    summary:
      'Caixa e atendimento em loja de materiais, com fechamento diário e emissão de notas.',
    experiences: [
      {
        role: 'Operadora de caixa',
        organization: 'Materiais Pantanal',
        period: 'jan/2024 — ago/2026',
        activities:
          'Fechamento diário do caixa, emissão de notas e atendimento ao cliente.'
      }
    ],
    skills: ['Fechamento de caixa', 'Emissão de notas'],
    expectations: ['Sair do varejo', 'Horário comercial'],
    account: 'Colatte',
    externalId: 'EMPG-DEMO-CAND-6009'
  },

  // --- Log,Lab, Analista de Suporte Júnior (VAG-08) ---
  {
    id: 'TAL-VITORIA',
    name: 'Vitória Campos Salgado',
    headline: 'Atendimento em central de telefonia',
    summary:
      'Dois anos numa central de atendimento de operadora, com script, registro de protocolo e escalonamento por nível.',
    experiences: [
      {
        role: 'Atendente de call center',
        organization: 'Central Conecta',
        period: 'jul/2024 — ago/2026',
        activities:
          'Atendia clientes seguindo script, registrava protocolos e escalonava para o segundo nível conforme o procedimento.'
      }
    ],
    skills: [
      'Atendimento por telefone',
      'Registro de protocolo',
      'Escalonamento'
    ],
    expectations: ['Trabalhar com sistemas', 'Fazer cursos'],
    preferencias: [
      {
        axisId: 'regras-decisao',
        value: 'Gosta de roteiro claro para cada tipo de chamado.',
        updatedAt: '2026-09-12'
      }
    ],
    account: 'Log,Lab Inteligência Digital',
    externalId: 'EMPG-DEMO-CAND-6101'
  },
  {
    id: 'TAL-HENRIQUE',
    name: 'Henrique Sá Barreto',
    headline: 'Suporte de informática em escola',
    summary:
      'Técnico de informática numa rede de escolas, atendendo chamados de professores e mantendo os laboratórios.',
    experiences: [
      {
        role: 'Técnico de informática',
        organization: 'Rede Escolar Aurora',
        period: 'fev/2023 — jul/2026',
        activities:
          'Atendia chamados de professores, mantinha os laboratórios e registrava os atendimentos em planilha.'
      }
    ],
    skills: ['Suporte a usuários', 'Manutenção de computadores', 'Planilha'],
    expectations: ['Empresa maior', 'Plano de carreira'],
    account: 'Log,Lab Inteligência Digital',
    externalId: 'EMPG-DEMO-CAND-6102'
  },
  {
    id: 'TAL-PAMELA',
    name: 'Pâmela Souza Lino',
    headline: 'Recepção de unidade de saúde',
    summary:
      'Recepcionista de UBS, usuária diária de sistema de prontuário; conhece o lado de quem abre o chamado.',
    experiences: [
      {
        role: 'Recepcionista',
        organization: 'Unidade básica de saúde',
        period: 'mai/2023 — ago/2026',
        activities:
          'Atendia pacientes, agendava consultas no sistema e abria chamados quando o sistema falhava.'
      }
    ],
    skills: ['Atendimento ao público', 'Sistema de agendamento'],
    expectations: ['Trabalhar com tecnologia', 'Horário fixo'],
    account: 'Log,Lab Inteligência Digital',
    externalId: 'EMPG-DEMO-CAND-6103'
  },
  {
    id: 'TAL-GUSTAVO',
    name: 'Gustavo Nunes Portela',
    headline: 'Estudante de análise de sistemas',
    summary:
      'Estudante de análise de sistemas com estágio em help desk. Ainda não respondeu o questionário.',
    experiences: [
      {
        role: 'Estagiário de help desk',
        organization: 'Cooperativa Serra',
        period: 'fev/2026 — ago/2026',
        activities:
          'Atendia chamados internos e registrava tudo na ferramenta de tickets.'
      }
    ],
    skills: ['Ferramenta de tickets', 'Atendimento interno'],
    expectations: ['Primeiro emprego na área'],
    account: 'Log,Lab Inteligência Digital',
    externalId: 'EMPG-DEMO-CAND-6104'
  },

  // --- Amaggi, Assistente de Logística (VAG-09) ---
  {
    id: 'TAL-RAFAELS',
    name: 'Rafael Serra Bastos',
    headline: 'Conferência de documentos de transporte',
    summary:
      'Auxiliar de expedição em cooperativa de grãos: conferia CT-e e notas, acompanhava carregamento e registrava no sistema.',
    city: 'Várzea Grande, MT',
    experiences: [
      {
        role: 'Auxiliar de expedição',
        organization: 'Cooperativa Grãos do Norte',
        period: 'mar/2023 — ago/2026',
        activities:
          'Conferia CT-e e notas de saída, acompanhava o carregamento e registrava as cargas no sistema, com horas extras na safra.'
      }
    ],
    skills: ['Conferência de CT-e', 'Registro em sistema', 'Safra'],
    expectations: ['Empresa grande', 'Crescer na logística'],
    preferencias: [
      {
        axisId: 'adaptacao-carreira',
        value: 'Não se importa de reorganizar o horário na safra.',
        origin: 'curriculo',
        updatedAt: '2026-09-11'
      }
    ],
    account: 'Amaggi',
    externalId: 'EMPG-DEMO-CAND-6201'
  },
  {
    id: 'TAL-INGRID',
    name: 'Ingrid Moura Cabral',
    headline: 'Apoio administrativo em transportadora',
    summary:
      'Assistente administrativa de transportadora, com emissão de CT-e e controle de frete em planilha.',
    experiences: [
      {
        role: 'Assistente administrativa',
        organization: 'Transportes Chapada Real',
        period: 'jan/2024 — ago/2026',
        activities:
          'Emitia CT-e, controlava fretes em planilha e atendia motoristas e clientes.'
      }
    ],
    skills: ['Emissão de CT-e', 'Planilha de fretes'],
    expectations: ['Horário fixo', 'Estabilidade'],
    account: 'Amaggi',
    externalId: 'EMPG-DEMO-CAND-6202'
  },
  {
    id: 'TAL-ELIAS',
    name: 'Elias Mendonça Faria',
    headline: 'Operação de armazém de grãos',
    summary:
      'Operador de armazém graneleiro; conhece a rotina da safra e o registro de cargas.',
    city: 'Rondonópolis, MT',
    experiences: [
      {
        role: 'Auxiliar de armazém',
        organization: 'Armazéns Vale do Guaporé',
        period: 'ago/2022 — jul/2026',
        activities:
          'Recebia e pesava cargas, registrava no sistema e organizava a fila de caminhões na safra.'
      }
    ],
    skills: ['Recebimento de cargas', 'Registro em sistema'],
    expectations: ['Mudar para Cuiabá', 'Sair do turno'],
    account: 'Amaggi',
    externalId: 'EMPG-DEMO-CAND-6203'
  },
  {
    id: 'TAL-CAMILA',
    name: 'Camila Torres Rondon',
    headline: 'Atendimento e faturamento',
    summary:
      'Faturista de distribuidora, com emissão de notas e conferência de pedidos.',
    experiences: [
      {
        role: 'Faturista',
        organization: 'Distribuidora Araés',
        period: 'abr/2024 — set/2026',
        activities:
          'Emitia notas, conferia pedidos antes do faturamento e atendia o comercial.'
      }
    ],
    skills: ['Faturamento', 'Conferência de pedidos'],
    expectations: ['Empresa grande'],
    account: 'Amaggi',
    externalId: 'EMPG-DEMO-CAND-6204'
  },

  // --- Norte Logística, Auxiliar de Armazém (VAG-10) ---
  {
    id: 'TAL-ADRIANO',
    name: 'Adriano Leite Maciel',
    headline: 'Conferência e separação em armazém',
    summary:
      'Auxiliar de armazém em transportadora de carga fracionada; separa por rota e confere no carregamento.',
    experiences: [
      {
        role: 'Auxiliar de armazém',
        organization: 'Fracionados MT',
        period: 'set/2023 — ago/2026',
        activities:
          'Separava volumes por rota, conferia no carregamento e registrava divergências no coletor.'
      }
    ],
    skills: ['Separação por rota', 'Conferência com coletor'],
    expectations: ['Turno da manhã', 'Perto de casa'],
    preferencias: [
      {
        axisId: 'execucao-ritmo',
        value: 'Está acostumado a alternar entre docas no início do turno.',
        updatedAt: '2026-09-16'
      }
    ],
    account: 'Grupo Norte Logística',
    externalId: 'EMPG-DEMO-CAND-6301'
  },
  {
    id: 'TAL-TAINA',
    name: 'Tainá Ferreira Curvo',
    headline: 'Reposição e recebimento em supermercado',
    summary:
      'Repositora com experiência no recebimento de mercadorias e conferência de notas.',
    experiences: [
      {
        role: 'Repositora',
        organization: 'Supermercado Bom Preço',
        period: 'fev/2024 — ago/2026',
        activities:
          'Recebia mercadorias, conferia notas e repunha gôndolas conforme a lista do dia.'
      }
    ],
    skills: ['Recebimento', 'Conferência de notas'],
    expectations: ['Turno fixo', 'Acompanhamento no início'],
    preferencias: [
      {
        axisId: 'lideranca-autonomia',
        value: 'Prefere alguém acompanhando nas primeiras semanas.',
        updatedAt: '2026-09-15'
      }
    ],
    account: 'Grupo Norte Logística',
    externalId: 'EMPG-DEMO-CAND-6302'
  },
  {
    id: 'TAL-MARCOSA',
    name: 'Marcos Aurélio Gaíva',
    headline: 'Ajudante de carga e descarga',
    summary:
      'Ajudante de carga em distribuidora de bebidas, com rotina pesada e turno da madrugada.',
    city: 'Várzea Grande, MT',
    experiences: [
      {
        role: 'Ajudante de carga',
        organization: 'Bebidas Cerrado',
        period: 'nov/2023 — ago/2026',
        activities:
          'Carregava e descarregava caminhões, conferia volumes com o motorista e organizava o pátio.'
      }
    ],
    skills: ['Carga e descarga', 'Conferência de volumes'],
    expectations: ['Sair da madrugada'],
    account: 'Grupo Norte Logística',
    externalId: 'EMPG-DEMO-CAND-6303'
  },
  {
    id: 'TAL-BRUNA',
    name: 'Bruna Xavier Dorileo',
    headline: 'Almoxarifado em clínica',
    summary:
      'Auxiliar de almoxarifado em clínica, com controle de entrada e saída em planilha.',
    experiences: [
      {
        role: 'Auxiliar de almoxarifado',
        organization: 'Clínica Santa Marta',
        period: 'mai/2024 — ago/2026',
        activities:
          'Controlava entrada e saída de materiais em planilha e atendia os setores da clínica.'
      }
    ],
    skills: ['Controle de materiais', 'Planilha'],
    expectations: ['Horário comercial'],
    account: 'Grupo Norte Logística',
    externalId: 'EMPG-DEMO-CAND-6304'
  },

  // --- Norte Logística, Conferente de Carga — processo de março (VAG-11) ---
  {
    id: 'TAL-PEDROIVO',
    name: 'Pedro Ivo Metelo',
    headline: 'Conferente noturno em transportadora',
    summary:
      'Conferente de carga em turno da noite há quatro anos; candidatou-se ao processo de março da Norte Logística.',
    experiences: [
      {
        role: 'Conferente de carga',
        organization: 'Transportes Sucuri',
        period: 'mar/2022 — fev/2026',
        activities:
          'Conferia romaneios no recebimento noturno e registrava divergências.'
      }
    ],
    skills: ['Conferência de romaneios', 'Turno da noite'],
    expectations: ['Continuar na conferência'],
    account: 'Grupo Norte Logística',
    externalId: 'EMPG-DEMO-CAND-6288'
  },
  {
    id: 'TAL-SUELLEN',
    name: 'Suellen Arruda Campos',
    headline: 'Expedição em indústria de alimentos',
    summary:
      'Auxiliar de expedição em indústria de alimentos, com conferência de paletes e registro em sistema.',
    experiences: [
      {
        role: 'Auxiliar de expedição',
        organization: 'Alimentos Pantanal',
        period: 'jun/2023 — jan/2026',
        activities:
          'Conferia paletes antes do carregamento e registrava as saídas no sistema.'
      }
    ],
    skills: ['Conferência de paletes', 'Registro em sistema'],
    expectations: ['Turno da noite'],
    account: 'Grupo Norte Logística',
    externalId: 'EMPG-DEMO-CAND-6289'
  },

  // --- Bom Futuro, Auxiliar de Almoxarifado (VAG-12) ---
  {
    id: 'TAL-LETICIA',
    name: 'Letícia Pedroso Amaral',
    headline: 'Almoxarifado de concessionária',
    summary:
      'Auxiliar de almoxarifado em concessionária de máquinas agrícolas, com recebimento, conferência e sistema.',
    experiences: [
      {
        role: 'Auxiliar de almoxarifado',
        organization: 'Máquinas Cerrado',
        period: 'ago/2023 — ago/2026',
        activities:
          'Recebia peças, conferia notas, lançava no sistema e atendia a oficina.'
      }
    ],
    skills: ['Recebimento de materiais', 'Conferência de notas', 'Sistema'],
    expectations: ['Empresa grande', 'Estabilidade'],
    preferencias: [
      {
        axisId: 'regras-decisao',
        value: 'Prefere procedimento definido para cada movimentação.',
        updatedAt: '2026-09-14'
      }
    ],
    account: 'Bom Futuro',
    externalId: 'EMPG-DEMO-CAND-6401'
  },
  {
    id: 'TAL-CAIO',
    name: 'Caio Vinícius Proença',
    headline: 'Estoque em loja de material de construção',
    summary:
      'Estoquista com controle de entrada e saída e organização de depósito.',
    experiences: [
      {
        role: 'Estoquista',
        organization: 'Construmais',
        period: 'jan/2024 — ago/2026',
        activities:
          'Organizava o depósito, conferia entregas e lançava entradas no sistema da loja.'
      }
    ],
    skills: ['Organização de depósito', 'Lançamento em sistema'],
    expectations: ['Horário comercial', 'Aprender a rotina'],
    account: 'Bom Futuro',
    externalId: 'EMPG-DEMO-CAND-6402'
  },
  {
    id: 'TAL-DAIANE',
    name: 'Daiane Lemes Botelho',
    headline: 'Apoio administrativo geral',
    summary:
      'Apoio administrativo em escritório, sem experiência em almoxarifado.',
    experiences: [
      {
        role: 'Auxiliar administrativa',
        organization: 'Escritório Rondon',
        period: 'mar/2025 — ago/2026',
        activities: 'Organizava documentos e atendia o telefone.'
      }
    ],
    skills: ['Organização de documentos', 'Atendimento telefônico'],
    expectations: [],
    account: 'Bom Futuro',
    externalId: 'EMPG-DEMO-CAND-6403'
  }
];

/**
 * Volume na vaga da Colatte: mais 16 pessoas, para a mesa ter a fila em que
 * a analista precisa de ferramenta — e para a vaga aparecer nas sugestões da
 * barra, que ordena por quantas pessoas passam do corte.
 */
const NOMES_DE_VOLUME: [string, string][] = [
  ['Adriele', 'Gaíva'],
  ['Anderson', 'Metelo'],
  ['Bianca', 'Proença'],
  ['Cleiton', 'Arruda'],
  ['Dayane', 'Figueiredo'],
  ['Éder', 'Rondon'],
  ['Fabíola', 'Curvo'],
  ['Gilberto', 'Padilha'],
  ['Helen', 'Cintra'],
  ['Ítalo', 'Salgado'],
  ['Jéssica', 'Portela'],
  ['Kelvin', 'Cabral'],
  ['Luana', 'Maciel'],
  ['Maicon', 'Lino'],
  ['Nayara', 'Dorileo'],
  ['Otoniel', 'Pedroso']
];

const HEADLINES_DE_VOLUME = [
  'Atendimento ao cliente em comércio',
  'Suporte de informática',
  'Recepção e agendamento',
  'Auxiliar administrativo'
] as const;

const VOLUME: TalentoSeed[] = NOMES_DE_VOLUME.map(([first, last], index) => ({
  id: `TAL-R-${String(index + 1).padStart(2, '0')}`,
  name: `${first} ${last}`,
  headline: HEADLINES_DE_VOLUME[index % HEADLINES_DE_VOLUME.length]!,
  summary: 'Perfil com experiência declarada no sistema de origem.',
  city: index % 3 === 0 ? 'Várzea Grande, MT' : 'Cuiabá, MT',
  experiences: [
    {
      role: HEADLINES_DE_VOLUME[index % HEADLINES_DE_VOLUME.length]!,
      organization: 'Empresa anterior',
      period: 'jan/2024 — ago/2026',
      activities: 'Rotina declarada no currículo recebido da origem.'
    }
  ],
  skills: ['Atendimento', 'Registro em sistema'],
  expectations: ['Trabalhar com tecnologia'],
  account: 'Colatte',
  externalId: `EMPG-DEMO-CAND-61${String(index + 1).padStart(2, '0')}`
}));

export const TALENTOS_REAIS: Talent[] = [...CURADOS, ...VOLUME].map(talento);

/* ------------------------------------------------------------------ *
 * Candidaturas
 * ------------------------------------------------------------------ */

type CandidaturaSeed = {
  id: string;
  talentId: string;
  jobId: string;
  appliedAt: string;
  externalStage: ExternalStage;
  technicalMatch: number | null;
  /**
   * Como a pessoa prefere trabalhar; `null` só no candidato da demonstração,
   * que responde ao vivo. Todo o resto da base responde: ela tem de parecer
   * completa.
   */
  jeito: Jeito | null;
  answeredAt?: string;
  referralStage?: Application['referralStage'];
};

const CANDIDATURAS: CandidaturaSeed[] = [
  // --- Colatte, Assistente de Suporte e Testes (VAG-06) ---
  {
    // O candidato da demonstração. Primeiro da lista, sem resposta: a cena
    // ao vivo é ele responder no celular.
    id: 'CAND-21',
    talentId: 'TAL-JONAS',
    jobId: 'VAG-06',
    appliedAt: '2026-09-19',
    externalStage: 'analise-tecnica',
    technicalMatch: 91,
    jeito: null
  },
  {
    // O gêmeo: já respondeu.
    id: 'CAND-22',
    talentId: 'TAL-KAUA',
    jobId: 'VAG-06',
    appliedAt: '2026-09-16',
    externalStage: 'analise-tecnica',
    technicalMatch: 84,
    jeito: KAUA,
    answeredAt: '2026-09-11T19:40:00.000Z'
  },
  {
    id: 'CAND-23',
    talentId: 'TAL-THAIS',
    jobId: 'VAG-06',
    appliedAt: '2026-09-14',
    externalStage: 'analise-tecnica',
    technicalMatch: 88,
    jeito: COMO_A_COLATTE,
    answeredAt: '2026-09-09T12:15:00.000Z'
  },
  {
    id: 'CAND-24',
    talentId: 'TAL-WESLEY',
    jobId: 'VAG-06',
    appliedAt: '2026-09-14',
    externalStage: 'triagem',
    technicalMatch: 67,
    jeito: DE_PROCEDIMENTO,
    answeredAt: '2026-09-09T18:20:00.000Z'
  },
  {
    // Técnico alto, jeito oposto: fica abaixo do corte.
    id: 'CAND-25',
    talentId: 'TAL-ANABEATRIZ',
    jobId: 'VAG-06',
    appliedAt: '2026-09-13',
    externalStage: 'analise-tecnica',
    technicalMatch: 93,
    jeito: OPOSTO_DA_COLATTE,
    answeredAt: '2026-09-08T09:30:00.000Z'
  },
  {
    // Técnico baixo, aderência alta: o resgate (R10).
    id: 'CAND-26',
    talentId: 'TAL-RUAN',
    jobId: 'VAG-06',
    appliedAt: '2026-09-16',
    externalStage: 'inscrito',
    technicalMatch: 42,
    jeito: COMO_A_COLATTE,
    answeredAt: '2026-09-11T08:05:00.000Z'
  },

  // --- Colatte, Auxiliar Administrativo e Financeiro (VAG-07) ---
  {
    id: 'CAND-27',
    talentId: 'TAL-LARISSA',
    jobId: 'VAG-07',
    appliedAt: '2026-09-18',
    externalStage: 'triagem',
    technicalMatch: 86,
    jeito: COMO_A_COLATTE,
    answeredAt: '2026-09-13T10:20:00.000Z'
  },
  {
    id: 'CAND-28',
    talentId: 'TAL-DIEGOP',
    jobId: 'VAG-07',
    appliedAt: '2026-09-18',
    externalStage: 'inscrito',
    technicalMatch: 71,
    jeito: DE_PROCEDIMENTO,
    answeredAt: '2026-09-13T15:00:00.000Z'
  },
  {
    id: 'CAND-29',
    talentId: 'TAL-MADU',
    jobId: 'VAG-07',
    appliedAt: '2026-09-19',
    externalStage: 'inscrito',
    technicalMatch: 58,
    jeito: NEUTRO,
    answeredAt: '2026-09-13T20:10:00.000Z'
  },

  // --- Log,Lab, Analista de Suporte Júnior (VAG-08) ---
  {
    id: 'CAND-30',
    talentId: 'TAL-VITORIA',
    jobId: 'VAG-08',
    appliedAt: '2026-09-11',
    externalStage: 'analise-tecnica',
    technicalMatch: 78,
    jeito: DE_PROCEDIMENTO,
    answeredAt: '2026-09-06T11:00:00.000Z'
  },
  {
    id: 'CAND-31',
    talentId: 'TAL-HENRIQUE',
    jobId: 'VAG-08',
    appliedAt: '2026-09-12',
    externalStage: 'analise-tecnica',
    technicalMatch: 83,
    jeito: DE_PATIO,
    answeredAt: '2026-09-07T20:10:00.000Z'
  },
  {
    id: 'CAND-32',
    talentId: 'TAL-PAMELA',
    jobId: 'VAG-08',
    appliedAt: '2026-09-15',
    externalStage: 'triagem',
    technicalMatch: 61,
    jeito: DE_PROCEDIMENTO,
    answeredAt: '2026-09-10T13:45:00.000Z'
  },
  {
    id: 'CAND-33',
    talentId: 'TAL-GUSTAVO',
    jobId: 'VAG-08',
    appliedAt: '2026-09-19',
    externalStage: 'inscrito',
    technicalMatch: 55,
    jeito: DE_PROCEDIMENTO,
    answeredAt: '2026-09-13T21:00:00.000Z'
  },

  // --- Amaggi, Assistente de Logística (VAG-09) ---
  {
    id: 'CAND-34',
    talentId: 'TAL-RAFAELS',
    jobId: 'VAG-09',
    appliedAt: '2026-09-10',
    externalStage: 'analise-tecnica',
    technicalMatch: 89,
    jeito: DE_PROCEDIMENTO,
    answeredAt: '2026-09-05T18:30:00.000Z'
  },
  {
    id: 'CAND-35',
    talentId: 'TAL-INGRID',
    jobId: 'VAG-09',
    appliedAt: '2026-09-11',
    externalStage: 'analise-tecnica',
    technicalMatch: 74,
    jeito: NEUTRO,
    answeredAt: '2026-09-06T09:00:00.000Z'
  },
  {
    id: 'CAND-36',
    talentId: 'TAL-ELIAS',
    jobId: 'VAG-09',
    appliedAt: '2026-09-14',
    externalStage: 'triagem',
    technicalMatch: 80,
    jeito: DE_PATIO,
    answeredAt: '2026-09-09T21:20:00.000Z'
  },
  {
    id: 'CAND-37',
    talentId: 'TAL-CAMILA',
    jobId: 'VAG-09',
    appliedAt: '2026-09-19',
    externalStage: 'inscrito',
    technicalMatch: 63,
    jeito: NEUTRO,
    answeredAt: '2026-09-13T19:30:00.000Z'
  },

  // --- Norte Logística, Auxiliar de Armazém (VAG-10) ---
  {
    id: 'CAND-38',
    talentId: 'TAL-ADRIANO',
    jobId: 'VAG-10',
    appliedAt: '2026-09-17',
    externalStage: 'triagem',
    technicalMatch: 85,
    jeito: DE_PATIO,
    answeredAt: '2026-09-12T07:50:00.000Z'
  },
  {
    id: 'CAND-39',
    talentId: 'TAL-TAINA',
    jobId: 'VAG-10',
    appliedAt: '2026-09-18',
    externalStage: 'inscrito',
    technicalMatch: 66,
    jeito: OPOSTO_DA_COLATTE,
    answeredAt: '2026-09-13T16:25:00.000Z'
  },
  {
    // A candidatura antiga do candidato da demonstração, com as 10 frases da
    // Norte respondidas em março sob o aceite vigente: 3 delas voltam na
    // Colatte. Não avançou naquele processo.
    id: 'CAND-40',
    talentId: 'TAL-JONAS',
    jobId: 'VAG-11',
    appliedAt: '2026-03-15',
    externalStage: 'entrevista-empresa',
    technicalMatch: 82,
    jeito: JONAS,
    answeredAt: '2026-03-10T19:05:00.000Z',
    referralStage: 'nao-avancou'
  },
  {
    id: 'CAND-41',
    talentId: 'TAL-MARCOSA',
    jobId: 'VAG-10',
    appliedAt: '2026-09-18',
    externalStage: 'inscrito',
    technicalMatch: 59,
    jeito: DE_PATIO,
    answeredAt: '2026-09-13T06:40:00.000Z'
  },
  {
    id: 'CAND-42',
    talentId: 'TAL-BRUNA',
    jobId: 'VAG-10',
    appliedAt: '2026-09-19',
    externalStage: 'inscrito',
    technicalMatch: 52,
    jeito: DE_PROCEDIMENTO,
    answeredAt: '2026-09-13T22:15:00.000Z'
  },

  // --- Norte Logística, Conferente de Carga — março (VAG-11) ---
  {
    id: 'CAND-43',
    talentId: 'TAL-PEDROIVO',
    jobId: 'VAG-11',
    appliedAt: '2026-03-14',
    externalStage: 'entrevista-empresa',
    technicalMatch: 90,
    jeito: DE_PATIO,
    answeredAt: '2026-03-09T22:30:00.000Z',
    referralStage: 'interesse-em-entrevista'
  },
  {
    id: 'CAND-44',
    talentId: 'TAL-SUELLEN',
    jobId: 'VAG-11',
    appliedAt: '2026-03-16',
    externalStage: 'triagem',
    technicalMatch: 73,
    jeito: DE_PROCEDIMENTO,
    answeredAt: '2026-03-11T08:15:00.000Z',
    referralStage: 'nao-avancou'
  },

  // --- Bom Futuro, Auxiliar de Almoxarifado (VAG-12) ---
  {
    id: 'CAND-45',
    talentId: 'TAL-LETICIA',
    jobId: 'VAG-12',
    appliedAt: '2026-09-16',
    externalStage: 'triagem',
    technicalMatch: 87,
    jeito: DE_PROCEDIMENTO,
    answeredAt: '2026-09-11T12:00:00.000Z'
  },
  {
    id: 'CAND-46',
    talentId: 'TAL-CAIO',
    jobId: 'VAG-12',
    appliedAt: '2026-09-17',
    externalStage: 'inscrito',
    technicalMatch: 69,
    jeito: NEUTRO,
    answeredAt: '2026-09-12T17:30:00.000Z'
  },
  {
    id: 'CAND-47',
    talentId: 'TAL-DAIANE',
    jobId: 'VAG-12',
    appliedAt: '2026-09-18',
    externalStage: 'inscrito',
    technicalMatch: 44,
    jeito: NEUTRO,
    answeredAt: '2026-09-12T17:45:00.000Z'
  }
];

/** As 16 candidaturas de volume na vaga da Colatte, sorteadas com semente. */
function candidaturasDeVolume(random: () => number): CandidaturaSeed[] {
  return VOLUME.map((seed, index) => {
    const draw = random();
    // A maioria no meio da escala ou com jeito de outro setor; poucos perto
    // da equipe da Colatte — o volume é pano de fundo, não protagonista.
    const jeito: Jeito =
      draw < 0.4
        ? NEUTRO
        : draw < 0.6
          ? COMO_A_COLATTE
          : draw < 0.85
            ? DE_PATIO
            : OPOSTO_DA_COLATTE;
    const diasAtras = 1 + Math.floor(random() * 9);
    const appliedAt = `2026-09-${String(14 - diasAtras).padStart(2, '0')}`;
    return {
      id: `CAND-${48 + index}`,
      talentId: seed.id,
      jobId: 'VAG-06',
      appliedAt,
      externalStage: draw < 0.5 ? 'triagem' : 'inscrito',
      technicalMatch: 45 + Math.floor(random() * 45),
      jeito,
      answeredAt: `${appliedAt}T${String(8 + Math.floor(random() * 12)).padStart(2, '0')}:${String(Math.floor(random() * 60)).padStart(2, '0')}:00.000Z`
    };
  });
}

const random = createRandom(SEED_CANDIDATOS_REAIS);
const TODAS_AS_CANDIDATURAS: CandidaturaSeed[] = [
  ...CANDIDATURAS,
  ...candidaturasDeVolume(random)
];

const CONTA_POR_TALENTO = new Map(
  TALENTOS_REAIS.map((talent) => [
    talent.id,
    talent.externalRefs[0]?.account ?? 'Colatte'
  ])
);

export const CANDIDATURAS_REAIS: Application[] = TODAS_AS_CANDIDATURAS.map(
  (seed) => ({
    id: seed.id,
    talentId: seed.talentId,
    jobId: seed.jobId,
    appliedAt: seed.appliedAt,
    externalStage: seed.externalStage,
    analysisStage:
      seed.externalStage === 'analise-tecnica' ||
      seed.externalStage === 'entrevista-empresa'
        ? 'em-andamento'
        : 'nao-iniciada',
    referralStage: seed.referralStage ?? 'nao-encaminhada',
    technicalMatch: seed.technicalMatch,
    externalRef: {
      system: SYSTEM,
      account: CONTA_POR_TALENTO.get(seed.talentId) ?? 'Colatte',
      id: `EMPG-DEMO-APP-${seed.id}`
    }
  })
);

/* ------------------------------------------------------------------ *
 * Respostas ao questionário
 * ------------------------------------------------------------------ */

const EMPRESA_DA_VAGA = new Map(
  VAGAS_REAIS.map((job) => [job.id, job.companyId])
);

const frasesPorEmpresa = new Map<string, string[]>();

/** As 10 frases que a empresa real da vaga pergunta. */
export function frasesDaVagaReal(jobId: string): string[] {
  const companyId = EMPRESA_DA_VAGA.get(jobId) ?? '';
  const guardadas = frasesPorEmpresa.get(companyId);
  if (guardadas) return guardadas;
  const perfil = calcularPerfilCultural(
    RESPOSTAS_CULTURA_REAIS.filter((answer) => answer.companyId === companyId)
  );
  const ids = escolherPerguntasDoCandidato(perfil).map((p) => p.itemId);
  frasesPorEmpresa.set(companyId, ids);
  return ids;
}

export const RESPOSTAS_FIT_REAIS: CandidateFitResponse[] =
  TODAS_AS_CANDIDATURAS.filter(
    (seed): seed is CandidaturaSeed & { jeito: Jeito; answeredAt: string } =>
      seed.jeito !== null && seed.answeredAt !== undefined
  ).map((seed) => ({
    applicationId: seed.id,
    talentId: seed.talentId,
    answers: responderQuestionario(
      frasesDaVagaReal(seed.jobId),
      { temas: seed.jeito } satisfies AlvoCultural,
      random,
      0.4
    ),
    answeredAt: seed.answeredAt,
    consent: {
      acceptedAt: seed.answeredAt,
      version: CANDIDATE_CONSENT_VERSION
    }
  }));

/* ------------------------------------------------------------------ *
 * O que a pessoa declarou, no mapa
 * ------------------------------------------------------------------ */

const MAPA: {
  talentId: string;
  jeito: Jeito;
  temas: FitAxisId[];
  at: string;
}[] = [
  {
    talentId: 'TAL-JONAS',
    jeito: JONAS,
    temas: [
      'execucao-ritmo',
      'lideranca-autonomia',
      'interacao-convivencia',
      'regras-decisao',
      'aprendizado-desenvolvimento',
      'inovacao'
    ],
    at: '2026-09-17'
  },
  {
    talentId: 'TAL-KAUA',
    jeito: KAUA,
    temas: ['lideranca-autonomia', 'execucao-ritmo', 'interacao-convivencia'],
    at: '2026-09-15'
  },
  {
    talentId: 'TAL-THAIS',
    jeito: COMO_A_COLATTE,
    temas: ['interacao-convivencia', 'execucao-ritmo'],
    at: '2026-09-14'
  },
  {
    talentId: 'TAL-ANABEATRIZ',
    jeito: OPOSTO_DA_COLATTE,
    temas: ['regras-decisao', 'lideranca-autonomia', 'execucao-ritmo'],
    at: '2026-09-13'
  },
  {
    talentId: 'TAL-RUAN',
    jeito: COMO_A_COLATTE,
    temas: ['interacao-convivencia'],
    at: '2026-09-16'
  },
  {
    talentId: 'TAL-VITORIA',
    jeito: DE_PROCEDIMENTO,
    temas: ['regras-decisao'],
    at: '2026-09-12'
  },
  {
    talentId: 'TAL-RAFAELS',
    jeito: DE_PROCEDIMENTO,
    temas: ['adaptacao-carreira'],
    at: '2026-09-11'
  },
  {
    talentId: 'TAL-ADRIANO',
    jeito: DE_PATIO,
    temas: ['execucao-ritmo'],
    at: '2026-09-16'
  },
  {
    talentId: 'TAL-TAINA',
    jeito: OPOSTO_DA_COLATTE,
    temas: ['lideranca-autonomia'],
    at: '2026-09-15'
  },
  {
    talentId: 'TAL-LETICIA',
    jeito: DE_PROCEDIMENTO,
    temas: ['regras-decisao'],
    at: '2026-09-14'
  }
];

function paraEscala(valor: number): ValorDaEscala {
  return Math.min(5, Math.max(1, Math.round(valor))) as ValorDaEscala;
}

export const PREFERENCIAS_CULTURAIS_REAIS: TalentCultureAnswer[] = MAPA.flatMap(
  (entrada) =>
    entrada.temas.map((tema) => ({
      id: `CULT-${entrada.talentId}-${tema}`,
      talentId: entrada.talentId,
      axisId: tema,
      value: paraEscala(entrada.jeito[tema]),
      origin: ORIGEM_IEL,
      sourceId: 'FONTE-IEL' as const,
      updatedAt: entrada.at
    }))
);

/* ------------------------------------------------------------------ *
 * Análise e evidências
 * ------------------------------------------------------------------ */

function evidencia(
  id: string,
  talentId: string | null,
  teamId: string | null,
  information: string,
  origem: {
    sourceId: Evidence['sourceId'];
    originLabel: string;
    nature: Evidence['nature'];
  },
  updatedAt: string,
  links: Evidence['links'],
  interpretation: string
): Evidence {
  return {
    id,
    talentId,
    teamId,
    information,
    sourceId: origem.sourceId,
    originLabel: origem.originLabel,
    nature: origem.nature,
    updatedAt,
    visibility: 'compartilhavel',
    links,
    interpretation
  };
}

const CURRICULO = (organizacao: string) => ({
  sourceId: 'FONTE-EMPREGARE' as const,
  originLabel: `Currículo — experiência na ${organizacao}`,
  nature: 'relato-do-candidato' as const
});
const IEL = {
  sourceId: 'FONTE-IEL' as const,
  originLabel: ORIGEM_IEL,
  nature: 'registro-iel' as const
};
const VAGA = {
  sourceId: 'FONTE-EMPREGARE' as const,
  originLabel: 'Descrição da vaga (Empregare)',
  nature: 'descricao-da-vaga' as const
};

const EVIDENCIAS_CURADAS: Evidence[] = [
  // --- Jonas ---
  evidencia(
    'EVD-JONAS-01',
    'TAL-JONAS',
    null,
    'Registrava chamados de reparo e explicava o resultado ao cliente.',
    CURRICULO('Assistência Techcell'),
    '2026-09-19',
    [{ jobId: 'VAG-06', criterionId: 'CRI-601' }],
    'Atendimento com registro de chamado, ainda que em assistência técnica e não em software: a rotina é a mesma.'
  ),
  evidencia(
    'EVD-JONAS-02',
    'TAL-JONAS',
    null,
    'Testava os aparelhos depois do conserto seguindo checklist.',
    CURRICULO('Assistência Techcell'),
    '2026-09-19',
    [{ jobId: 'VAG-06', criterionId: 'CRI-602' }],
    'Teste com roteiro e registro do que saiu diferente: é o que a vaga pede, em outro objeto.'
  ),
  evidencia(
    'EVD-JONAS-03',
    'TAL-JONAS',
    null,
    'Registrava divergências de romaneio no sistema da transportadora e abria ocorrências.',
    CURRICULO('Transportadora Rio Cuiabá'),
    '2026-09-19',
    [{ jobId: 'VAG-06', criterionId: 'CRI-603' }],
    'Lançamento de ocorrência em sistema, três anos seguidos.'
  ),
  evidencia(
    'EVD-JONAS-04',
    'TAL-JONAS',
    null,
    'Curso técnico em informática concluído em julho de 2026 (noturno).',
    IEL,
    '2026-09-17',
    [{ jobId: 'VAG-06', criterionId: 'CRI-604' }],
    'Formação concluída durante o emprego no pátio: é a mudança de setor em andamento.'
  ),
  evidencia(
    'EVD-JONAS-05',
    'TAL-JONAS',
    null,
    'Disponibilidade declarada em horário comercial nesta candidatura.',
    {
      sourceId: 'FONTE-EMPREGARE',
      originLabel: 'Candidatura EMPG-DEMO-CAND-6001 (Colatte)',
      nature: 'relato-do-candidato'
    },
    '2026-09-19',
    [{ jobId: 'VAG-06', criterionId: 'CRI-605' }],
    'Cobre o horário das 9h às 18h.'
  ),
  evidencia(
    'EVD-JONAS-06',
    'TAL-JONAS',
    null,
    'Quer mudar para a área de tecnologia e aprender com quem programa.',
    IEL,
    '2026-09-17',
    [{ jobId: 'VAG-06', criterionId: 'CRI-606' }],
    'Interesse registrado antes desta vaga, no atendimento em que ele contou do curso.'
  ),
  evidencia(
    'EVD-JONAS-07',
    'TAL-JONAS',
    null,
    'Prefere fechar uma conferência antes de abrir outra: "no pátio, quem alterna erra".',
    IEL,
    '2026-09-17',
    [{ jobId: 'VAG-06', criterionId: 'CRI-608' }],
    'Preferência de ritmo declarada. Na Colatte um chamado interrompe o teste em andamento — é o ponto a conversar, não um demérito.'
  ),

  // --- Kauã ---
  evidencia(
    'EVD-KAUA-01',
    'TAL-KAUA',
    null,
    'Atendia transportadoras no balcão e registrava as ocorrências do dia.',
    CURRICULO('Distribuidora Vale do Coxipó'),
    '2026-09-16',
    [
      { jobId: 'VAG-06', criterionId: 'CRI-601' },
      { jobId: 'VAG-06', criterionId: 'CRI-603' }
    ],
    'Atendimento com registro, em contexto de expedição.'
  ),
  evidencia(
    'EVD-KAUA-02',
    'TAL-KAUA',
    null,
    'Atendia chamados do laboratório e testava as máquinas seguindo roteiro.',
    CURRICULO('Escola técnica'),
    '2026-09-16',
    [
      { jobId: 'VAG-06', criterionId: 'CRI-602' },
      { jobId: 'VAG-06', criterionId: 'CRI-604' }
    ],
    'Estágio curto, mas na atividade exata da vaga.'
  ),
  evidencia(
    'EVD-KAUA-03',
    'TAL-KAUA',
    null,
    'Disponibilidade declarada em horário comercial.',
    {
      sourceId: 'FONTE-EMPREGARE',
      originLabel: 'Candidatura EMPG-DEMO-CAND-6002 (Colatte)',
      nature: 'relato-do-candidato'
    },
    '2026-09-16',
    [{ jobId: 'VAG-06', criterionId: 'CRI-605' }],
    'Cobre o horário da vaga.'
  ),

  // --- Equipe da Colatte ---
  evidencia(
    'EVD-EQ04-01',
    null,
    'EQ-04',
    'Apoio nas primeiras semanas ainda não informado pela empresa.',
    {
      sourceId: 'FONTE-IEL',
      originLabel: 'Registro IEL — pedido de contexto à empresa',
      nature: 'registro-iel'
    },
    '2026-09-18',
    [{ jobId: 'VAG-06', criterionId: 'CRI-607' }],
    'Espaço não mapeado. Para quem vem de outra área, é a pergunta da ligação.'
  ),
  evidencia(
    'EVD-EQ04-02',
    null,
    'EQ-04',
    'Os chamados chegam de vários clientes ao mesmo tempo e interrompem o teste em andamento.',
    VAGA,
    '2026-09-18',
    [{ jobId: 'VAG-06', criterionId: 'CRI-608' }],
    'Condição de ritmo da equipe, confirmada pela consulta: a equipe alterna; a gestão acha que não.'
  )
];

const ANALISE_CURADA: AnalysisByApplication = {
  'CAND-21': {
    'CRI-601': {
      state: 'alinhamento',
      note: 'Registrava chamados na assistência técnica e atendia motoristas na doca.',
      evidenceIds: ['EVD-JONAS-01']
    },
    'CRI-602': {
      state: 'alinhamento',
      note: 'Testava aparelhos após o reparo seguindo checklist.',
      evidenceIds: ['EVD-JONAS-02']
    },
    'CRI-603': {
      state: 'alinhamento',
      note: 'Registro de divergências e ocorrências em sistema por três anos.',
      evidenceIds: ['EVD-JONAS-03']
    },
    'CRI-604': {
      state: 'alinhamento',
      note: 'Técnico em informática concluído em julho de 2026.',
      evidenceIds: ['EVD-JONAS-04']
    },
    'CRI-605': {
      state: 'alinhamento',
      note: 'Disponibilidade em horário comercial declarada nesta candidatura.',
      evidenceIds: ['EVD-JONAS-05']
    },
    'CRI-606': {
      state: 'alinhamento',
      note: 'Quer mudar para tecnologia; registrado no atendimento.',
      evidenceIds: ['EVD-JONAS-06']
    },
    'CRI-607': {
      state: 'sem-informacao',
      note: 'A empresa ainda não informou se há apoio nas primeiras semanas — e ele vem de outra área.',
      evidenceIds: ['EVD-EQ04-01']
    },
    'CRI-608': {
      state: 'a-esclarecer',
      note: 'Ele prefere uma conferência de cada vez; na equipe, chamado interrompe teste. Vale conversar sobre como a fila é organizada.',
      evidenceIds: ['EVD-JONAS-07', 'EVD-EQ04-02']
    }
  },
  'CAND-22': {
    'CRI-601': {
      state: 'alinhamento',
      note: 'Atendimento a transportadoras com registro de ocorrências.',
      evidenceIds: ['EVD-KAUA-01']
    },
    'CRI-602': {
      state: 'alinhamento',
      note: 'Teste de máquinas seguindo roteiro no estágio.',
      evidenceIds: ['EVD-KAUA-02']
    },
    'CRI-603': {
      state: 'alinhamento',
      note: 'Lançava saídas e ocorrências no sistema da distribuidora.',
      evidenceIds: ['EVD-KAUA-01']
    },
    'CRI-604': {
      state: 'alinhamento',
      note: 'Técnico em informática concluído em julho de 2026.',
      evidenceIds: ['EVD-KAUA-02']
    },
    'CRI-605': {
      state: 'alinhamento',
      note: 'Disponibilidade em horário comercial.',
      evidenceIds: ['EVD-KAUA-03']
    },
    'CRI-606': {
      state: 'sem-informacao',
      note: 'Interesse em tecnologia consta do currículo, sem registro em atendimento.',
      evidenceIds: []
    },
    'CRI-607': {
      state: 'sem-informacao',
      note: 'A empresa ainda não informou se há apoio nas primeiras semanas.',
      evidenceIds: ['EVD-EQ04-01']
    },
    'CRI-608': {
      state: 'a-esclarecer',
      note: 'Prefere terminar uma tarefa antes de começar outra; a equipe alterna.',
      evidenceIds: ['EVD-EQ04-02']
    }
  }
};

/**
 * Análise das demais candidaturas: estados sorteados com semente, pesados em
 * alinhamento e lacuna, com uma evidência genérica por critério informado —
 * o mesmo desenho de `generated.ts`.
 */
const ESTADOS: CriterionState[] = [
  'alinhamento',
  'alinhamento',
  'alinhamento',
  'a-esclarecer',
  'a-esclarecer',
  'sem-informacao',
  'sem-informacao'
];

const NOTA_POR_ESTADO: Record<CriterionState, string> = {
  alinhamento: 'Há registro na origem que sustenta a relação com o critério.',
  'a-esclarecer': 'A informação existe, mas a condição precisa ser confirmada.',
  divergencia: 'Duas origens registram informações que não coincidem.',
  'sem-informacao': 'Nenhum registro recebido sustenta este critério ainda.',
  'nao-se-aplica': 'Critério fora do escopo desta vaga.'
};

function construirAnaliseGenerica(): {
  analysis: AnalysisByApplication;
  evidences: Evidence[];
} {
  const proprio = createRandom(SEED_CANDIDATOS_REAIS + 1);
  const analysis: AnalysisByApplication = {};
  const evidences: Evidence[] = [];
  const vagaPorId = new Map(VAGAS_REAIS.map((job) => [job.id, job]));

  for (const application of CANDIDATURAS_REAIS) {
    if (ANALISE_CURADA[application.id]) continue;
    const job = vagaPorId.get(application.jobId);
    if (!job) continue;
    const talento = TALENTOS_REAIS.find((t) => t.id === application.talentId);
    const porCriterio: Record<string, CriterionAnalysis> = {};

    for (const criterion of job.criteria) {
      const state = ESTADOS[Math.floor(proprio() * ESTADOS.length)]!;
      const evidenceIds: string[] = [];
      if (state !== 'sem-informacao') {
        const id = `EVD-R-${application.id}-${criterion.id}`;
        const experiencia = talento?.experiences[0];
        evidences.push(
          evidencia(
            id,
            application.talentId,
            null,
            experiencia?.activities ?? 'Rotina declarada no currículo.',
            CURRICULO(experiencia?.organization ?? 'empresa anterior'),
            application.appliedAt,
            [{ jobId: job.id, criterionId: criterion.id }],
            'Registro recebido da origem, ainda sem verificação prática.'
          )
        );
        evidenceIds.push(id);
      }
      porCriterio[criterion.id] = {
        state,
        note: NOTA_POR_ESTADO[state],
        evidenceIds
      };
    }
    analysis[application.id] = porCriterio;
  }

  return { analysis, evidences };
}

const GENERICA = construirAnaliseGenerica();

export const ANALISE_REAL: AnalysisByApplication = {
  ...ANALISE_CURADA,
  ...GENERICA.analysis
};

export const EVIDENCIAS_REAIS: Evidence[] = [
  ...EVIDENCIAS_CURADAS,
  ...GENERICA.evidences
];
