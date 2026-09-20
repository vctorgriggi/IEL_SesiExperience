/**
 * Base de demonstração do acompanhamento: uma remessa antiga da Horizonte
 * Alimentos (EMP-02, VAG-02) com três pessoas contratadas.
 *
 * `referrals` começava vazio, então nada do ciclo pós-contratação aparecia de
 * fábrica: a devolutiva de um clique (C3) só existia depois que alguém
 * clicava "contratei" ao vivo. Esta remessa foi registrada há 80 dias, a
 * empresa quis entrevistar as três e clicou "contratei" — e, como é o caso
 * comum, nunca mais voltou: nenhum "continua" nem "saiu" da empresa
 * (00:05:33, 00:35:28). O que se sabe depois disso veio da própria pessoa,
 * pelos check-ins de 30/60/90 dias (`analysis/acompanhamento.ts`).
 *
 * As três pessoas são novas, e não Ana, Elisa ou Fábio, de propósito: as três
 * candidaturas curadas da VAG-02 têm papel no roteiro (Ana é a segunda
 * candidatura da mesma pessoa, Fábio é o caso de resgate da dor R10), e uma
 * contratação antiga em cima delas contradiria as telas em que aparecem.
 *
 * A VAG-01 fica intocada: é a cena ao vivo do pitch (marcar 3 → registrar →
 * "contratei").
 *
 * Os três casos, com a data de hoje em `DEMO_REFERENCE_DATE`:
 *
 * - **Júlia** (A) — contratada há 75 dias. Respondeu os check-ins de 30
 *   (continua, "bom") e de 60 (continua, "muito bom"). O de 90 ainda não
 *   chegou. É o caso que está dando certo, e o IEL sabe disso sem o RH.
 * - **Marcos** (B) — contratado há 45 dias. O check-in de 30 está aberto e
 *   ele não respondeu: é quem a analista deve ligar hoje.
 * - **Renata** (C) — contratada há 70 dias. No check-in de 30 disse que
 *   **saiu** ("o turno mudou e não deu com o transporte"). A empresa não
 *   informou nada: a saída só existe porque a pessoa contou. É a divergência
 *   que dá sentido à segunda fonte.
 *
 * Determinístico como o resto da base: as respostas de fit saem do gerador
 * semeado, e toda data é relativa a `DEMO_REFERENCE_DATE`.
 */

import {
  CHECK_IN_CONSENT_VERSION,
  type CheckIn
} from '../analysis/acompanhamento';
import { CANDIDATE_CONSENT_VERSION } from '../analysis/candidate-questionnaire';
import {
  calcularPerfilCultural,
  escolherPerguntasDoCandidato
} from '../analysis/culture';
import type { FitAxisId } from '../analysis/fit-axes';
import type {
  Application,
  CandidateFitResponse,
  Referral,
  Talent
} from '../types';
import { DEMO_REFERENCE_DATE } from './companies';
import { DEMO_CULTURE_ANSWERS } from './culture';
import { createRandom, responderQuestionario } from './respostas-sinteticas';

/* ------------------------------------------------------------------ *
 * Datas
 * ------------------------------------------------------------------ */

const REFERENCE_MS = Date.parse(`${DEMO_REFERENCE_DATE}T12:00:00.000Z`);
const DAY_MS = 86_400_000;

/** `YYYY-MM-DD`, `days` dias antes da referência. */
function dateBefore(days: number): string {
  return new Date(REFERENCE_MS - days * DAY_MS).toISOString().slice(0, 10);
}

/** ISO completo, `days` dias antes da referência, na hora dada. */
function isoBefore(days: number, time = '10:00'): string {
  return `${dateBefore(days)}T${time}:00.000Z`;
}

const JOB_ID = 'VAG-02';
const COMPANY_ID = 'EMP-02';

/** Há quantos dias a remessa foi registrada e a empresa respondeu. */
const REMESSA_HA_DIAS = 110;
const DECISAO_HA_DIAS = 108;

/** Há quantos dias cada pessoa foi contratada (o clique "contratei"). */
const CONTRATADA_HA_DIAS = {
  JULIA: 75,
  MARCOS: 45,
  RENATA: 70,
  // Diego já passou dos 90 dias: é quem prova que o cartão "Ficaram" conta.
  DIEGO_CAMPOS: 100
} as const;

/* ------------------------------------------------------------------ *
 * Pessoas
 * ------------------------------------------------------------------ */

const ACCOUNT = 'Horizonte Alimentos';
const SYSTEM = 'Empregare';

export const DEMO_ACOMPANHAMENTO_TALENTS: Talent[] = [
  {
    id: 'JULIA',
    name: 'Júlia Ferreira',
    headline: 'Conferência de mercadorias e organização de almoxarifado',
    summary:
      'Trabalhou em almoxarifado de distribuidora conferindo entradas e organizando prateleiras. Gosta de rotina definida e de saber o que fazer a cada dia.',
    city: 'Anápolis, GO',
    email: 'julia.ferreira@example.com',
    experiences: [
      {
        id: 'EXP-JULIA-01',
        role: 'Auxiliar de almoxarifado',
        organization: 'Distribuidora Planalto',
        period: 'fev/2024 — abr/2026',
        activities:
          'Conferia notas e mercadorias na entrada, organizava o estoque por família de produto e apoiava o inventário mensal.'
      }
    ],
    declaredSkills: [
      'Conferência de mercadorias',
      'Organização de almoxarifado',
      'Inventário'
    ],
    expectations: ['Rotina definida', 'Trabalho perto de casa'],
    preferences: [
      {
        id: 'PREF-JULIA-01',
        axisId: 'regras-decisao',
        value: 'Prefere procedimento definido e combinados por escrito.',
        origin: 'Registro IEL — expectativa coletada em atendimento',
        sourceId: 'FONTE-IEL',
        updatedAt: dateBefore(100)
      }
    ],
    externalRefs: [
      { system: SYSTEM, account: ACCOUNT, id: 'EMPG-DEMO-CAND-9101' }
    ]
  },
  {
    id: 'MARCOS',
    name: 'Marcos Vinícius Rocha',
    headline: 'Recebimento e expedição em supermercado',
    summary:
      'Trabalhou no recebimento de um supermercado, com lançamento de entradas em sistema. Aprende rápido e prefere que alguém acompanhe nas primeiras semanas.',
    city: 'Anápolis, GO',
    email: 'marcos.rocha@example.com',
    experiences: [
      {
        id: 'EXP-MARCOS-01',
        role: 'Repositor e recebimento',
        organization: 'Supermercado Boa Vista',
        period: 'jun/2023 — mai/2026',
        activities:
          'Recebia mercadorias, lançava entradas no sistema da loja e repunha gôndolas conforme a lista do dia.'
      }
    ],
    declaredSkills: ['Recebimento de mercadorias', 'Lançamento em sistema'],
    expectations: ['Acompanhamento no início', 'Horário fixo'],
    preferences: [
      {
        id: 'PREF-MARCOS-01',
        axisId: 'lideranca-autonomia',
        value: 'Prefere que alguém acompanhe nas primeiras semanas.',
        origin: 'Registro IEL — expectativa coletada em atendimento',
        sourceId: 'FONTE-IEL',
        updatedAt: dateBefore(100)
      }
    ],
    externalRefs: [
      { system: SYSTEM, account: ACCOUNT, id: 'EMPG-DEMO-CAND-9102' }
    ]
  },
  {
    id: 'RENATA',
    name: 'Renata Guimarães',
    headline: 'Controle de materiais em obra e depósito',
    summary:
      'Controlou entrada e saída de materiais no depósito de uma construtora. Depende de transporte público e procura horário comercial.',
    city: 'Anápolis, GO',
    email: 'renata.guimaraes@example.com',
    experiences: [
      {
        id: 'EXP-RENATA-01',
        role: 'Auxiliar de depósito',
        organization: 'Construtora Serra Azul',
        period: 'ago/2024 — mar/2026',
        activities:
          'Registrava entrada e saída de materiais em planilha, conferia pedidos das equipes e organizava o depósito.'
      }
    ],
    declaredSkills: ['Controle de materiais', 'Planilha de entradas e saídas'],
    expectations: ['Horário comercial', 'Trajeto viável por ônibus'],
    preferences: [
      {
        id: 'PREF-RENATA-01',
        axisId: 'execucao-ritmo',
        value: 'Procura horário comercial: depende de ônibus para chegar.',
        origin: 'Currículo — informação declarada na inscrição',
        sourceId: 'FONTE-EMPREGARE',
        updatedAt: dateBefore(100)
      }
    ],
    externalRefs: [
      { system: SYSTEM, account: ACCOUNT, id: 'EMPG-DEMO-CAND-9103' }
    ]
  },
  {
    id: 'DIEGO-CAMPOS',
    name: 'Diego Arruda Campos',
    headline: 'Expedição e separação de pedidos em distribuidora',
    summary:
      'Separou e conferiu pedidos em distribuidora de bebidas por dois anos. Prefere turno com começo e fim certos e gosta de saber o porquê das regras.',
    city: 'Cuiabá, MT',
    email: 'diego.campos@example.com',
    experiences: [
      {
        id: 'EXP-DIEGO-CAMPOS-01',
        role: 'Auxiliar de expedição',
        organization: 'Distribuidora Rio Verde',
        period: 'mar/2024 — mai/2026',
        activities:
          'Separava pedidos por rota, conferia a carga na doca e fechava o romaneio do turno.'
      }
    ],
    declaredSkills: [
      'Separação de pedidos',
      'Conferência de carga',
      'Romaneio'
    ],
    expectations: ['Turno fixo', 'Crescer dentro da empresa'],
    preferences: [
      {
        id: 'PREF-DIEGO-CAMPOS-01',
        axisId: 'execucao-ritmo',
        value: 'Prefere turno com horário certo e uma tarefa de cada vez.',
        origin: 'Registro IEL — expectativa coletada em atendimento',
        sourceId: 'FONTE-IEL',
        updatedAt: dateBefore(130)
      }
    ],
    externalRefs: [
      { system: SYSTEM, account: ACCOUNT, id: 'EMPG-DEMO-CAND-9104' }
    ]
  }
];

/* ------------------------------------------------------------------ *
 * Candidaturas
 * ------------------------------------------------------------------ */

/**
 * As três já passaram por tudo: encaminhadas, entrevistadas, contratadas.
 * `referralStage` e `externalStage` são o que o reducer teria deixado depois
 * de `register-referral` e `manager-decision` — a base precisa parecer o
 * resultado das ações, não um estado que nenhuma ação produz.
 */
export const DEMO_ACOMPANHAMENTO_APPLICATIONS: Application[] = [
  {
    id: 'CAND-ACOMP-01',
    talentId: 'JULIA',
    jobId: JOB_ID,
    appliedAt: dateBefore(126),
    externalStage: 'entrevista-empresa',
    analysisStage: 'pronta-para-encaminhar',
    referralStage: 'interesse-em-entrevista',
    technicalMatch: 84,
    externalRef: { system: SYSTEM, account: ACCOUNT, id: 'EMPG-DEMO-APP-6611' }
  },
  {
    id: 'CAND-ACOMP-02',
    talentId: 'MARCOS',
    jobId: JOB_ID,
    appliedAt: dateBefore(125),
    externalStage: 'entrevista-empresa',
    analysisStage: 'pronta-para-encaminhar',
    referralStage: 'interesse-em-entrevista',
    technicalMatch: 71,
    externalRef: { system: SYSTEM, account: ACCOUNT, id: 'EMPG-DEMO-APP-6612' }
  },
  {
    id: 'CAND-ACOMP-03',
    talentId: 'RENATA',
    jobId: JOB_ID,
    appliedAt: dateBefore(124),
    externalStage: 'entrevista-empresa',
    analysisStage: 'pronta-para-encaminhar',
    referralStage: 'interesse-em-entrevista',
    technicalMatch: 77,
    externalRef: { system: SYSTEM, account: ACCOUNT, id: 'EMPG-DEMO-APP-6613' }
  },
  {
    id: 'CAND-ACOMP-04',
    talentId: 'DIEGO-CAMPOS',
    jobId: JOB_ID,
    appliedAt: dateBefore(128),
    externalStage: 'entrevista-empresa',
    analysisStage: 'pronta-para-encaminhar',
    referralStage: 'interesse-em-entrevista',
    technicalMatch: 79,
    externalRef: { system: SYSTEM, account: ACCOUNT, id: 'EMPG-DEMO-APP-6614' }
  }
];

/* ------------------------------------------------------------------ *
 * Respostas de fit
 * ------------------------------------------------------------------ */

type JeitoDeTrabalhar = Record<FitAxisId, number>;

/** As frases que a VAG-02 pergunta, a partir do perfil curado da empresa. */
function frasesDaVaga(): string[] {
  const perfil = calcularPerfilCultural(
    DEMO_CULTURE_ANSWERS.filter((answer) => answer.companyId === COMPANY_ID)
  );
  return escolherPerguntasDoCandidato(perfil).map(
    (pergunta) => pergunta.itemId
  );
}

const JEITOS: {
  applicationId: string;
  talentId: string;
  jeito: JeitoDeTrabalhar;
  ha: number;
}[] = [
  {
    // Júlia: procedimento definido, ritmo constante — aderente à vaga.
    applicationId: 'CAND-ACOMP-01',
    talentId: 'JULIA',
    jeito: {
      'orientacao-resultados': 4,
      inovacao: 3,
      'aprendizado-desenvolvimento': 3,
      'foco-cliente': 3,
      'etica-seguranca': 4,
      'execucao-ritmo': 4,
      'regras-decisao': 5,
      'interacao-convivencia': 3,
      'lideranca-autonomia': 3,
      'adaptacao-carreira': 3,
      'expectativas-futuras': 3
    },
    ha: 122
  },
  {
    // Marcos: espera acompanhamento no início; o resto alinhado.
    applicationId: 'CAND-ACOMP-02',
    talentId: 'MARCOS',
    jeito: {
      'orientacao-resultados': 4,
      inovacao: 3,
      'aprendizado-desenvolvimento': 4,
      'foco-cliente': 3,
      'etica-seguranca': 4,
      'execucao-ritmo': 4,
      'regras-decisao': 4,
      'interacao-convivencia': 4,
      'lideranca-autonomia': 2,
      'adaptacao-carreira': 3,
      'expectativas-futuras': 3
    },
    ha: 121
  },
  {
    // Renata: aderente no jeito de trabalhar. O que não deu foi o turno e
    // o transporte — coisa que nenhum questionário de fit mede.
    applicationId: 'CAND-ACOMP-03',
    talentId: 'RENATA',
    jeito: {
      'orientacao-resultados': 4,
      inovacao: 3,
      'aprendizado-desenvolvimento': 3,
      'foco-cliente': 4,
      'etica-seguranca': 5,
      'execucao-ritmo': 4,
      'regras-decisao': 4,
      'interacao-convivencia': 3,
      'lideranca-autonomia': 3,
      'adaptacao-carreira': 3,
      'expectativas-futuras': 3
    },
    ha: 120
  },
  {
    // Diego: ritmo constante e regra clara — o perfil que ficou.
    applicationId: 'CAND-ACOMP-04',
    talentId: 'DIEGO-CAMPOS',
    jeito: {
      'orientacao-resultados': 4,
      inovacao: 3,
      'aprendizado-desenvolvimento': 4,
      'foco-cliente': 3,
      'etica-seguranca': 4,
      'execucao-ritmo': 5,
      'regras-decisao': 4,
      'interacao-convivencia': 3,
      'lideranca-autonomia': 3,
      'adaptacao-carreira': 4,
      'expectativas-futuras': 4
    },
    ha: 124
  }
];

/** Gerador próprio: nada do que já existe muda de valor. */
const random = createRandom(20260922);

export const DEMO_ACOMPANHAMENTO_FIT_RESPONSES: CandidateFitResponse[] =
  JEITOS.map((entrada) => ({
    applicationId: entrada.applicationId,
    talentId: entrada.talentId,
    answers: responderQuestionario(
      frasesDaVaga(),
      { temas: entrada.jeito },
      random,
      0.4
    ),
    answeredAt: isoBefore(entrada.ha, '19:20'),
    consent: {
      acceptedAt: isoBefore(entrada.ha, '19:18'),
      version: CANDIDATE_CONSENT_VERSION
    }
  }));

/* ------------------------------------------------------------------ *
 * A remessa e o que a empresa respondeu
 * ------------------------------------------------------------------ */

/**
 * Id `REF-…`, e não `ENC-…`, para não colidir com a sequência que o reducer
 * gera ao vivo: `nextSequentialId('ENC', …)` só conta ids com aquele
 * prefixo, e a remessa do pitch continua sendo ENC-01.
 */
export const DEMO_REFERRALS: Referral[] = [
  {
    id: 'REF-01',
    jobId: JOB_ID,
    companyId: COMPANY_ID,
    message:
      'Segue a lista de quatro perfis para a vaga de Assistente de Estoque, com o resumo do que cada pessoa trouxe e o que vale confirmar na entrevista.',
    state: 'registrado',
    createdAt: isoBefore(REMESSA_HA_DIAS, '15:40'),
    items: [
      {
        applicationId: 'CAND-ACOMP-01',
        justification:
          'Conferência e organização de almoxarifado em distribuidora; procedimento definido é o que ela prefere.',
        sharedEvidenceIds: [],
        summary:
          'Júlia Ferreira — conferência de mercadorias e organização de almoxarifado.',
        attentionPoints: [],
        suggestedQuestions: ['Como era o inventário mensal na distribuidora?'],
        managerDecision: 'quero-entrevistar',
        managerNote: null,
        decidedAt: isoBefore(DECISAO_HA_DIAS, '09:10'),
        outcome: {
          hiring: 'contratou',
          hiringAt: isoBefore(CONTRATADA_HA_DIAS.JULIA, '11:05'),
          hiringReason: null,
          hiringNote: null,
          // A empresa clicou "contratei" e não voltou: nada sobre permanência.
          retention: 'pendente',
          retentionAt: null,
          retentionReason: null,
          retentionNote: null
        }
      },
      {
        applicationId: 'CAND-ACOMP-02',
        justification:
          'Recebimento com lançamento em sistema; espera acompanhamento no início, que a equipe confirmou ter.',
        sharedEvidenceIds: [],
        summary:
          'Marcos Vinícius Rocha — recebimento e expedição em supermercado.',
        attentionPoints: ['Prefere acompanhamento nas primeiras semanas.'],
        suggestedQuestions: [],
        managerDecision: 'quero-entrevistar',
        managerNote: null,
        decidedAt: isoBefore(DECISAO_HA_DIAS, '09:12'),
        outcome: {
          hiring: 'contratou',
          hiringAt: isoBefore(CONTRATADA_HA_DIAS.MARCOS, '16:30'),
          hiringReason: null,
          hiringNote: null,
          retention: 'pendente',
          retentionAt: null,
          retentionReason: null,
          retentionNote: null
        }
      },
      {
        applicationId: 'CAND-ACOMP-03',
        justification:
          'Controle de entrada e saída de materiais em planilha; horário comercial confirmado com a vaga.',
        sharedEvidenceIds: [],
        summary: 'Renata Guimarães — controle de materiais em obra e depósito.',
        attentionPoints: ['Depende de transporte público.'],
        suggestedQuestions: [],
        managerDecision: 'quero-entrevistar',
        managerNote: null,
        decidedAt: isoBefore(DECISAO_HA_DIAS, '09:15'),
        outcome: {
          hiring: 'contratou',
          hiringAt: isoBefore(CONTRATADA_HA_DIAS.RENATA, '14:00'),
          hiringReason: null,
          hiringNote: null,
          // A empresa não informou a saída. Quem contou foi a Renata.
          retention: 'pendente',
          retentionAt: null,
          retentionReason: null,
          retentionNote: null
        }
      },
      {
        applicationId: 'CAND-ACOMP-04',
        justification:
          'Expedição e conferência de carga em distribuidora; turno fixo e regra clara são o que ele procura.',
        sharedEvidenceIds: [],
        summary: 'Diego Arruda Campos — expedição e separação de pedidos.',
        attentionPoints: [],
        suggestedQuestions: [
          'Como era o fechamento do romaneio no fim do turno?'
        ],
        managerDecision: 'quero-entrevistar',
        managerNote: null,
        decidedAt: isoBefore(DECISAO_HA_DIAS, '09:40'),
        outcome: {
          hiring: 'contratou',
          hiringAt: isoBefore(CONTRATADA_HA_DIAS.DIEGO_CAMPOS, '10:20'),
          hiringReason: null,
          hiringNote: null,
          // Passou dos 90 dias e a empresa nunca voltou: quem contou que ele
          // ficou foi ele mesmo, nos três marcos.
          retention: 'pendente',
          retentionAt: null,
          retentionNote: null,
          retentionReason: null
        }
      }
    ]
  }
];

/* ------------------------------------------------------------------ *
 * O que as pessoas responderam
 * ------------------------------------------------------------------ */

/**
 * Ids `CHK-<candidatura>-<marco>`: é a chave natural do check-in (um por
 * marco por candidatura), e o reducer usa a mesma regra, então responder de
 * novo substitui em vez de acumular.
 */
export const DEMO_CHECK_INS: CheckIn[] = [
  {
    id: 'CHK-CAND-ACOMP-01-30',
    applicationId: 'CAND-ACOMP-01',
    talentId: 'JULIA',
    marco: 30,
    respondidoEm: isoBefore(CONTRATADA_HA_DIAS.JULIA - 31, '20:12'),
    continua: true,
    comoEstaSendo: 4,
    consentVersion: CHECK_IN_CONSENT_VERSION
  },
  {
    id: 'CHK-CAND-ACOMP-01-60',
    applicationId: 'CAND-ACOMP-01',
    talentId: 'JULIA',
    marco: 60,
    respondidoEm: isoBefore(CONTRATADA_HA_DIAS.JULIA - 60, '21:40'),
    continua: true,
    comoEstaSendo: 5,
    comentario: 'Já estou cuidando do inventário sozinha.',
    consentVersion: CHECK_IN_CONSENT_VERSION
  },
  {
    id: 'CHK-CAND-ACOMP-03-30',
    applicationId: 'CAND-ACOMP-03',
    talentId: 'RENATA',
    marco: 30,
    respondidoEm: isoBefore(CONTRATADA_HA_DIAS.RENATA - 33, '19:05'),
    continua: false,
    comoEstaSendo: 2,
    comentario: 'O turno mudou e não deu com o transporte.',
    consentVersion: CHECK_IN_CONSENT_VERSION
  },
  {
    id: 'CHK-CAND-ACOMP-04-30',
    applicationId: 'CAND-ACOMP-04',
    talentId: 'DIEGO-CAMPOS',
    marco: 30,
    respondidoEm: isoBefore(CONTRATADA_HA_DIAS.DIEGO_CAMPOS - 31, '19:30'),
    continua: true,
    comoEstaSendo: 4,
    consentVersion: CHECK_IN_CONSENT_VERSION
  },
  {
    id: 'CHK-CAND-ACOMP-04-60',
    applicationId: 'CAND-ACOMP-04',
    talentId: 'DIEGO-CAMPOS',
    marco: 60,
    respondidoEm: isoBefore(CONTRATADA_HA_DIAS.DIEGO_CAMPOS - 61, '20:05'),
    continua: true,
    comoEstaSendo: 4,
    consentVersion: CHECK_IN_CONSENT_VERSION
  },
  {
    id: 'CHK-CAND-ACOMP-04-90',
    applicationId: 'CAND-ACOMP-04',
    talentId: 'DIEGO-CAMPOS',
    marco: 90,
    respondidoEm: isoBefore(CONTRATADA_HA_DIAS.DIEGO_CAMPOS - 91, '21:15'),
    continua: true,
    comoEstaSendo: 5,
    comentario: 'Já fecho o romaneio sozinho e o turno é o combinado.',
    consentVersion: CHECK_IN_CONSENT_VERSION
  }
];
