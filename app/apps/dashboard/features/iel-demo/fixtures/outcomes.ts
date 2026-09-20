/**
 * Histórico simulado de resultados: o que aconteceu depois do envio.
 *
 * A base viva (`generated.ts` e o núcleo curado) descreve o agora: vagas
 * abertas, candidaturas e respostas de fit. Os indicadores que a diretoria do
 * IEL acompanha — retorno das empresas, permanência aos 90 dias, vagas
 * reabertas — só existem olhando para trás, e o critério de sucesso do MVP é
 * justamente um deles: "queda no número de vagas reabertas pela mesma empresa
 * no mês seguinte". Este arquivo produz esse passado.
 *
 * **É recorte de demonstração.** O IEL-MT opera cerca de 2.500 vagas por mês;
 * a base mostra umas 40 vagas ativas e, aqui, umas duas centenas de vagas
 * encerradas em 15 meses. Os números absolutos são pequenos de propósito — não
 * fingimos a escala real —, e o que se mostra são proporções e tendências.
 *
 * Regras de coerência com a base viva:
 *
 * - As remessas são de **vagas passadas**, com id próprio (`HIST-VAG-…`). As
 *   vagas do catálogo (VAG-01, GEN-VAG-…) não ganham remessa fictícia que
 *   contradiga o estado atual delas.
 * - Os eventos de comunicação cobrem as candidaturas que existem no estado
 *   inicial, e `concluido` é verdadeiro se, e somente se, a candidatura tem
 *   resposta de fit. A leitura em `analysis/analytics.ts` ainda sobrepõe o
 *   estado vivo, para quem responder durante a demonstração.
 * - **O mesmo vale agora para o desfecho.** A devolutiva de um clique (C3)
 *   captura contratou / não contratou / saiu antes de 90 dias na página que
 *   a empresa abre por link, e `analysis/analytics.ts` soma essa captura às
 *   remessas deste arquivo dentro da mesma janela. O que a empresa responde
 *   ao vivo entra na conta; o histórico continua preenchendo o resto.
 *   `getComposicaoDosIndicadores` diz quanto do indicador veio de cada lado.
 * - Nenhum candidato histórico tem nome, e-mail ou id de talento: só aderência
 *   e desfecho. O histórico existe para medir, não para rever pessoas.
 *
 * Determinístico como o resto da base: gerador próprio, semeado com
 * `SEED + 101` — um gerador separado para que nada do que já existe mude de
 * valor —, e toda data relativa a `DEMO_REFERENCE_DATE`. A saída de quem foi
 * contratado (`SEED + 106`) e as vagas em andamento no mês da referência
 * (`SEED + 102`) têm geradores à parte, pelo mesmo motivo.
 */

import { FIT_AXES, type FitAxisId } from '../analysis/fit-axes';
import type { Company } from '../types';
import { DEMO_APPLICATIONS, DEMO_FIT_RESPONSES } from './applications';
import { DEMO_COMPANIES, DEMO_REFERENCE_DATE } from './companies';
import { getGeneratedBase } from './generated';
import { DEMO_JOBS } from './jobs';

/** Mesma semente de `generated.ts`; o deslocamento separa os geradores. */
const SEED = 20260914;

/** Cópia local do gerador de `generated.ts` (mulberry32). */
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

/* ------------------------------------------------------------------ *
 * Datas
 * ------------------------------------------------------------------ */

const REFERENCE_MS = Date.parse(`${DEMO_REFERENCE_DATE}T12:00:00.000Z`);
const DAY_MS = 86_400_000;

/** `YYYY-MM-DD`, `days` dias antes da referência. */
function dateBefore(days: number): string {
  return new Date(REFERENCE_MS - days * DAY_MS).toISOString().slice(0, 10);
}

/** Dias entre a data e a referência. */
function daysBetweenRef(isoDate: string): number {
  return Math.round(
    (REFERENCE_MS - Date.parse(`${isoDate.slice(0, 10)}T12:00:00.000Z`)) /
      DAY_MS
  );
}

/** Soma dias a uma data `YYYY-MM-DD`. */
function addDays(isoDate: string, days: number): string {
  const ms = Date.parse(`${isoDate.slice(0, 10)}T12:00:00.000Z`);
  return new Date(ms + days * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Mês de entrada do Mind RH: seis meses antes do mês de referência.
 *
 * Antes desta data o questionário de fit já era aplicado (em plataforma
 * separada, como o IEL fazia), mas não entrava na escolha dos cinco
 * currículos. Depois dela, o corte de 35% passa a ordenar a lista, o perfil
 * da empresa é fechado antes da ligação e a devolutiva de um toque (C3) chega
 * ao RH. É a linha vertical dos gráficos de tendência.
 */
export const MIND_RH_START_DATE = '2026-03-01';

/** Início do piloto de WhatsApp: antes disso, todo convite ia por e-mail. */
export const WHATSAPP_PILOT_START_DATE = dateBefore(28);

/**
 * Janela gerada, em dias antes da referência.
 *
 * O histórico cobre 15 meses, não 12: a permanência aos 90 dias de quem foi
 * contratado há um ano só é apurável porque a contratação aconteceu antes, e
 * uma vaga reaberta em outubro vem de um contrato de agosto. As telas nunca
 * mostram mais de 12 meses; os 3 meses extras só alimentam as contas.
 */
const HISTORY_MAX_DAYS = 460;
/** Remessa mais recente: dá tempo de a empresa ter recebido a lista. */
const HISTORY_MIN_DAYS = 14;

/* ------------------------------------------------------------------ *
 * Tipos exportados
 * ------------------------------------------------------------------ */

export type CanalComunicacao = 'email' | 'whatsapp';
export type Dispositivo = 'celular' | 'computador';
/** Número da frase no questionário do candidato: 10 frases, uma por tema. */
export type NumeroDaPergunta = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** Onde a pessoa parou: no aceite, numa das 10 frases, ou `null`. */
export type PontoDeParada = 'aceite' | NumeroDaPergunta | null;

/**
 * Convite ao questionário de fit de uma candidatura existente.
 *
 * Os passos são cumulativos: `aberto` implica `entregue`, `iniciado` (passou
 * do aceite) implica `aberto`, `concluido` implica `iniciado`.
 */
export type EventoComunicacao = {
  applicationId: string;
  jobId: string;
  canal: CanalComunicacao;
  /** ISO completo, UTC. */
  enviadoEm: string;
  entregue: boolean;
  aberto: boolean;
  /** Passou do aceite (consentimento registrado). */
  iniciado: boolean;
  /** Verdadeiro se, e somente se, a candidatura tem resposta de fit. */
  concluido: boolean;
  /**
   * `'aceite'` quando abriu e não aceitou; 1..10 quando começou e parou nessa
   * pergunta; `null` quando concluiu, ainda não abriu ou está no prazo.
   */
  paradaEm: PontoDeParada;
  lembreteEnviado: boolean;
  /** Dispositivo em que abriu; `null` se não abriu. */
  dispositivo: Dispositivo | null;
  /** Minutos entre começar e concluir (ou parar); `null` se não começou. */
  duracaoMin: number | null;
};

export type RetornoEmpresa = 'contratou' | 'nao-contratou' | 'sem-resposta';

export type MotivoNaoContratacao =
  | 'expectativa-salarial'
  | 'perfil-equipe'
  | 'desistencia-candidato'
  | 'vaga-cancelada'
  | 'outro';

export const RETORNO_LABEL: Record<RetornoEmpresa, string> = {
  contratou: 'Contratou',
  'nao-contratou': 'Não contratou',
  'sem-resposta': 'Sem resposta'
};

export const MOTIVO_LABEL: Record<MotivoNaoContratacao, string> = {
  'expectativa-salarial': 'Expectativa salarial',
  'perfil-equipe': 'Perfil não se encaixou na equipe',
  'desistencia-candidato': 'Candidato desistiu',
  'vaga-cancelada': 'Vaga cancelada',
  outro: 'Outro motivo'
};

export const CANAL_LABEL: Record<CanalComunicacao, string> = {
  email: 'E-mail',
  whatsapp: 'WhatsApp'
};

/**
 * Um currículo enviado numa remessa histórica. Sem nome, sem contato, sem id
 * de pessoa: só o que a medição precisa.
 */
export type EnvioHistorico = {
  /** Aderência total na entrada, 0..100 (média simples dos 10 temas). */
  aderencia: number;
  /** Aderência por ponto do dia a dia, na ordem de `FIT_AXES`. */
  porPonto: number[];
};

/** Quem foi contratado e o que se sabe da permanência até a referência. */
export type ContratacaoHistorica = {
  /** Índice em `RemessaHistorica.enviados`. */
  indiceEnvio: number;
  aderencia: number;
  contratadoEm: string;
  /** `null` enquanto os 30 dias não se completaram. */
  ficou30: boolean | null;
  /** `null` enquanto os 90 dias não se completaram. */
  ficou90: boolean | null;
};

/** Dias gastos em cada etapa do ciclo da vaga. */
export type EtapasDaVaga = {
  /** `null` antes do Mind RH: o perfil da empresa não era uma etapa. */
  perfilEmpresa: number | null;
  ligacao: number;
  questionarios: number;
  listaFinal: number;
  retornoEmpresa: number;
};

/** Uma vaga passada, encerrada, e a lista de até 5 currículos enviada. */
export type RemessaHistorica = {
  id: string;
  /** Id da vaga passada. Nunca coincide com vaga do catálogo vivo. */
  vagaId: string;
  cargo: string;
  companyId: string;
  setor: string;
  enviadaEm: string;
  /** Funil da vaga até a lista. */
  curriculosRecebidos: number;
  questionariosRespondidos: number;
  acimaDoCorte: number;
  /** Currículos enviados (até 5). */
  curriculosEnviados: number;
  enviados: EnvioHistorico[];
  /** O que a empresa devolveu ao IEL. */
  retorno: RetornoEmpresa;
  motivo: MotivoNaoContratacao | null;
  /** `null` quando não houve retorno. */
  diasAteRetorno: number | null;
  /**
   * Contratações que o IEL conhece — só existem quando a empresa devolveu
   * "contratou". Contratação sem retorno acontece, mas não se vê daqui.
   */
  contratados: ContratacaoHistorica[];
  etapasDias: EtapasDaVaga;
};

/**
 * Vaga que voltou ao Empregare em até 90 dias depois de uma contratação.
 *
 * Diferente do retorno, a reabertura o IEL enxerga sem a empresa dizer nada:
 * a mesma vaga aparece de novo no sistema. Por isso conta também contratações
 * que a empresa nunca devolveu.
 */
export type ReaberturaHistorica = {
  companyId: string;
  setor: string;
  remessaId: string;
  reabertaEm: string;
  /** Dias entre a contratação e a reabertura. */
  diasAteReabrir: number;
};

/** Consulta de cultura de empresa sem vaga ativa hoje, já encerrada. */
export type PerfilEmpresaHistorico = {
  companyId: string;
  iniciadoEm: string;
  /** `null` quando a amostra não fechou. */
  completoEm: string | null;
};

/** Estado do roteiro de ligação por empresa com vaga ativa. */
export type RoteiroDeLigacao = {
  companyId: string;
  geradoEm: string | null;
  abertoEm: string | null;
  usadoEm: string | null;
};

export type ExecucaoSincronizacao = {
  /** ISO completo (06:00 em Cuiabá = 10:00 UTC). */
  executadaEm: string;
  /** `YYYY-MM-DD`, na hora local. */
  data: string;
  /** `HH:mm`, na hora local. */
  hora: string;
  curriculosNovos: number;
  vagasNovas: number;
  status: 'ok' | 'atencao';
  observacao: string | null;
};

export type EntregaEmailDia = {
  data: string;
  enviados: number;
  entregues: number;
  abertos: number;
  devolvidos: number;
};

/**
 * Vaga aberta no mês da referência que ainda não teve lista enviada.
 *
 * As remessas param `HISTORY_MIN_DAYS` antes da referência, então o mês em
 * curso não teria vaga nenhuma no denominador da taxa de reabertura. Estas
 * são as vagas que entraram no mês e seguem em andamento: só contam como
 * "vaga aberta no mês", sem lista, retorno nem contratação.
 */
export type VagaEmAndamento = {
  companyId: string;
  setor: string;
  abertaEm: string;
};

export type OutcomesBase = {
  comunicacao: EventoComunicacao[];
  remessas: RemessaHistorica[];
  reaberturas: ReaberturaHistorica[];
  vagasEmAndamento: VagaEmAndamento[];
  perfisEmpresa: PerfilEmpresaHistorico[];
  roteiros: RoteiroDeLigacao[];
  sincronizacoes: ExecucaoSincronizacao[];
  entregaEmail30d: EntregaEmailDia[];
  /** Empresas que aparecem no histórico, com o setor usado nos recortes. */
  empresas: { companyId: string; nome: string; setor: string }[];
};

/* ------------------------------------------------------------------ *
 * Parâmetros
 * ------------------------------------------------------------------ */

/**
 * Permanência aos 90 dias por faixa de aderência na entrada.
 *
 * É a correlação que o painel precisa mostrar para que o corte de 35% seja
 * discutível com número: ~40% abaixo do corte, ~90% em 80 ou mais. Cada
 * empresa ganha um desvio próprio, para a relação não sair perfeita.
 */
function probFicar90(aderencia: number): number {
  // Levemente acima do alvo: a rotatividade do setor puxa a taxa observada
  // para baixo, e o que o painel mostra tem de ficar perto de 40/65/80/90.
  if (aderencia < 35) return 0.45;
  if (aderencia < 60) return 0.67;
  if (aderencia < 80) return 0.82;
  return 0.9;
}

/**
 * Nome único de setor para os recortes do histórico.
 *
 * A base gerada (`generated.ts`) usa dois nomes para o mesmo setor, conforme
 * a empresa veio da lista principal ou das leves ("Têxtil" e "Têxtil e
 * confecção"). No BI isso virava duas linhas para o mesmo setor, cada uma com
 * metade do volume. O histórico usa sempre o nome longo; `generated.ts` fica
 * como está, porque a tela da empresa mostra o setor que veio da origem.
 */
const SETOR_CANONICO: Record<string, string> = {
  Têxtil: 'Têxtil e confecção',
  Logística: 'Distribuição e logística',
  Alimentos: 'Indústria de alimentos'
};

/** O setor com que a empresa aparece no histórico. */
export function setorDoHistorico(setor: string): string {
  return SETOR_CANONICO[setor] ?? setor;
}

/** Setores de alta rotatividade: o frigorífico é o caso que o IEL cita. */
const SETORES_ALTA_ROTATIVIDADE = new Set([
  'Frigorífico',
  'Alimentos',
  'Indústria de alimentos',
  'Laticínios'
]);

const CARGOS = [
  'Auxiliar de Produção',
  'Operador de Máquinas',
  'Auxiliar de Expedição',
  'Magarefe',
  'Auxiliar de Almoxarifado',
  'Assistente Administrativo',
  'Operador de Empilhadeira',
  'Auxiliar de Manutenção',
  'Assistente de Logística',
  'Auxiliar de Limpeza Industrial'
] as const;

const MOTIVOS: { motivo: MotivoNaoContratacao; peso: number }[] = [
  { motivo: 'expectativa-salarial', peso: 34 },
  { motivo: 'perfil-equipe', peso: 22 },
  { motivo: 'desistencia-candidato', peso: 24 },
  { motivo: 'vaga-cancelada', peso: 10 },
  { motivo: 'outro', peso: 10 }
];

/** Onde quem começou e não terminou parou, pergunta a pergunta. */
const PARADA_PESOS: { ponto: NumeroDaPergunta; peso: number }[] = [
  { ponto: 1, peso: 22 },
  { ponto: 2, peso: 12 },
  { ponto: 3, peso: 14 },
  { ponto: 4, peso: 10 },
  { ponto: 5, peso: 9 },
  { ponto: 6, peso: 8 },
  { ponto: 7, peso: 7 },
  { ponto: 8, peso: 7 },
  { ponto: 9, peso: 6 },
  { ponto: 10, peso: 5 }
];

function weighted(random: () => number, items: { peso: number }[]): number {
  const total = items.reduce((sum, item) => sum + item.peso, 0);
  let draw = random() * total;
  for (let i = 0; i < items.length; i += 1) {
    draw -= items[i]!.peso;
    if (draw <= 0) return i;
  }
  return items.length - 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Soma de três uniformes: aproximação de normal, sem dependência. */
function normal(random: () => number, mean: number, sd: number): number {
  const z = (random() + random() + random() - 1.5) * 2;
  return mean + z * sd;
}

/**
 * Difusão de erro: decide "sim/não" por chave acumulando a probabilidade.
 *
 * Com poucas dezenas de casos por faixa, um sorteio independente faz a taxa
 * observada oscilar tanto que a correlação some no ruído — e o painel
 * mostraria 50% de permanência na faixa de 60 a 79 por puro azar. O
 * acumulador entrega a taxa pedida com precisão de um caso, e a variação que
 * sobra vem do desvio de cada empresa, que é o ruído que interessa mostrar.
 */
function createDifusor(random: () => number) {
  const acumulado = new Map<string, number>();
  return (chave: string, probabilidade: number): boolean => {
    const atual = (acumulado.get(chave) ?? random()) + probabilidade;
    if (atual >= 1) {
      acumulado.set(chave, atual - 1);
      return true;
    }
    acumulado.set(chave, atual);
    return false;
  };
}

function faixaDe(aderencia: number): string {
  if (aderencia < 35) return 'a';
  if (aderencia < 60) return 'b';
  if (aderencia < 80) return 'c';
  return 'd';
}

function between(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

/* ------------------------------------------------------------------ *
 * Construção
 * ------------------------------------------------------------------ */

type EmpresaDoHistorico = {
  company: Company;
  /** Remessas por mês, em média. */
  ritmo: number;
  /** Multiplica a chance de sair antes dos 90 dias. */
  rotatividade: number;
  /** Desvio próprio da empresa na permanência. */
  desvio: number;
  temVagaAtiva: boolean;
};

function escolherEmpresas(random: () => number): EmpresaDoHistorico[] {
  const generated = getGeneratedBase();
  const allJobs = [...DEMO_JOBS, ...generated.jobs];
  const comVagaAtiva = new Set(
    allJobs.filter((job) => job.stage !== 'encerrada').map((j) => j.companyId)
  );

  // As empresas com vaga no catálogo (as 3 do roteiro e as 12 geradas) e um
  // recorte das empresas leves: sem vaga este mês, mas com vagas no ano.
  const principais = [
    ...DEMO_COMPANIES,
    ...generated.companies.filter((c) => /^GEN-EMP-\d{2}$/.test(c.id))
  ];
  const leves = generated.companies.filter((c) => /^GEN-EMP-\d{4}$/.test(c.id));
  // Quatro de cada setor de alta rotatividade, com frigorífico e alimentos
  // à frente: são eles que abrem a lista de "TransCerrado".
  const levesAlta = ['Frigorífico', 'Alimentos', 'Laticínios'].flatMap(
    (setor) => leves.filter((c) => c.sector === setor).slice(0, 4)
  );
  const levesOutras = leves
    .filter((c) => !SETORES_ALTA_ROTATIVIDADE.has(c.sector))
    .slice(0, 14);

  const empresas: EmpresaDoHistorico[] = [];
  for (const company of principais) {
    const alta = SETORES_ALTA_ROTATIVIDADE.has(company.sector);
    empresas.push({
      company,
      ritmo: 0.7,
      rotatividade: alta ? 1.1 : 1,
      desvio: normal(random, 0, 0.03),
      temVagaAtiva: comVagaAtiva.has(company.id)
    });
  }
  levesAlta.forEach((company, index) => {
    // As "TransCerrado" da demonstração: dois frigoríficos e uma de
    // alimentos que reabrem a mesma vaga mês sim, mês não.
    const campea = index < 2 || index === 4;
    empresas.push({
      company,
      ritmo: campea ? 1.4 : 0.6,
      rotatividade: campea ? 1.5 : 1.1,
      desvio: normal(random, 0, 0.03),
      temVagaAtiva: comVagaAtiva.has(company.id)
    });
  });
  for (const company of levesOutras) {
    empresas.push({
      company,
      ritmo: 0.4,
      rotatividade: 1,
      desvio: normal(random, 0, 0.03),
      temVagaAtiva: comVagaAtiva.has(company.id)
    });
  }
  return empresas;
}

/** Chance de a empresa devolver o resultado, subindo ao longo do ano. */
function probRetorno(enviadaEm: string): number {
  const dias =
    (REFERENCE_MS - Date.parse(`${enviadaEm}T12:00:00.000Z`)) / DAY_MS;
  const inicio = Date.parse(`${MIND_RH_START_DATE}T12:00:00.000Z`);
  const diasDesdeInicio = (REFERENCE_MS - inicio) / DAY_MS;
  if (dias > diasDesdeInicio) {
    // Antes do Mind RH: ~30%, com leve deriva.
    const frac = clamp(
      (HISTORY_MAX_DAYS - dias) / (HISTORY_MAX_DAYS - diasDesdeInicio),
      0,
      1
    );
    return 0.28 + 0.06 * frac;
  }
  // Depois: o retorno de um toque puxa para ~55%.
  const frac = clamp((diasDesdeInicio - dias) / diasDesdeInicio, 0, 1);
  return 0.36 + 0.2 * frac;
}

/**
 * Viés de cada setor em cada ponto do dia a dia, em pontos de aderência.
 *
 * Sem ele todo setor combinaria igual em todos os pontos, e o que a analista
 * procura no BI é justamente o tema que não fecha num setor: no frigorífico,
 * regras e ritmo; na logística, o ritmo do turno, que varia. Os
 * demais setores recebem um desvio pequeno e estável, derivado do nome. O
 * ponto de viés mais negativo também pesa na saída (`pontoCritico`).
 */
const VIES_POR_SETOR: Record<string, Partial<Record<FitAxisId, number>>> = {
  Frigorífico: { 'regras-decisao': -16, 'execucao-ritmo': -10 },
  Alimentos: { 'regras-decisao': -10, 'execucao-ritmo': -7 },
  'Indústria de alimentos': { 'regras-decisao': -10, 'execucao-ritmo': -7 },
  Laticínios: { 'execucao-ritmo': -9, 'lideranca-autonomia': -6 },
  Logística: { 'execucao-ritmo': -12, 'adaptacao-carreira': -6 },
  'Distribuição e logística': {
    'execucao-ritmo': -12,
    'adaptacao-carreira': -6
  },
  Metalurgia: { 'lideranca-autonomia': -7 },
  Autopeças: { 'aprendizado-desenvolvimento': 6 }
};

function viesDoSetor(setor: string): number[] {
  const fixo = VIES_POR_SETOR[setor] ?? {};
  let hash = 0;
  for (const char of setor) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return FIT_AXES.map(
    (axis, index) => fixo[axis.id] ?? ((hash >>> (index * 3)) % 9) - 4
  );
}

/**
 * O ponto que decide quem fica em cada setor: o de viés mais negativo.
 *
 * Sem isso, quem sai só dependeria da aderência total, e todos os pontos
 * separariam quem ficou de quem saiu na mesma medida — a lista "o ponto que
 * mais pesa, por setor" sairia sorteada. No frigorífico quem sai é quem não
 * fecha com as regras; na logística, com o ritmo do turno.
 */
function pontoCritico(vies: number[]): {
  indice: number;
  /** Quanto, em média, o ponto crítico fica abaixo da média dos cinco. */
  folgaEsperada: number;
} {
  let indice = 0;
  vies.forEach((valor, i) => {
    if (valor < (vies[indice] ?? 0)) indice = i;
  });
  const mediaVies = vies.reduce((soma, v) => soma + v, 0) / vies.length;
  return { indice, folgaEsperada: mediaVies - (vies[indice] ?? 0) };
}

/**
 * Peso do ponto crítico na chance de sair: quem ficou abaixo do esperado
 * nele sai mais; quem ficou acima, menos. Em média vale 1, para a
 * permanência por faixa de aderência não mudar de patamar.
 */
function fatorDoPontoCritico(
  envio: EnvioHistorico,
  critico: { indice: number; folgaEsperada: number }
): number {
  const folga = envio.aderencia - (envio.porPonto[critico.indice] ?? 0);
  return clamp(1 + (folga - critico.folgaEsperada) / 12, 0.45, 1.9);
}

function gerarEnvio(
  random: () => number,
  aposMindRh: boolean,
  vies: number[]
): EnvioHistorico {
  // Antes do corte, a lista saía sem olhar a aderência; depois, quase toda
  // lista fica acima de 35% — quase, porque o corte é de atenção e a analista
  // ainda envia alguém abaixo quando o técnico justifica.
  let alvo = aposMindRh ? normal(random, 66, 14) : normal(random, 46, 24);
  if (aposMindRh && alvo < 35 && random() < 0.85) {
    alvo = 36 + random() * 30;
  }
  alvo = clamp(alvo, 5, 98);
  const porPonto = FIT_AXES.map((_, index) =>
    Math.round(clamp(normal(random, alvo + (vies[index] ?? 0), 16), 0, 100))
  );
  const aderencia = Math.round(
    porPonto.reduce((sum, value) => sum + value, 0) / porPonto.length
  );
  return { aderencia, porPonto };
}

function build(): OutcomesBase {
  const random = createRandom(SEED + 101);
  // Quando e como alguém sai tem gerador e difusor próprios: ajustar a saída
  // não mexe no sorteio das remessas, do retorno, do funil nem dos convites.
  const randomSaida = createRandom(SEED + 106);
  const empresas = escolherEmpresas(random);
  const decide = createDifusor(random);
  const decideSaida = createDifusor(randomSaida);

  const remessas: RemessaHistorica[] = [];
  const reaberturas: ReaberturaHistorica[] = [];
  const perfisEmpresa: PerfilEmpresaHistorico[] = [];

  let seq = 0;
  for (const empresa of empresas) {
    const { company } = empresa;
    const setor = setorDoHistorico(company.sector);
    // O viés segue o nome de origem: é ele que já moldava a aderência de
    // cada ponto, e mudar o nome não deve mudar quem combinava com o quê.
    const vies = viesDoSetor(company.sector);
    const critico = pontoCritico(vies);
    let ultimaConsulta: string | null = null;

    // Uma oportunidade por quinzena, com ritmo constante por empresa: o
    // volume mensal fica estável e a tendência que aparece é a do resultado,
    // não a do sorteio.
    for (let dia = HISTORY_MAX_DAYS; dia >= HISTORY_MIN_DAYS; dia -= 15) {
      if (!decide(`ritmo:${company.id}`, empresa.ritmo / 2)) continue;
      const enviadaEm = dateBefore(
        clamp(dia - between(random, 0, 14), HISTORY_MIN_DAYS, HISTORY_MAX_DAYS)
      );
      const aposMindRh = enviadaEm >= MIND_RH_START_DATE;
      // Consulta de cultura das empresas sem vaga ativa hoje: aberta antes da
      // primeira vaga depois do Mind RH e renovada a cada ~90 dias (validade
      // do perfil, C4). As empresas com vaga ativa têm o perfil lido do
      // estado vivo, e um histórico paralelo contradiria a tela da empresa.
      if (
        aposMindRh &&
        !empresa.temVagaAtiva &&
        (ultimaConsulta === null || addDays(ultimaConsulta, 90) <= enviadaEm)
      ) {
        const iniciadoEm = addDays(enviadaEm, -between(random, 6, 12));
        const fechou = random() < 0.85;
        // Com o tempo a amostra fecha mais rápido: a empresa já conhece o link.
        const prazo =
          ultimaConsulta === null
            ? between(random, 4, 9)
            : between(random, 2, 5);
        perfisEmpresa.push({
          companyId: company.id,
          iniciadoEm,
          completoEm: fechou ? addDays(iniciadoEm, prazo) : null
        });
        ultimaConsulta = enviadaEm;
      }

      seq += 1;
      const id = `HIST-REM-${String(seq).padStart(4, '0')}`;

      const curriculosRecebidos = between(random, 14, 64);
      const taxaResposta = aposMindRh
        ? normal(random, 0.7, 0.06)
        : normal(random, 0.44, 0.06);
      const questionariosRespondidos = Math.round(
        curriculosRecebidos * clamp(taxaResposta, 0.2, 0.95)
      );
      const acimaDoCorte = Math.round(
        questionariosRespondidos * clamp(normal(random, 0.66, 0.08), 0.3, 0.95)
      );
      const curriculosEnviados = Math.min(5, between(random, 3, 5));
      const enviados = Array.from({ length: curriculosEnviados }, () =>
        gerarEnvio(random, aposMindRh, vies)
      );

      // O desfecho real, visto ou não pelo IEL.
      const houveContratacao = decide('contratacao', 0.72);
      const devolveu = decide(
        // Por quinzena contada da referência: as janelas das telas (30, 90 e
        // 365 dias) são múltiplos disso e recebem a taxa pedida sem sobra.
        `retorno:${Math.floor(daysBetweenRef(enviadaEm) / 15)}`,
        probRetorno(enviadaEm)
      );
      const diasDecisao = aposMindRh
        ? between(random, 5, 13)
        : between(random, 9, 24);

      let indiceContratado = -1;
      if (houveContratacao) {
        // Depois do Mind RH a empresa vê a aderência e tende a escolher quem
        // combina mais; antes, a escolha não olhava para isso.
        if (aposMindRh) {
          const pesos = enviados.map((envio) => ({
            peso: envio.aderencia ** 2
          }));
          indiceContratado = weighted(random, pesos);
        } else {
          indiceContratado = Math.floor(random() * enviados.length);
        }
      }

      const contratados: ContratacaoHistorica[] = [];
      if (indiceContratado >= 0) {
        const envio = enviados[indiceContratado]!;
        const contratadoEm = addDays(
          enviadaEm,
          diasDecisao + between(random, 5, 12)
        );
        const pFicar = clamp(
          probFicar90(envio.aderencia) + empresa.desvio,
          0.05,
          0.98
        );
        // Depois do Mind RH o excesso de rotatividade do setor cai pela
        // metade: a lista chega com o turno e o apoio inicial já conversados
        // na ligação, que é onde o frigorífico perdia gente no primeiro mês.
        const rotatividade = aposMindRh
          ? 1 + (empresa.rotatividade - 1) / 2
          : empresa.rotatividade;
        const pSairBase = clamp((1 - pFicar) * rotatividade, 0.02, 0.9);
        // A chave separa quem o painel vai enxergar (retorno registrado e 90
        // dias completos) do resto, para a taxa bater nos dois grupos.
        const observavel =
          devolveu && addDays(contratadoEm, 90) <= DEMO_REFERENCE_DATE;
        const chaveSaida = `saida:${faixaDe(envio.aderencia)}:${observavel}`;
        // O sorteio da primeira versão continua sendo feito, só para o
        // gerador principal andar o mesmo tanto: as remessas, o retorno, os
        // convites e os roteiros seguem idênticos. Quem sai de fato é
        // decidido abaixo, no gerador da saída.
        if (decide(chaveSaida, pSairBase)) {
          random();
          random();
          random();
        }
        const saiu = decideSaida(
          chaveSaida,
          clamp(pSairBase * fatorDoPontoCritico(envio, critico), 0.02, 0.9)
        );
        // Antes do Mind RH, quem não se adaptava saía cedo: o turno e o apoio
        // do início não eram conversados antes, e a conta chegava no primeiro
        // mês. Depois, as saídas que sobram se espalham pelos 90 dias.
        const saiuAntesDe30 = saiu && randomSaida() < (aposMindRh ? 0.5 : 0.7);
        let diasNaEmpresa = saiu
          ? saiuAntesDe30
            ? between(randomSaida, 6, 29)
            : between(randomSaida, 31, 85)
          : null;
        // Quem foi contratado antes da entrada e sairia depois dela, em quatro
        // de cada cinco casos, sai antes: a defasagem da lista antiga aparece
        // em janeiro e fevereiro, não como pico no mês em que o Mind RH entra.
        // Só vale para quem teve ao menos uma semana de casa antes de março;
        // o resto é a transição que ainda se vê em março e abril.
        if (
          diasNaEmpresa !== null &&
          !aposMindRh &&
          contratadoEm < MIND_RH_START_DATE
        ) {
          const diasAteEntrada =
            daysBetweenRef(contratadoEm) - daysBetweenRef(MIND_RH_START_DATE);
          const limite = diasAteEntrada - 6;
          if (diasNaEmpresa >= limite && limite >= 6 && randomSaida() < 0.8) {
            diasNaEmpresa = 6 + (diasNaEmpresa % (limite - 5));
          }
        }
        const saidaEm =
          diasNaEmpresa === null ? null : addDays(contratadoEm, diasNaEmpresa);

        const marco = (dias: number): boolean | null => {
          if (
            saidaEm !== null &&
            saidaEm <= DEMO_REFERENCE_DATE &&
            diasNaEmpresa! < dias
          ) {
            return false;
          }
          return addDays(contratadoEm, dias) <= DEMO_REFERENCE_DATE
            ? true
            : null;
        };

        if (contratadoEm <= DEMO_REFERENCE_DATE && devolveu) {
          contratados.push({
            indiceEnvio: indiceContratado,
            aderencia: envio.aderencia,
            contratadoEm,
            ficou30: marco(30),
            ficou90: marco(90)
          });
        }

        if (saidaEm !== null && diasNaEmpresa !== null) {
          const intervalo = between(randomSaida, 1, 5);
          const reabertaEm = addDays(saidaEm, intervalo);
          if (reabertaEm <= DEMO_REFERENCE_DATE) {
            reaberturas.push({
              companyId: company.id,
              setor,
              remessaId: id,
              reabertaEm,
              diasAteReabrir: diasNaEmpresa + intervalo
            });
          }
        }
      }

      const retornoEmData =
        addDays(enviadaEm, diasDecisao) <= DEMO_REFERENCE_DATE;
      const retorno: RetornoEmpresa =
        devolveu && retornoEmData
          ? houveContratacao
            ? 'contratou'
            : 'nao-contratou'
          : 'sem-resposta';
      const motivo: MotivoNaoContratacao | null =
        retorno === 'nao-contratou'
          ? MOTIVOS[weighted(random, MOTIVOS)]!.motivo
          : null;

      // O retorno é o gargalo do ciclo: sem resposta, a vaga fica parada até
      // o IEL encerrá-la por prazo.
      const diasRetornoEtapa =
        retorno === 'sem-resposta' ? between(random, 12, 20) : diasDecisao;

      remessas.push({
        id,
        vagaId: `HIST-VAG-${String(seq).padStart(4, '0')}`,
        cargo: CARGOS[Math.floor(random() * CARGOS.length)]!,
        companyId: company.id,
        setor,
        enviadaEm,
        curriculosRecebidos,
        questionariosRespondidos,
        acimaDoCorte,
        curriculosEnviados,
        enviados,
        retorno,
        motivo,
        diasAteRetorno: retorno === 'sem-resposta' ? null : diasDecisao,
        contratados: retorno === 'contratou' ? contratados : [],
        etapasDias: {
          perfilEmpresa: aposMindRh ? between(random, 2, 6) : null,
          ligacao: between(random, 1, 3),
          questionarios: between(random, 1, 2),
          listaFinal: between(random, 1, 2),
          retornoEmpresa: diasRetornoEtapa
        }
      });
    }
  }

  remessas.sort((a, b) => a.enviadaEm.localeCompare(b.enviadaEm));
  reaberturas.sort((a, b) => a.reabertaEm.localeCompare(b.reabertaEm));

  return {
    comunicacao: buildComunicacao(random),
    remessas,
    reaberturas,
    vagasEmAndamento: buildVagasEmAndamento(empresas),
    perfisEmpresa,
    roteiros: buildRoteiros(random, empresas),
    sincronizacoes: buildSincronizacoes(random),
    entregaEmail30d: [],
    empresas: empresas.map(({ company }) => ({
      companyId: company.id,
      nome: company.name,
      setor: setorDoHistorico(company.sector)
    }))
  };
}

/**
 * Um convite por candidatura do estado inicial, coerente com as respostas.
 *
 * A ordem de percurso é a do estado inicial (curadas e depois geradas), e a
 * semente é própria: acrescentar candidaturas ao fim não muda as anteriores.
 */
function buildComunicacao(random: () => number): EventoComunicacao[] {
  const generated = getGeneratedBase();
  const applications = [...DEMO_APPLICATIONS, ...generated.applications];
  const responded = new Map(
    [...DEMO_FIT_RESPONSES, ...generated.fitResponses].map((r) => [
      r.applicationId,
      r
    ])
  );

  return applications.map((application) => {
    const appliedDate = application.appliedAt.slice(0, 10);
    const hora = between(random, 7, 20);
    const minuto = between(random, 0, 59);
    const enviadoEm = `${appliedDate}T${String(hora + 4).padStart(2, '0')}:${String(minuto).padStart(2, '0')}:00.000Z`;
    const canal: CanalComunicacao =
      appliedDate >= WHATSAPP_PILOT_START_DATE && random() < 0.35
        ? 'whatsapp'
        : 'email';
    const concluido = responded.has(application.id);
    const diasDesdeEnvio =
      (REFERENCE_MS - Date.parse(`${appliedDate}T12:00:00.000Z`)) / DAY_MS;
    const noPrazo = diasDesdeEnvio <= 2;

    let entregue = true;
    let aberto = true;
    let iniciado = true;
    let paradaEm: PontoDeParada = null;

    if (!concluido) {
      const draw = random();
      if (draw < (canal === 'email' ? 0.12 : 0.04)) {
        entregue = false;
        aberto = false;
        iniciado = false;
      } else if (draw < 0.45) {
        aberto = false;
        iniciado = false;
      } else if (draw < 0.66) {
        iniciado = false;
        paradaEm = noPrazo ? null : 'aceite';
      } else {
        paradaEm = noPrazo
          ? null
          : PARADA_PESOS[weighted(random, PARADA_PESOS)]!.ponto;
      }
    }

    const dispositivo: Dispositivo | null = aberto
      ? random() < (canal === 'whatsapp' ? 0.96 : 0.68)
        ? 'celular'
        : 'computador'
      : null;

    let duracaoMin: number | null = null;
    if (concluido) {
      duracaoMin =
        Math.round(
          clamp(normal(random, dispositivo === 'celular' ? 5.5 : 7, 2), 2, 14) *
            10
        ) / 10;
    } else if (iniciado) {
      duracaoMin =
        Math.round(clamp(normal(random, 2.5, 1.2), 0.5, 8) * 10) / 10;
    }

    const lembreteEnviado =
      entregue && !noPrazo && (!concluido ? random() < 0.85 : random() < 0.25);

    return {
      applicationId: application.id,
      jobId: application.jobId,
      canal,
      enviadoEm,
      entregue,
      aberto,
      iniciado,
      concluido,
      paradaEm,
      lembreteEnviado,
      dispositivo,
      duracaoMin
    };
  });
}

/**
 * Vagas abertas no mês da referência, ainda sem lista: o mesmo ritmo de cada
 * empresa, dia a dia, do primeiro dia do mês até a referência. Gerador
 * próprio (`SEED + 102`), para não deslocar nada do que já foi sorteado.
 */
function buildVagasEmAndamento(
  empresas: EmpresaDoHistorico[]
): VagaEmAndamento[] {
  const random = createRandom(SEED + 102);
  const diasNoMes = Number(DEMO_REFERENCE_DATE.slice(8, 10));
  const vagas: VagaEmAndamento[] = [];
  for (const { company, ritmo } of empresas) {
    for (let dia = diasNoMes - 1; dia >= 0; dia -= 1) {
      if (random() < ritmo / 30) {
        vagas.push({
          companyId: company.id,
          setor: setorDoHistorico(company.sector),
          abertaEm: dateBefore(dia)
        });
      }
    }
  }
  return vagas.sort((a, b) => a.abertaEm.localeCompare(b.abertaEm));
}

/** Roteiro de ligação: só para empresas com vaga ativa, só o estado. */
function buildRoteiros(
  random: () => number,
  empresas: EmpresaDoHistorico[]
): RoteiroDeLigacao[] {
  return empresas
    .filter((empresa) => empresa.temVagaAtiva)
    .map(({ company }) => {
      const gerado = random() < 0.87;
      const geradoEm = gerado ? dateBefore(between(random, 3, 40)) : null;
      const abertoEm =
        geradoEm && random() < 0.8
          ? addDays(geradoEm, between(random, 0, 2))
          : null;
      const usadoEm =
        abertoEm && random() < 0.72
          ? addDays(abertoEm, between(random, 0, 3))
          : null;
      return {
        companyId: company.id,
        geradoEm,
        abertoEm: abertoEm && abertoEm <= DEMO_REFERENCE_DATE ? abertoEm : null,
        usadoEm: usadoEm && usadoEm <= DEMO_REFERENCE_DATE ? usadoEm : null
      };
    });
}

/**
 * As 10 últimas sincronizações diárias com o Empregare, às 06:00 de Cuiabá.
 *
 * Os currículos novos de cada dia são as candidaturas da base viva com aquela
 * data de inscrição: o log conta o que a base de fato recebeu.
 */
function buildSincronizacoes(random: () => number): ExecucaoSincronizacao[] {
  const generated = getGeneratedBase();
  const porDia = new Map<string, number>();
  for (const application of [...DEMO_APPLICATIONS, ...generated.applications]) {
    const dia = application.appliedAt.slice(0, 10);
    porDia.set(dia, (porDia.get(dia) ?? 0) + 1);
  }
  const falha = between(random, 2, 7);

  return Array.from({ length: 10 }, (_, index) => {
    const data = dateBefore(index);
    // O lote das 06:00 traz o que entrou no dia anterior.
    const curriculosNovos = porDia.get(dateBefore(index + 1)) ?? 0;
    const atencao = index === falha;
    return {
      executadaEm: `${data}T${atencao ? '10:02' : '10:00'}:00.000Z`,
      data,
      hora: atencao ? '06:02' : '06:00',
      curriculosNovos,
      vagasNovas: random() < 0.35 ? between(random, 1, 2) : 0,
      status: atencao ? 'atencao' : 'ok',
      observacao: atencao
        ? 'Tempo esgotado na primeira tentativa; tentativa refeita após 2 min.'
        : null
    };
  });
}

/** Agrega a entrega de e-mail dos últimos 30 dias a partir dos convites. */
function buildEntregaEmail(
  comunicacao: EventoComunicacao[]
): EntregaEmailDia[] {
  const dias = Array.from({ length: 30 }, (_, index) => dateBefore(29 - index));
  const porDia = new Map(
    dias.map((data) => [
      data,
      { data, enviados: 0, entregues: 0, abertos: 0, devolvidos: 0 }
    ])
  );
  for (const evento of comunicacao) {
    if (evento.canal !== 'email') continue;
    const dia = porDia.get(evento.enviadoEm.slice(0, 10));
    if (!dia) continue;
    dia.enviados += 1;
    if (evento.entregue) dia.entregues += 1;
    else dia.devolvidos += 1;
    if (evento.aberto) dia.abertos += 1;
  }
  return dias.map((data) => porDia.get(data)!);
}

let cache: OutcomesBase | null = null;

/** Histórico de resultados, construído uma vez por processo. */
export function getOutcomesBase(): OutcomesBase {
  if (!cache) {
    const base = build();
    base.entregaEmail30d = buildEntregaEmail(base.comunicacao);
    cache = base;
  }
  return cache;
}
