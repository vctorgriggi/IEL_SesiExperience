/**
 * Volume gerado da base de demonstração.
 *
 * O enunciado do desafio cobra escala: "ampliar o volume de talentos e
 * oportunidades que podem ser avaliados" e "aplicação em diferentes volumes
 * de profissionais, empresas e oportunidades, evitando dependência de
 * processos individualizados". Com 8 talentos e 4 candidaturas numa vaga, o
 * analista não precisa de ferramenta nenhuma — ele lê os quatro currículos. O
 * produto só se justifica quando há candidaturas demais para ler uma a uma.
 *
 * Este arquivo produz esse volume em volta da base curada, sem tocá-la. Os 8
 * talentos, as 3 vagas e as 10 candidaturas do roteiro continuam idênticos e é
 * por eles que a demonstração passa; o que se gera aqui é o pano de fundo que
 * dá sentido a filtros, contadores, agrupamentos e triagem por lacuna.
 *
 * Tudo é determinístico: mesmo gerador, mesma semente, mesmas datas fixas
 * derivadas da data de referência. Nada de `Math.random()` nem `Date.now()`,
 * como o briefing exige — a base precisa ser idêntica a cada renderização e a
 * cada apresentação.
 */

import { CANDIDATE_CONSENT_VERSION } from '../analysis/candidate-questionnaire';
import {
  CULTURE_QUESTIONS,
  MIN_TEAM_RESPONSES,
  type CultureOptionValue
} from '../analysis/culture';
import { FIT_AXES, type FitAxisId } from '../analysis/fit-axes';
import type {
  AnalysisByApplication,
  Application,
  AxisWeight,
  CandidateFitResponse,
  Company,
  CriterionAnalysis,
  CriterionState,
  CultureAnswer,
  Evidence,
  ExternalStage,
  Job,
  JobCriterion,
  JobStage,
  Talent,
  TalentCultureAnswer,
  Team
} from '../types';
import { DEMO_REFERENCE_DATE } from './companies';
import { DEMO_JOBS } from './jobs';

/** Semente fixa: trocar este número muda toda a base gerada. */
const SEED = 20260914;

/** Gerador linear simples (mulberry32): determinístico e sem dependência. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)]!;
}

/** Data fixa, derivada da referência da base: nunca depende do relógio. */
function dateBefore(days: number): string {
  const reference = new Date(`${DEMO_REFERENCE_DATE}T12:00:00.000Z`);
  reference.setUTCDate(reference.getUTCDate() - days);
  return reference.toISOString().slice(0, 10);
}

const FIRST_NAMES = [
  'Adriana',
  'Alex',
  'Aline',
  'Amanda',
  'André',
  'Beatriz',
  'Bruno',
  'Camila',
  'Carlos',
  'Caroline',
  'Cristina',
  'Daniel',
  'Danilo',
  'Débora',
  'Eduardo',
  'Elaine',
  'Fabiana',
  'Felipe',
  'Fernanda',
  'Gabriel',
  'Geraldo',
  'Helena',
  'Heitor',
  'Igor',
  'Isabela',
  'Jaqueline',
  'Joana',
  'Joaquim',
  'Juliana',
  'Larissa',
  'Leandro',
  'Letícia',
  'Lucas',
  'Luciana',
  'Marcelo',
  'Márcia',
  'Mariana',
  'Mateus',
  'Natália',
  'Otávio',
  'Patrícia',
  'Paulo',
  'Rafaela',
  'Renato',
  'Roberta',
  'Rodrigo',
  'Sandra',
  'Sérgio',
  'Simone',
  'Tatiane',
  'Thiago',
  'Vanessa',
  'Vinícius',
  'Viviane',
  'Wesley'
] as const;

const LAST_NAMES = [
  'Almeida',
  'Andrade',
  'Barbosa',
  'Barros',
  'Batista',
  'Borges',
  'Campos',
  'Cardoso',
  'Carvalho',
  'Castro',
  'Cavalcante',
  'Correia',
  'Cunha',
  'Dias',
  'Duarte',
  'Faria',
  'Fernandes',
  'Ferreira',
  'Freitas',
  'Gomes',
  'Gonçalves',
  'Lima',
  'Lopes',
  'Machado',
  'Martins',
  'Medeiros',
  'Melo',
  'Moraes',
  'Moreira',
  'Nascimento',
  'Neves',
  'Nunes',
  'Oliveira',
  'Pacheco',
  'Pereira',
  'Pinheiro',
  'Ramos',
  'Rezende',
  'Ribeiro',
  'Rocha',
  'Rodrigues',
  'Sales',
  'Santana',
  'Siqueira',
  'Souza',
  'Teixeira',
  'Vieira',
  'Xavier'
] as const;

const CITIES = [
  'Goiânia, GO',
  'Anápolis, GO',
  'Aparecida de Goiânia, GO',
  'Trindade, GO',
  'Rio Verde, GO',
  'Campo Grande, MS',
  'Dourados, MS',
  'Três Lagoas, MS',
  'Uberlândia, MG',
  'Brasília, DF'
] as const;

const COMPANY_NAMES = [
  'Araguaia Metalurgia',
  'Bandeirante Alimentos',
  'Cristalina Embalagens',
  'Planalto Log',
  'Serra Dourada Têxtil',
  'Paranaíba Química',
  'Vale do Rio Claro Papel',
  'Aroeira Componentes',
  'Buriti Bebidas',
  'Ipê Amarelo Plásticos',
  'Jataí Máquinas',
  'Sucuri Transportes'
] as const;

const SECTORS = [
  'Metalurgia',
  'Alimentos',
  'Embalagens',
  'Logística',
  'Têxtil',
  'Química',
  'Papel e celulose',
  'Autopeças',
  'Bebidas',
  'Plásticos',
  'Máquinas',
  'Transporte'
] as const;

const JOB_TITLES = [
  'Assistente de Produção',
  'Auxiliar de Manutenção',
  'Analista de Qualidade',
  'Assistente de Compras',
  'Operador de Empilhadeira',
  'Auxiliar Financeiro',
  'Assistente de Expedição',
  'Técnico de Segurança do Trabalho',
  'Auxiliar de Almoxarifado',
  'Assistente de RH',
  'Analista de Processos',
  'Auxiliar de Laboratório',
  'Assistente Comercial',
  'Operador de Máquinas',
  'Auxiliar de Controle de Qualidade',
  'Assistente de Planejamento'
] as const;

const SHIFTS = [
  'Turno da manhã (6h às 14h)',
  'Turno da tarde (14h às 22h)',
  'Turno da noite (22h às 6h)',
  'Horário comercial (8h às 17h)'
] as const;

/** Critérios por dimensão, reaproveitados entre as vagas geradas. */
const CRITERION_POOL: {
  label: string;
  question: string;
  dimension: JobCriterion['dimension'];
}[] = [
  {
    label: 'Experiência na atividade principal',
    question: 'Há registro de experiência na atividade central da vaga?',
    dimension: 'tecnica'
  },
  {
    label: 'Uso de sistema ou planilha',
    question: 'Há registro de operação de sistema ou planilha na rotina?',
    dimension: 'tecnica'
  },
  {
    label: 'Formação exigida',
    question: 'A formação declarada atende ao requisito da vaga?',
    dimension: 'tecnica'
  },
  {
    label: 'Disponibilidade no turno',
    question: 'A disponibilidade declarada cobre o turno da vaga?',
    dimension: 'profissional'
  },
  {
    label: 'Interesse nas atividades',
    question: 'Existe interesse declarado nas atividades da vaga?',
    dimension: 'profissional'
  },
  {
    label: 'Expectativa de aprendizado',
    question: 'A expectativa de aprendizado é compatível com a rotina?',
    dimension: 'profissional'
  },
  {
    label: 'Apoio inicial',
    question: 'Há acompanhamento disponível nas primeiras atividades?',
    dimension: 'organizacional'
  },
  {
    label: 'Autonomia na execução',
    question: 'A rotina exige execução autônoma; há informação sobre isso?',
    dimension: 'organizacional'
  },
  {
    label: 'Comunicação de prioridades',
    question: 'A forma de comunicar prioridades está confirmada?',
    dimension: 'organizacional'
  }
];

const EXTERNAL_STAGES: ExternalStage[] = [
  'inscrito',
  'triagem',
  'analise-tecnica',
  'entrevista-empresa'
];

const JOB_STAGES: JobStage[] = ['aberta', 'em-selecao', 'encerrada'];

/**
 * Distribuição de estados. Pesada em alinhamento e lacuna porque é isso que o
 * analista precisa separar no volume: quem já tem base para análise e quem
 * ainda não tem.
 */
const STATE_POOL: CriterionState[] = [
  'alinhamento',
  'alinhamento',
  'alinhamento',
  'alinhamento',
  'a-esclarecer',
  'a-esclarecer',
  'sem-informacao',
  'sem-informacao',
  'sem-informacao',
  'divergencia'
];

const NOTE_BY_STATE: Record<CriterionState, string> = {
  alinhamento: 'Há registro na origem que sustenta a relação com o critério.',
  'a-esclarecer': 'A informação existe, mas a condição precisa ser confirmada.',
  divergencia: 'Duas origens registram informações que não coincidem.',
  'sem-informacao': 'Nenhum registro recebido sustenta este critério ainda.',
  'nao-se-aplica': 'Critério fora do escopo desta vaga.'
};

const EVIDENCE_TEMPLATES = [
  {
    sourceId: 'FONTE-EMPREGARE' as const,
    originLabel: 'Currículo — experiência declarada',
    nature: 'relato-do-candidato' as const,
    information: 'Atuou na rotina descrita na experiência anterior.'
  },
  {
    sourceId: 'FONTE-IEL' as const,
    originLabel: 'Registro IEL — expectativa coletada em atendimento',
    nature: 'registro-iel' as const,
    information: 'Expectativa profissional registrada em atendimento do IEL.'
  },
  {
    sourceId: 'FONTE-EMPRESA' as const,
    originLabel: 'Contexto da empresa — condição informada',
    nature: 'confirmado-pelo-gestor' as const,
    information: 'Condição de trabalho informada pela empresa para a equipe.'
  }
];

export type GeneratedBase = {
  companies: Company[];
  teams: Team[];
  jobs: Job[];
  talents: Talent[];
  applications: Application[];
  analysis: AnalysisByApplication;
  evidences: Evidence[];
  cultureAnswers: CultureAnswer[];
  talentCultureAnswers: TalentCultureAnswer[];
  fitResponses: CandidateFitResponse[];
};

/**
 * Proporção de candidaturas geradas que respondem o questionário de fit.
 *
 * R7 diz que quem não responde sai do processo, e o prazo é de 1 a 2 dias.
 * Taxa de resposta de 100% seria um pano de fundo que mente: a tela do
 * analista existe justamente para lidar com a fila em que parte das pessoas
 * não respondeu, e sem esse terço a coluna de aderência nunca mostraria uma
 * lacuna. O sorteio sai do mesmo gerador semeado — mesma base a cada carga.
 */
const FIT_RESPONSE_RATE = 0.7;

/** Quantas candidaturas geradas entram na vaga 1 do roteiro. */
const EXTRA_ON_SCRIPT_JOB = 86;

const GENERATED_COMPANY_COUNT = 12;
const JOBS_PER_COMPANY = 3;
const GENERATED_TALENT_COUNT = 260;

/**
 * Empresas leves: o resto da carteira do IEL.
 *
 * O Centro de Empregos atende mais de 2.500 indústrias, e a maioria não tem
 * vaga aberta nem consulta de cultura neste mês — é nome, setor, cidade e um
 * contato. Elas existem na base para que a navegação seja testada no volume
 * real: uma barra lateral que lista empresa por empresa não sobrevive a isso,
 * e a busca e as listas paginadas precisam provar que sobrevivem.
 *
 * O nome combina três listas: um prefixo regional de MT e GO, um ramo e o
 * sufixo que diz o setor. O sufixo decide o setor, para "Sinop Alimentos"
 * nunca aparecer como metalúrgica.
 */
const LIGHT_COMPANY_COUNT = 2485;

const LIGHT_NAME_PREFIXES = [
  'Cuiabá',
  'Rondonópolis',
  'Sinop',
  'Pantanal',
  'Cerrado',
  'Chapada',
  'Araguaia',
  'Xingu',
  'Teles Pires',
  'Juruena',
  'Serra Azul',
  'Planalto',
  'Anhanguera',
  'Pirineus',
  'Meia Ponte',
  'Caldas',
  'Rio Verde',
  'Jataí',
  'Buriti',
  'Pequi',
  'Jatobá',
  'Tuiuiú',
  'Guariroba',
  'Cambará',
  'Aroeira',
  'Paranaíba',
  'Corumbá',
  'Veredas',
  'Serra Dourada',
  'Vale do Guaporé'
] as const;

const LIGHT_NAME_MIDDLES = [
  '',
  'Agro',
  'Nova',
  'Central',
  'Forte',
  'Real',
  'Brasil',
  'Norte',
  'Sul',
  'Ouro',
  'Verde',
  'União'
] as const;

/** Sufixo do nome e o setor que ele declara. */
const LIGHT_SECTORS: { suffix: string; sector: string }[] = [
  { suffix: 'Alimentos', sector: 'Alimentos' },
  { suffix: 'Carnes', sector: 'Frigorífico' },
  { suffix: 'Laticínios', sector: 'Laticínios' },
  { suffix: 'Grãos', sector: 'Grãos e óleos vegetais' },
  { suffix: 'Bioenergia', sector: 'Etanol e bioenergia' },
  { suffix: 'Metalurgia', sector: 'Metalurgia' },
  { suffix: 'Embalagens', sector: 'Embalagens' },
  { suffix: 'Logística', sector: 'Logística' },
  { suffix: 'Têxtil', sector: 'Têxtil e confecção' },
  { suffix: 'Construções', sector: 'Construção civil' },
  { suffix: 'Madeiras', sector: 'Madeira e móveis' },
  { suffix: 'Fertilizantes', sector: 'Química e fertilizantes' },
  { suffix: 'Mineração', sector: 'Mineração' },
  { suffix: 'Farma', sector: 'Farmacêutica' },
  { suffix: 'Bebidas', sector: 'Bebidas' },
  { suffix: 'Plásticos', sector: 'Plásticos' },
  { suffix: 'Couros', sector: 'Couro e calçados' },
  { suffix: 'Implementos', sector: 'Máquinas e implementos agrícolas' }
];

const LIGHT_CITIES = [
  'Cuiabá, MT',
  'Várzea Grande, MT',
  'Rondonópolis, MT',
  'Sinop, MT',
  'Tangará da Serra, MT',
  'Cáceres, MT',
  'Sorriso, MT',
  'Lucas do Rio Verde, MT',
  'Primavera do Leste, MT',
  'Barra do Garças, MT',
  'Nova Mutum, MT',
  'Campo Verde, MT',
  'Alta Floresta, MT',
  'Goiânia, GO',
  'Aparecida de Goiânia, GO',
  'Anápolis, GO',
  'Rio Verde, GO',
  'Jataí, GO',
  'Catalão, GO',
  'Itumbiara, GO',
  'Luziânia, GO',
  'Senador Canedo, GO',
  'Trindade, GO',
  'Formosa, GO',
  'Mineiros, GO',
  'Goianésia, GO'
] as const;

/**
 * Gera as empresas leves.
 *
 * Roda depois de todo o resto e consome o mesmo gerador semeado: as 12
 * empresas com vaga, as pessoas e as candidaturas continuam idênticas ao que
 * eram antes deste volume existir.
 */
function buildLightCompanies(random: () => number, firstIndex: number) {
  const companies: Company[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < LIGHT_COMPANY_COUNT; i += 1) {
    const companyId = `GEN-EMP-${String(firstIndex + i).padStart(4, '0')}`;

    // Sorteia até achar um nome livre; o espaço de combinações é mais que o
    // dobro da carteira, então a repetição é rara e o laço, curto.
    let name = '';
    let sector = '';
    do {
      const prefix = pick(random, LIGHT_NAME_PREFIXES);
      const middle = pick(random, LIGHT_NAME_MIDDLES);
      const entry = pick(random, LIGHT_SECTORS);
      name = [prefix, middle, entry.suffix].filter(Boolean).join(' ');
      sector = entry.sector;
    } while (usedNames.has(name));
    usedNames.add(name);

    companies.push({
      id: companyId,
      name,
      sector,
      location: pick(random, LIGHT_CITIES),
      institutionalDescription:
        'Empresa da carteira do IEL na base de demonstração, sem vaga aberta neste mês. A descrição institucional é fictícia.',
      contactName: `${pick(random, FIRST_NAMES)} ${pick(random, LAST_NAMES)}`,
      contactEmail: `contato.${companyId.toLowerCase()}@example.com`,
      sourceId: 'FONTE-EMPRESA',
      updatedAt: dateBefore(20 + Math.floor(random() * 300)),
      cultureSuggestions: []
    });
  }

  return companies;
}

/**
 * Pesos por eixo para uma vaga do pano de fundo.
 *
 * Não são aleatórios a cada render: saem do mesmo gerador semeado das demais
 * decisões da base. A distribuição deixa o peso alto minoritário de propósito
 * — se toda vaga priorizasse todos os eixos, a prioridade não separaria nada
 * e as telas de triagem por prontidão ficariam sem contraste.
 */
function buildAxisWeights(
  random: () => number
): Partial<Record<FitAxisId, AxisWeight>> {
  const weights: Partial<Record<FitAxisId, AxisWeight>> = {};
  for (const axis of FIT_AXES) {
    const draw = random();
    weights[axis.id] = draw > 0.75 ? 'alto' : draw > 0.3 ? 'medio' : 'baixo';
  }
  return weights;
}

function buildCriteria(jobId: string, random: () => number): JobCriterion[] {
  const count = 6 + Math.floor(random() * 3);
  return CRITERION_POOL.slice(0, count).map((entry, index) => ({
    id: `${jobId}-CRI-${index + 1}`,
    label: entry.label,
    question: entry.question,
    dimension: entry.dimension,
    required: index < 2,
    confirmedBy: index % 2 === 0 ? 'Descrição da vaga' : 'Gestor da equipe'
  }));
}

/**
 * Monta o pano de fundo. Chamada uma única vez e memoizada: a geração é pura,
 * mas percorrer centenas de candidaturas a cada render seria desperdício.
 */
function build(): GeneratedBase {
  const random = createRandom(SEED);

  const companies: Company[] = [];
  const teams: Team[] = [];
  const jobs: Job[] = [];
  const talents: Talent[] = [];
  const applications: Application[] = [];
  const analysis: AnalysisByApplication = {};
  const evidences: Evidence[] = [];
  const fitResponses: CandidateFitResponse[] = [];

  for (let c = 0; c < GENERATED_COMPANY_COUNT; c += 1) {
    const companyId = `GEN-EMP-${String(c + 1).padStart(2, '0')}`;
    const name = COMPANY_NAMES[c % COMPANY_NAMES.length]!;
    const city = pick(random, CITIES);

    companies.push({
      id: companyId,
      name,
      sector: SECTORS[c % SECTORS.length]!,
      location: city,
      institutionalDescription:
        'Empresa atendida pelo IEL na base de demonstração. A descrição institucional é fictícia.',
      contactName: `${pick(random, FIRST_NAMES)} ${pick(random, LAST_NAMES)}`,
      contactEmail: `contato.${companyId.toLowerCase()}@example.com`,
      sourceId: 'FONTE-EMPRESA',
      updatedAt: dateBefore(12 + (c % 40)),
      cultureSuggestions: []
    });

    const teamId = `GEN-EQP-${String(c + 1).padStart(2, '0')}`;
    teams.push({
      id: teamId,
      companyId,
      name: `Equipe de operação — ${name}`,
      routine: 'Rotina operacional informada pela empresa na base demo.',
      managerName: `${pick(random, FIRST_NAMES)} ${pick(random, LAST_NAMES)}`,
      managerEmail: `gestor.${companyId.toLowerCase()}@example.com`,
      conditions: [
        {
          id: `${teamId}-CND-1`,
          label: 'Acompanhamento inicial',
          value:
            random() > 0.5
              ? 'Há colega de referência nas primeiras semanas.'
              : 'Não há acompanhamento dedicado no turno.',
          status: random() > 0.4 ? 'confirmado' : 'a-confirmar',
          origin: 'Contexto da empresa — demonstração',
          updatedAt: dateBefore(10 + (c % 30))
        }
      ]
    });

    for (let j = 0; j < JOBS_PER_COMPANY; j += 1) {
      const jobId = `GEN-VAG-${String(c + 1).padStart(2, '0')}-${j + 1}`;
      jobs.push({
        id: jobId,
        title: pick(random, JOB_TITLES),
        companyId,
        teamId,
        location: city,
        stage: JOB_STAGES[Math.floor(random() * JOB_STAGES.length)]!,
        workShift: pick(random, SHIFTS),
        summary:
          'Vaga da base de demonstração, usada para dar volume aos filtros e contadores.',
        essentialRequirements: [
          'Experiência na atividade principal',
          'Disponibilidade no turno informado'
        ],
        organizationalContext:
          'Contexto organizacional informado pela empresa na base demo.',
        criteria: buildCriteria(jobId, random),
        axisWeights: buildAxisWeights(random),
        // O pano de fundo não traz proposta assistida: ela é um trecho real de
        // um texto real, e inventar citação para centenas de vagas fictícias
        // encheria a base de evidência sem lastro.
        axisWeightSuggestions: [],
        externalRef: {
          system: 'Empregare — demonstração',
          account: `ACC-${companyId}`,
          id: `EMPG-DEMO-${jobId}`
        },
        updatedAt: dateBefore(1 + Math.floor(random() * 40))
      });
    }
  }

  for (let t = 0; t < GENERATED_TALENT_COUNT; t += 1) {
    const id = `GEN-TAL-${String(t + 1).padStart(3, '0')}`;
    const first = pick(random, FIRST_NAMES);
    const last = pick(random, LAST_NAMES);
    talents.push({
      id,
      name: `${first} ${last}`,
      headline: pick(random, JOB_TITLES),
      summary:
        'Perfil da base de demonstração, com experiência declarada no sistema de origem.',
      city: pick(random, CITIES),
      email: `${first.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}.${id.toLowerCase()}@example.com`,
      experiences: [
        {
          id: `${id}-EXP-1`,
          role: pick(random, JOB_TITLES),
          organization: pick(random, COMPANY_NAMES),
          period: 'jan/2023 — fev/2026',
          activities:
            'Rotina operacional declarada no currículo recebido da origem.'
        }
      ],
      declaredSkills: ['Rotina operacional', 'Organização de registros'],
      expectations: ['Estabilidade', 'Aprender a rotina da área'],
      preferences: [],
      externalRefs: [
        {
          system: 'Empregare — demonstração',
          account: 'ACC-IEL',
          id: `EMPG-DEMO-CAND-${id}`
        }
      ]
    });
  }

  let applicationSeq = 0;

  function addApplication(talentId: string, job: Job, dayOffset: number) {
    applicationSeq += 1;
    const applicationId = `GEN-APP-${String(applicationSeq).padStart(4, '0')}`;

    applications.push({
      id: applicationId,
      talentId,
      jobId: job.id,
      appliedAt: dateBefore(dayOffset),
      externalStage:
        EXTERNAL_STAGES[Math.floor(random() * EXTERNAL_STAGES.length)]!,
      analysisStage: random() > 0.7 ? 'em-andamento' : 'nao-iniciada',
      referralStage: 'nao-encaminhada',
      // Faixa 30..95: a planilha do Empregare não traz zero nem 100 na
      // prática, e uma faixa larga é o que faz o técnico e a aderência
      // discordarem em alguns casos — que é o que a mesa precisa mostrar.
      technicalMatch: 30 + Math.floor(random() * 66),
      externalRef: {
        system: 'Empregare — demonstração',
        account: 'ACC-IEL',
        id: `EMPG-DEMO-APP-${applicationId}`
      }
    });

    if (random() < FIT_RESPONSE_RATE) {
      const answers = {} as Record<FitAxisId, CultureOptionValue>;
      for (const axis of FIT_AXES) {
        answers[axis.id] = (1 + Math.floor(random() * 3)) as CultureOptionValue;
      }
      const answeredAt = `${dateBefore(Math.max(dayOffset - 1, 0))}T12:00:00.000Z`;
      fitResponses.push({
        applicationId,
        answers,
        answeredAt,
        // O aceite existe também no pano de fundo: uma resposta sem aceite
        // seria tratamento sem base legal, inclusive em base fictícia.
        consent: { acceptedAt: answeredAt, version: CANDIDATE_CONSENT_VERSION }
      });
    }

    const byCriterion: Record<string, CriterionAnalysis> = {};

    for (const criterion of job.criteria) {
      const state = STATE_POOL[Math.floor(random() * STATE_POOL.length)]!;
      const evidenceIds: string[] = [];

      if (state !== 'sem-informacao' && state !== 'nao-se-aplica') {
        const template =
          EVIDENCE_TEMPLATES[Math.floor(random() * EVIDENCE_TEMPLATES.length)]!;
        const evidenceId = `GEN-EVD-${applicationId}-${criterion.id}`;
        evidences.push({
          id: evidenceId,
          talentId,
          teamId: null,
          information: template.information,
          sourceId: template.sourceId,
          originLabel: template.originLabel,
          nature: template.nature,
          updatedAt: dateBefore(5 + Math.floor(random() * 50)),
          visibility: 'compartilhavel',
          links: [{ jobId: job.id, criterionId: criterion.id }],
          interpretation:
            'Registro recebido da origem, ainda sem verificação prática.'
        });
        evidenceIds.push(evidenceId);
      }

      byCriterion[criterion.id] = {
        state,
        note: NOTE_BY_STATE[state],
        evidenceIds
      };
    }

    analysis[applicationId] = byCriterion;
  }

  let talentCursor = 0;

  // Volume na vaga do roteiro: é onde a escala precisa ser sentida. As 4
  // candidaturas curadas continuam lá; estas entram em volta delas.
  const scriptJob = DEMO_JOBS.find((job) => job.id === 'VAG-01');
  if (scriptJob) {
    for (let i = 0; i < EXTRA_ON_SCRIPT_JOB; i += 1) {
      const talent = talents[talentCursor % talents.length]!;
      talentCursor += 1;
      addApplication(talent.id, scriptJob, 2 + Math.floor(random() * 45));
    }
  }

  for (const job of jobs) {
    const count = 8 + Math.floor(random() * 14);
    for (let i = 0; i < count; i += 1) {
      const talent = talents[talentCursor % talents.length]!;
      talentCursor += 1;
      addApplication(talent.id, job, 2 + Math.floor(random() * 60));
    }
  }

  // Por último, de propósito: ver `buildLightCompanies`.
  companies.push(...buildLightCompanies(random, GENERATED_COMPANY_COUNT + 1));

  return {
    companies,
    teams,
    jobs,
    talents,
    applications,
    analysis,
    evidences,
    fitResponses,
    // Só as empresas com vaga têm consulta à equipe. As ~2.500 empresas leves
    // da carteira não têm consulta por definição; gerar respostas para elas
    // faria cada uma aparecer como "perfil aberto" na fila do dia.
    ...buildCultureAnswers(
      companies.filter((company) =>
        jobs.some((job) => job.companyId === company.id)
      ),
      talents
    )
  };
}

/**
 * Semente própria: as respostas culturais são geradas fora dos laços acima
 * para que acrescentá-las não desloque a sequência do gerador principal e
 * mude nomes, etapas e datas de toda a base existente.
 */
const SEED_CULTURA = 20260921;

/** Um talento a cada quatro responde: o mapa mostra a paisagem sem virar borrão. */
const TALENTOS_POR_RESPOSTA_CULTURAL = 4;

function buildCultureAnswers(
  companies: Company[],
  talents: Talent[]
): Pick<GeneratedBase, 'cultureAnswers' | 'talentCultureAnswers'> {
  const random = createRandom(SEED_CULTURA);
  const cultureAnswers: CultureAnswer[] = [];
  const talentCultureAnswers: TalentCultureAnswer[] = [];

  companies.forEach((company, indice) => {
    for (const question of CULTURE_QUESTIONS) {
      const daGestao = pick(random, question.options).id;
      cultureAnswers.push({
        id: `GEN-CUL-${company.id}-${question.axisId}-GES`,
        companyId: company.id,
        axisId: question.axisId,
        optionId: daGestao,
        respondent: 'gestao',
        count: 1,
        answeredAt: dateBefore(20 + (indice % 25))
      });

      // Uma parte das equipes responde diferente da gestão, e outra parte não
      // alcança o mínimo de respostas: são os dois casos que a tela precisa
      // saber mostrar, e uma base só convergente nunca os exercitaria.
      const daEquipe =
        random() > 0.7 ? pick(random, question.options).id : daGestao;
      const respostasDaEquipe =
        random() > 0.85
          ? MIN_TEAM_RESPONSES - 1
          : MIN_TEAM_RESPONSES + Math.floor(random() * 5);

      cultureAnswers.push({
        id: `GEN-CUL-${company.id}-${question.axisId}-EQP`,
        companyId: company.id,
        axisId: question.axisId,
        optionId: daEquipe,
        respondent: 'equipe',
        count: respostasDaEquipe,
        answeredAt: dateBefore(16 + (indice % 20))
      });
    }
  });

  talents.forEach((talent, indice) => {
    if (indice % TALENTOS_POR_RESPOSTA_CULTURAL !== 0) return;

    const quantidade =
      2 + Math.floor(random() * (CULTURE_QUESTIONS.length - 1));
    for (const question of CULTURE_QUESTIONS.slice(0, quantidade)) {
      talentCultureAnswers.push({
        id: `GEN-CULT-${talent.id}-${question.axisId}`,
        talentId: talent.id,
        axisId: question.axisId,
        optionId: pick(random, question.options).id,
        origin: 'Currículo — informação declarada na inscrição',
        sourceId: 'FONTE-EMPREGARE',
        updatedAt: dateBefore(10 + (indice % 40))
      });
    }
  });

  return { cultureAnswers, talentCultureAnswers };
}

let cache: GeneratedBase | null = null;

/** Base gerada, construída uma vez por processo. */
export function getGeneratedBase(): GeneratedBase {
  cache ??= build();
  return cache;
}

export {
  EXTRA_ON_SCRIPT_JOB,
  GENERATED_COMPANY_COUNT,
  GENERATED_TALENT_COUNT,
  LIGHT_COMPANY_COUNT
};
