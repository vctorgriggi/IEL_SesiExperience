import {
  CANDIDATE_CONSENT_VERSION,
  CANDIDATE_CONSENT_VERSION_ANTERIOR
} from '../analysis/candidate-questionnaire';
import {
  calcularPerfilCultural,
  escolherPerguntasDoCandidato
} from '../analysis/culture';
import type { FitAxisId } from '../analysis/fit-axes';
import type {
  AnalysisByApplication,
  Application,
  CandidateFitResponse
} from '../types';
import { DEMO_CULTURE_ANSWERS } from './culture';
import { DEMO_JOBS } from './jobs';
import { createRandom, responderQuestionario } from './respostas-sinteticas';

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
    technicalMatch: 82,
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
    technicalMatch: 76,
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
    technicalMatch: 64,
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
    technicalMatch: 71,
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
    technicalMatch: 88,
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
    technicalMatch: 79,
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
    technicalMatch: 45,
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
    technicalMatch: 58,
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
    technicalMatch: 66,
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
    technicalMatch: 52,
    externalRef: {
      system: 'Empregare — demonstração',
      account: 'Oficina Pantanal',
      id: 'EMPG-DEMO-APP-7703'
    }
  },
  /*
   * As quatro candidaturas abaixo existem para a resposta reaproveitada
   * aparecer na demonstração. Sem elas, a regra dos 12 meses seria só código:
   * ninguém na base chegaria a uma candidatura nova com resposta válida, e a
   * cena que o cliente descreveu — a mesma pessoa se candidatando a várias
   * vagas — não teria onde acontecer.
   *
   * A vaga 4 é da Cerrado Distribuição (EMP-01), a mesma da vaga 1: as frases
   * que uma empresa escolhe saem do perfil dela, então duas vagas da mesma
   * empresa perguntam as mesmas 10 frases. É o que torna o reaproveitamento
   * total possível de mostrar.
   */
  {
    // Ana já respondeu as 10 frases da Cerrado em 05/09 (CAND-01). Aqui ela
    // não tem nada a responder: é a tela "suas respostas ainda valem".
    id: 'CAND-11',
    talentId: 'ANA',
    jobId: 'VAG-04',
    appliedAt: '2026-09-13',
    externalStage: 'inscrito',
    analysisStage: 'nao-iniciada',
    referralStage: 'nao-encaminhada',
    technicalMatch: 74,
    externalRef: {
      system: 'Empregare — demonstração',
      account: 'Cerrado Distribuição',
      id: 'EMPG-DEMO-APP-5511'
    }
  },
  {
    // Fábio respondeu na Horizonte (CAND-07), outra empresa: das 10 frases da
    // Cerrado, 3 coincidem. Reaproveitamento parcial — o caso comum.
    id: 'CAND-12',
    talentId: 'FABIO',
    jobId: 'VAG-04',
    appliedAt: '2026-09-12',
    externalStage: 'inscrito',
    analysisStage: 'nao-iniciada',
    referralStage: 'nao-encaminhada',
    technicalMatch: 51,
    externalRef: {
      system: 'Empregare — demonstração',
      account: 'Cerrado Distribuição',
      id: 'EMPG-DEMO-APP-5512'
    }
  },
  {
    // Hugo numa vaga da mesma empresa no ano passado, já encerrada. É a
    // resposta que vence: julho de 2025 passou dos 12 meses.
    id: 'CAND-13',
    talentId: 'HUGO',
    jobId: 'VAG-05',
    appliedAt: '2025-07-08',
    externalStage: 'inscrito',
    analysisStage: 'nao-iniciada',
    referralStage: 'nao-avancou',
    technicalMatch: 49,
    externalRef: {
      system: 'Empregare — demonstração',
      account: 'Cerrado Distribuição',
      id: 'EMPG-DEMO-APP-5405'
    }
  },
  {
    // O outro caminho: Hugo volta à mesma empresa um ano depois e responde
    // tudo de novo, porque o que ele respondeu em 2025 deixou de ser usado.
    id: 'CAND-14',
    talentId: 'HUGO',
    jobId: 'VAG-04',
    appliedAt: '2026-09-13',
    externalStage: 'inscrito',
    analysisStage: 'nao-iniciada',
    referralStage: 'nao-encaminhada',
    technicalMatch: 55,
    externalRef: {
      system: 'Empregare — demonstração',
      account: 'Cerrado Distribuição',
      id: 'EMPG-DEMO-APP-5513'
    }
  }
];

/**
 * Estado inicial da análise, definido previamente critério por critério.
 * Nenhum valor é calculado por sorteio: cada estado tem nota e evidências.
 */
/**
 * Respostas de fit das candidaturas curadas (M3, R4).
 *
 * Cada pessoa tem um jeito de trabalhar declarado por tema (1..5, no sentido
 * do tema) e responde as 10 frases que a empresa da vaga escolheu para ela
 * (`escolherPerguntasDoCandidato` sobre o perfil curado). As histórias do
 * roteiro estão nos valores: Ana espera acompanhamento nas primeiras semanas
 * e a equipe da Cerrado se organiza sozinha — a aderência dela cai
 * justamente em "Autonomia", o tema em que gestão e equipe da Cerrado também
 * divergem. Bruno, que prefere organizar o próprio trabalho, sobe pelo mesmo
 * motivo. Fábio espera treinamento formal e a Horizonte é de acompanhamento
 * e procedimento: técnico baixo e aderência alta, o caso de resgate da R10.
 *
 * O aceite acompanha cada resposta, com data e versão do texto — sem ele não
 * há base legal para a resposta existir (LGPD, art. 7º, I). Nenhuma resposta
 * carrega empresa: R5.
 */
type JeitoDeTrabalhar = Record<FitAxisId, number>;

const ANA: JeitoDeTrabalhar = {
  'orientacao-resultados': 4,
  inovacao: 4,
  'aprendizado-desenvolvimento': 3,
  'foco-cliente': 4,
  'etica-seguranca': 4,
  'execucao-ritmo': 4,
  'regras-decisao': 4,
  'interacao-convivencia': 3,
  'lideranca-autonomia': 1,
  'adaptacao-carreira': 3
};

const RESPOSTAS_CURADAS: {
  applicationId: string;
  jobId: string;
  jeito: JeitoDeTrabalhar;
  answeredAt: string;
  acceptedAt: string;
  /** Versão do aceite, quando não for a vigente (respostas antigas). */
  consentVersion?: string;
}[] = [
  {
    // Ana: espera acompanhamento no início e uma tarefa de cada vez.
    applicationId: 'CAND-01',
    jobId: 'VAG-01',
    jeito: ANA,
    answeredAt: '2026-09-05T14:10:00.000Z',
    acceptedAt: '2026-09-05T14:08:00.000Z'
  },
  {
    // Bruno: organiza o próprio trabalho e alterna demandas sem problema.
    applicationId: 'CAND-02',
    jobId: 'VAG-01',
    jeito: {
      'orientacao-resultados': 3,
      inovacao: 3,
      'aprendizado-desenvolvimento': 4,
      'foco-cliente': 3,
      'etica-seguranca': 3,
      'execucao-ritmo': 2,
      'regras-decisao': 3,
      'interacao-convivencia': 4,
      'lideranca-autonomia': 5,
      'adaptacao-carreira': 3
    },
    answeredAt: '2026-09-04T19:30:00.000Z',
    acceptedAt: '2026-09-04T19:28:00.000Z'
  },
  {
    // Carla: quer aprender controle de materiais e trabalha bem com lista.
    applicationId: 'CAND-03',
    jobId: 'VAG-01',
    jeito: {
      'orientacao-resultados': 4,
      inovacao: 3,
      'aprendizado-desenvolvimento': 5,
      'foco-cliente': 3,
      'etica-seguranca': 4,
      'execucao-ritmo': 3,
      'regras-decisao': 4,
      'interacao-convivencia': 2,
      'lideranca-autonomia': 3,
      'adaptacao-carreira': 4
    },
    answeredAt: '2026-09-06T08:45:00.000Z',
    acceptedAt: '2026-09-06T08:44:00.000Z'
  },
  {
    // Diego: disponibilidade negociável — o ponto do esclarecimento ESC-02.
    applicationId: 'CAND-04',
    jobId: 'VAG-01',
    jeito: {
      'orientacao-resultados': 3,
      inovacao: 3,
      'aprendizado-desenvolvimento': 3,
      'foco-cliente': 3,
      'etica-seguranca': 3,
      'execucao-ritmo': 3,
      'regras-decisao': 3,
      'interacao-convivencia': 3,
      'lideranca-autonomia': 3,
      'adaptacao-carreira': 4
    },
    answeredAt: '2026-09-02T21:05:00.000Z',
    acceptedAt: '2026-09-02T21:02:00.000Z'
  },
  {
    // Ana na vaga 2: mesma pessoa, outra candidatura, outro registro (R4).
    applicationId: 'CAND-05',
    jobId: 'VAG-02',
    jeito: ANA,
    answeredAt: '2026-07-02T13:20:00.000Z',
    acceptedAt: '2026-07-02T13:18:00.000Z'
  },
  {
    // Elisa: procedimento definido e combinados por escrito.
    applicationId: 'CAND-06',
    jobId: 'VAG-02',
    jeito: {
      'orientacao-resultados': 5,
      inovacao: 4,
      'aprendizado-desenvolvimento': 3,
      'foco-cliente': 3,
      'etica-seguranca': 4,
      'execucao-ritmo': 4,
      'regras-decisao': 5,
      'interacao-convivencia': 2,
      'lideranca-autonomia': 3,
      'adaptacao-carreira': 3
    },
    answeredAt: '2026-08-28T17:40:00.000Z',
    acceptedAt: '2026-08-28T17:38:00.000Z'
  },
  {
    // Fábio: espera treinamento formal antes de assumir a rotina. Match
    // técnico baixo e aderência alta — é o caso de resgate da dor R10.
    applicationId: 'CAND-07',
    jobId: 'VAG-02',
    jeito: {
      'orientacao-resultados': 4.5,
      inovacao: 4,
      'aprendizado-desenvolvimento': 3,
      'foco-cliente': 3.5,
      'etica-seguranca': 4,
      'execucao-ritmo': 4,
      'regras-decisao': 4.5,
      'interacao-convivencia': 3,
      'lideranca-autonomia': 1.5,
      'adaptacao-carreira': 3.5
    },
    answeredAt: '2026-09-01T09:15:00.000Z',
    acceptedAt: '2026-09-01T09:12:00.000Z'
  },
  {
    // Carla na vaga 3: candidatura própria, resposta própria.
    applicationId: 'CAND-08',
    jobId: 'VAG-03',
    jeito: {
      'orientacao-resultados': 4,
      inovacao: 3,
      'aprendizado-desenvolvimento': 5,
      'foco-cliente': 3,
      'etica-seguranca': 4,
      'execucao-ritmo': 3,
      'regras-decisao': 4,
      'interacao-convivencia': 2,
      'lideranca-autonomia': 3,
      'adaptacao-carreira': 4
    },
    answeredAt: '2026-09-06T08:52:00.000Z',
    acceptedAt: '2026-09-06T08:51:00.000Z'
  },
  {
    // Gabriela: autonomia depois do período inicial, prioridades por escrito.
    applicationId: 'CAND-09',
    jobId: 'VAG-03',
    jeito: {
      'orientacao-resultados': 4,
      inovacao: 3,
      'aprendizado-desenvolvimento': 4,
      'foco-cliente': 3,
      'etica-seguranca': 4,
      'execucao-ritmo': 4,
      'regras-decisao': 3,
      'interacao-convivencia': 2,
      'lideranca-autonomia': 4,
      'adaptacao-carreira': 4
    },
    answeredAt: '2026-09-07T11:00:00.000Z',
    acceptedAt: '2026-09-07T10:58:00.000Z'
  },
  {
    // Hugo na vaga encerrada de 2025: resposta vencida. Mais de 12 meses
    // depois, ela deixa de ser usada — nem na candidatura em que foi dada.
    // O aceite dela é o texto anterior, que nem previa reaproveitamento: é
    // por isso que `consentVersion` é declarado aqui, e não herdado.
    applicationId: 'CAND-13',
    jobId: 'VAG-05',
    jeito: {
      'orientacao-resultados': 3,
      inovacao: 2,
      'aprendizado-desenvolvimento': 3,
      'foco-cliente': 3,
      'etica-seguranca': 4,
      'execucao-ritmo': 3,
      'regras-decisao': 4,
      'interacao-convivencia': 3,
      'lideranca-autonomia': 2,
      'adaptacao-carreira': 3
    },
    answeredAt: '2025-07-08T15:20:00.000Z',
    acceptedAt: '2025-07-08T15:18:00.000Z',
    consentVersion: CANDIDATE_CONSENT_VERSION_ANTERIOR
  }
  // CAND-10 (Hugo) fica sem resposta de propósito: a mesa de seleção precisa
  // mostrar como é uma candidatura sem fit medido — R7, quem não responde
  // sai do processo, mas sai por decisão do analista, não por sumiço.
  //
  // CAND-11, CAND-12 e CAND-14 também ficam sem resposta, por outro motivo:
  // são as candidaturas que chegam à tela do questionário para mostrar o
  // reaproveitamento (total, parcial e vencido). Se já tivessem resposta, não
  // haveria o que demonstrar.
];

/** As frases que cada vaga curada pergunta, a partir do perfil curado. */
function frasesDaVaga(jobId: string): string[] {
  const companyId = DEMO_JOBS.find((job) => job.id === jobId)?.companyId;
  const perfil = calcularPerfilCultural(
    DEMO_CULTURE_ANSWERS.filter((answer) => answer.companyId === companyId)
  );
  return escolherPerguntasDoCandidato(perfil).map(
    (pergunta) => pergunta.itemId
  );
}

const random = createRandom(20260920);

/** Quem respondeu cada candidatura curada: a resposta é da pessoa. */
const TALENTO_DA_CANDIDATURA = new Map(
  DEMO_APPLICATIONS.map((application) => [application.id, application.talentId])
);

export const DEMO_FIT_RESPONSES: CandidateFitResponse[] = RESPOSTAS_CURADAS.map(
  (resposta) => ({
    applicationId: resposta.applicationId,
    talentId: TALENTO_DA_CANDIDATURA.get(resposta.applicationId) ?? '',
    answers: responderQuestionario(
      frasesDaVaga(resposta.jobId),
      { temas: resposta.jeito },
      random,
      0.4
    ),
    answeredAt: resposta.answeredAt,
    consent: {
      acceptedAt: resposta.acceptedAt,
      version: resposta.consentVersion ?? CANDIDATE_CONSENT_VERSION
    }
  })
);

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
