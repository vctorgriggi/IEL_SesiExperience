import { getOutcomesBase, type CanalComunicacao } from '../fixtures/outcomes';
import {
  CANDIDATE_FIT_DEADLINE_DAYS,
  getAcompanhamento,
  getApplication,
  getCompany,
  getFitStatus,
  getJob,
  getRegisteredReferrals,
  getTalent,
  JANELA_DO_MARCO_DIAS
} from '../state/selectors';
import type { DemoState } from '../types';
import { diasEntre, lerDevolutiva } from './devolutiva';

/**
 * O que o IEL está esperando de quem — a lista operacional da tela
 * Questionários (aba Simples).
 *
 * A analítica (funil, onde o candidato para) diz *como* o questionário vai;
 * não diz *de quem* o IEL está esperando resposta hoje, desde quando, e o
 * que fazer. Essa visão estava espalhada: "Sem resposta" na mesa, "Cobrar N
 * que faltam" na empresa, "Sem devolutiva há N dias" nos Enviados e "ainda
 * não contou" no Acompanhamento. "A gente tem que ficar em cima" (00:44:09)
 * pede uma lista só.
 *
 * Tudo aqui é **derivado** do estado que já existe — nenhuma linha é gravada.
 * Quatro tipos de espera, cada um com o prazo que o cliente deu:
 *
 * - **questionário do candidato**: candidatura sem resposta resolvida
 *   (`getFitStatus` ≠ respondido), prazo de 2 dias da candidatura (R7);
 * - **consulta ao colaborador**: convite em aberto, prazo de 3 dias do envio
 *   ou do último reenvio (R7);
 * - **devolutiva da empresa**: pessoa enviada sem "contratei / não contratei",
 *   prazo de 15 dias do envio (R9: "primeira triagem em até 15");
 * - **como está sendo**: check-in de quem foi contratado, aberto e sem
 *   resposta, prazo de 30 dias do marco (`JANELA_DO_MARCO_DIAS`).
 *
 * Escala: a base tem milhares de candidaturas. Cada fonte é percorrida uma
 * vez, com índices por candidatura montados antes do laço — nada de procurar
 * o convite de cada candidatura dentro da lista de convites.
 */

export type TipoDeSolicitacao =
  | 'questionario-do-candidato'
  | 'consulta-ao-colaborador'
  | 'devolutiva-da-empresa'
  | 'como-esta-sendo';

export const TIPOS_DE_SOLICITACAO: TipoDeSolicitacao[] = [
  'questionario-do-candidato',
  'consulta-ao-colaborador',
  'devolutiva-da-empresa',
  'como-esta-sendo'
];

/** O nome de cada espera, na voz da tela. */
export const TIPO_DE_SOLICITACAO_LABEL: Record<TipoDeSolicitacao, string> = {
  'questionario-do-candidato': 'Questionário do candidato',
  'consulta-ao-colaborador': 'Consulta ao colaborador',
  'devolutiva-da-empresa': 'Devolutiva da empresa',
  'como-esta-sendo': 'Como está sendo'
};

/** No prazo, vence hoje ou venceu. */
export type EstadoDoPrazo = 'no-prazo' | 'vence-hoje' | 'vencido';

export const ESTADOS_DO_PRAZO: EstadoDoPrazo[] = [
  'vencido',
  'vence-hoje',
  'no-prazo'
];

export const ESTADO_DO_PRAZO_LABEL: Record<EstadoDoPrazo, string> = {
  'no-prazo': 'No prazo',
  'vence-hoje': 'Vence hoje',
  vencido: 'Vencido'
};

/** Prazo da devolutiva da empresa, em dias do envio (R9). */
export const DEVOLUTIVA_PRAZO_DIAS = 15;

/** "Respondidos" no topo da tela: quantos voltaram nos últimos N dias. */
export const JANELA_DE_RESPONDIDOS_DIAS = 7;

/**
 * A regra do lembrete automático, escrita para a tela: um lembrete 24 h
 * depois do envio e outro 24 h antes do prazo. Só cálculo de data — nada é
 * gravado nem enviado; a demonstração simula.
 */
export const LEMBRETE_APOS_ENVIO_HORAS = 24;
export const LEMBRETE_ANTES_DO_PRAZO_HORAS = 24;

const HORA_MS = 3_600_000;

/**
 * A hora do dia em que um prazo dado só por data "vence", em UTC. 12:00Z é
 * 9h em Brasília e 8h em Cuiabá: horário comercial dos dois lados, para o
 * lembrete "24 h antes" cair num horário em que alguém lê.
 */
const HORA_DO_PRAZO_UTC = 'T12:00:00.000Z';

export type Solicitacao = {
  /** Estável entre renders: `tipo:chave`. */
  id: string;
  tipo: TipoDeSolicitacao;
  /** De quem o IEL espera: nome da pessoa, e-mail corporativo ou contato do RH. */
  quem: string;
  /** Linha de apoio sob o "quem" (empresa do RH, papel do colaborador). */
  quemDetalhe: string | null;
  /** A vaga e a empresa (ou a pessoa enviada), na segunda linha do "o quê". */
  contexto: string;
  /** ISO completo do envio que abriu a espera. */
  enviadoEm: string;
  /** Dias inteiros desde o envio, contra o "hoje" da demonstração. */
  esperandoDias: number;
  /** Último dia para responder, `AAAA-MM-DD`. */
  prazo: string;
  /** Dias até o prazo: 0 vence hoje, negativo venceu. */
  prazoEmDias: number;
  estado: EstadoDoPrazo;
  /** Por onde o convite saiu, quando a base sabe. */
  canal: CanalComunicacao | null;
  lembretes: {
    /** Quantos a analista já reenviou (manual). */
    total: number;
    /** ISO do último reenvio, quando a base guarda a hora. */
    ultimoEm: string | null;
  };
  /**
   * Quando sai o próximo lembrete automático simulado (ISO), ou `null` se
   * os dois horários da regra já passaram.
   */
  proximoAutomaticoEm: string | null;
  /** A candidatura, quando a espera é de uma pessoa candidata ou contratada. */
  applicationId: string | null;
  /** O convite, quando a espera é de um colaborador. */
  inviteId: string | null;
  companyId: string | null;
  jobId: string | null;
};

export type ContadoresDeSolicitacoes = {
  esperando: number;
  vencendoHoje: number;
  vencidos: number;
  /** Respostas que chegaram nos últimos `JANELA_DE_RESPONDIDOS_DIAS` dias. */
  respondidosNaJanela: number;
};

export type LeituraDeSolicitacoes = {
  /** Vencidos primeiro (o mais vencido no topo), depois vence hoje, depois no prazo. */
  linhas: Solicitacao[];
  contadores: ContadoresDeSolicitacoes;
  porTipo: Record<TipoDeSolicitacao, number>;
  porEstado: Record<EstadoDoPrazo, number>;
};

/* ------------------------------------------------------------------ *
 * Datas
 * ------------------------------------------------------------------ */

function addDias(isoDate: string, dias: number): string {
  const base = Date.parse(`${isoDate.slice(0, 10)}T00:00:00.000Z`);
  return new Date(base + dias * 86_400_000).toISOString().slice(0, 10);
}

function estadoDoPrazo(prazoEmDias: number): EstadoDoPrazo {
  if (prazoEmDias < 0) return 'vencido';
  if (prazoEmDias === 0) return 'vence-hoje';
  return 'no-prazo';
}

/**
 * O próximo lembrete automático, pela regra: 24 h depois do envio e 24 h
 * antes do prazo. Devolve o primeiro dos dois que ainda não passou, ou
 * `null`. Calculado das datas a cada leitura — não há agenda gravada.
 */
export function proximoLembreteAutomatico(
  enviadoEm: string,
  prazo: string,
  agora: string
): string | null {
  const agoraMs = Date.parse(agora);
  const envioMs = Date.parse(enviadoEm);
  const prazoMs = Date.parse(`${prazo.slice(0, 10)}${HORA_DO_PRAZO_UTC}`);
  if ([agoraMs, envioMs, prazoMs].some(Number.isNaN)) return null;

  const candidatos = [
    envioMs + LEMBRETE_APOS_ENVIO_HORAS * HORA_MS,
    prazoMs - LEMBRETE_ANTES_DO_PRAZO_HORAS * HORA_MS
  ]
    .filter((instante) => instante > agoraMs && instante <= prazoMs)
    .sort((a, b) => a - b);

  const proximo = candidatos[0];
  return proximo === undefined ? null : new Date(proximo).toISOString();
}

/** Os campos que todo tipo calcula do mesmo jeito a partir de envio e prazo. */
function prazos(
  enviadoEm: string,
  prazo: string,
  agora: string
): Pick<
  Solicitacao,
  | 'enviadoEm'
  | 'esperandoDias'
  | 'prazo'
  | 'prazoEmDias'
  | 'estado'
  | 'proximoAutomaticoEm'
> {
  const prazoEmDias = diasEntre(agora, prazo);
  return {
    enviadoEm,
    esperandoDias: Math.max(0, diasEntre(enviadoEm, agora)),
    prazo,
    prazoEmDias,
    estado: estadoDoPrazo(prazoEmDias),
    proximoAutomaticoEm: proximoLembreteAutomatico(enviadoEm, prazo, agora)
  };
}

/* ------------------------------------------------------------------ *
 * Índices, montados uma vez por leitura
 * ------------------------------------------------------------------ */

type IndiceDeLembretes = Map<string, { total: number; ultimoEm: string }>;

/** Lembretes do questionário por candidatura (`state.fitReminders`). */
function lembretesPorCandidatura(state: DemoState): IndiceDeLembretes {
  const indice: IndiceDeLembretes = new Map();
  for (const lembrete of state.fitReminders ?? []) {
    const atual = indice.get(lembrete.applicationId);
    if (!atual) {
      indice.set(lembrete.applicationId, { total: 1, ultimoEm: lembrete.at });
    } else {
      atual.total += 1;
      if (lembrete.at > atual.ultimoEm) atual.ultimoEm = lembrete.at;
    }
  }
  return indice;
}

/**
 * Quando cada convite de colaborador foi reenviado pela última vez.
 *
 * O convite guarda só o contador (`resendCount`); a hora do reenvio está no
 * histórico, que o reducer escreve como "O convite INV-… foi reenviado".
 * Ler o histórico é o jeito de mostrar "último há 1 dia" sem campo novo.
 */
function ultimoReenvioPorConvite(state: DemoState): Map<string, string> {
  const indice = new Map<string, string>();
  for (const evento of state.history) {
    if (evento.action !== 'Convite reenviado') continue;
    const id = /^O convite (\S+) foi reenviado/.exec(evento.description)?.[1];
    if (!id) continue;
    const atual = indice.get(id);
    if (!atual || evento.at > atual) indice.set(id, evento.at);
  }
  return indice;
}

/* ------------------------------------------------------------------ *
 * Cada tipo de espera
 * ------------------------------------------------------------------ */

function questionariosDoCandidato(
  state: DemoState,
  agora: string
): Solicitacao[] {
  // O convite de cada candidatura, indexado uma vez: canal e hora do envio.
  const convites = new Map(
    getOutcomesBase().comunicacao.map((evento) => [
      evento.applicationId,
      evento
    ])
  );
  const lembretes = lembretesPorCandidatura(state);
  const linhas: Solicitacao[] = [];

  for (const application of state.applications) {
    if (getFitStatus(state, application) === 'respondido') continue;
    const job = getJob(application.jobId);
    // Vaga encerrada: ninguém espera mais essa resposta.
    if (!job || job.stage === 'encerrada') continue;
    const convite = convites.get(application.id);
    // Sem convite (candidatura de planilha, ainda sem envio) não há espera —
    // a analista ainda não mandou o link.
    if (!convite) continue;

    const talent = getTalent(application.talentId, state);
    const company = getCompany(job.companyId);
    const reenvios = lembretes.get(application.id);

    linhas.push({
      id: `questionario-do-candidato:${application.id}`,
      tipo: 'questionario-do-candidato',
      quem: talent?.name ?? application.id,
      quemDetalhe: null,
      contexto: `${job.title} · ${company?.name ?? job.companyId}`,
      ...prazos(
        convite.enviadoEm,
        addDias(application.appliedAt, CANDIDATE_FIT_DEADLINE_DAYS),
        agora
      ),
      canal: convite.canal,
      lembretes: {
        total: reenvios?.total ?? 0,
        ultimoEm: reenvios?.ultimoEm ?? null
      },
      applicationId: application.id,
      inviteId: null,
      companyId: job.companyId,
      jobId: job.id
    });
  }
  return linhas;
}

function consultasAoColaborador(
  state: DemoState,
  agora: string
): Solicitacao[] {
  const reenvios = ultimoReenvioPorConvite(state);
  const linhas: Solicitacao[] = [];

  for (const invite of state.cultureInvites ?? []) {
    if (invite.answeredAt) continue;
    const company = getCompany(invite.companyId);
    linhas.push({
      id: `consulta-ao-colaborador:${invite.id}`,
      tipo: 'consulta-ao-colaborador',
      // Sem nome, de propósito: o convite não tem (PRODUTO.md §5.2).
      quem: invite.corporateEmail,
      quemDetalhe: invite.area,
      contexto: company?.name ?? invite.companyId,
      ...prazos(invite.sentAt, invite.expiresAt, agora),
      canal: 'email',
      lembretes: {
        total: invite.resendCount,
        ultimoEm: reenvios.get(invite.id) ?? null
      },
      applicationId: null,
      inviteId: invite.id,
      companyId: invite.companyId,
      jobId: null
    });
  }
  return linhas;
}

function devolutivasDaEmpresa(state: DemoState, agora: string): Solicitacao[] {
  const linhas: Solicitacao[] = [];

  for (const referral of getRegisteredReferrals(state)) {
    if (!referral.createdAt) continue;
    const company = getCompany(referral.companyId);
    const job = getJob(referral.jobId);
    for (const item of referral.items) {
      if (lerDevolutiva(item.outcome).hiring !== 'pendente') continue;
      const application = getApplication(state, item.applicationId);
      const talent = application
        ? getTalent(application.talentId, state)
        : null;
      linhas.push({
        id: `devolutiva-da-empresa:${referral.id}:${item.applicationId}`,
        tipo: 'devolutiva-da-empresa',
        quem: company?.contactName ?? 'RH da empresa',
        quemDetalhe: `RH · ${company?.name ?? referral.companyId}`,
        contexto: `${talent?.name ?? item.applicationId} · ${job?.title ?? referral.jobId}`,
        ...prazos(
          referral.createdAt,
          addDias(referral.createdAt, DEVOLUTIVA_PRAZO_DIAS),
          agora
        ),
        // O relatório vai por e-mail ao contato do RH; a cobrança, pelo Mind.
        canal: company?.contactEmail ? 'email' : null,
        // Não há registro de cobrança à empresa no estado: a mensagem do Mind
        // é copiada e mandada de fora, sem ação que grave o envio.
        lembretes: { total: 0, ultimoEm: null },
        applicationId: item.applicationId,
        inviteId: null,
        companyId: referral.companyId,
        jobId: referral.jobId
      });
    }
  }
  return linhas;
}

function comoEstaSendo(state: DemoState, agora: string): Solicitacao[] {
  const linhas: Solicitacao[] = [];

  for (const situacao of getAcompanhamento(state)) {
    const marco = situacao.marcoAtual ?? situacao.pendentes[0];
    if (marco === undefined) continue;
    const talent = getTalent(situacao.talentId, state);
    const company = getCompany(situacao.companyId);
    // O "envio" é o dia do marco: é quando o link do check-in sai.
    const enviadoEm = `${addDias(situacao.contratadoEm, marco)}${HORA_DO_PRAZO_UTC}`;
    // A janela fecha `JANELA_DO_MARCO_DIAS` depois; o último dia é o anterior.
    const prazo = addDias(enviadoEm, JANELA_DO_MARCO_DIAS - 1);

    linhas.push({
      id: `como-esta-sendo:${situacao.applicationId}:${marco}`,
      tipo: 'como-esta-sendo',
      quem: talent?.name ?? situacao.applicationId,
      quemDetalhe: null,
      contexto: `aos ${marco} dias · ${company?.name ?? situacao.companyId}`,
      ...prazos(enviadoEm, prazo, agora),
      // O link do check-in é o da mensagem do Mind, que é de WhatsApp.
      canal: 'whatsapp',
      lembretes: { total: 0, ultimoEm: null },
      applicationId: situacao.applicationId,
      inviteId: null,
      companyId: situacao.companyId,
      jobId: situacao.jobId
    });
  }
  return linhas;
}

/* ------------------------------------------------------------------ *
 * Respondidos na janela
 * ------------------------------------------------------------------ */

/** Quantas respostas, de qualquer tipo, chegaram nos últimos 7 dias. */
function respondidosNaJanela(state: DemoState, agora: string): number {
  const inicio = addDias(agora, -JANELA_DE_RESPONDIDOS_DIAS);
  const hoje = agora.slice(0, 10);
  const naJanela = (iso: string | null | undefined): boolean => {
    if (!iso) return false;
    const dia = iso.slice(0, 10);
    return dia > inicio && dia <= hoje;
  };

  let total = 0;
  for (const resposta of state.fitResponses ?? []) {
    if (naJanela(resposta.answeredAt)) total += 1;
  }
  for (const invite of state.cultureInvites ?? []) {
    if (naJanela(invite.answeredAt)) total += 1;
  }
  for (const referral of getRegisteredReferrals(state)) {
    for (const item of referral.items) {
      if (naJanela(item.outcome?.hiringAt)) total += 1;
    }
  }
  for (const checkIn of state.checkIns ?? []) {
    if (naJanela(checkIn.respondidoEm)) total += 1;
  }
  return total;
}

/* ------------------------------------------------------------------ *
 * A leitura inteira
 * ------------------------------------------------------------------ */

/**
 * Tudo o que o IEL está esperando, já ordenado: o mais vencido no topo,
 * depois o que vence hoje, depois o que ainda tem prazo (o mais próximo
 * primeiro). Empate: quem espera há mais tempo.
 *
 * `agora` é o instante da leitura (`nowIso()`): o dia decide "esperando há"
 * e o prazo; a hora decide qual lembrete automático é o próximo.
 */
export function getSolicitacoes(
  state: DemoState,
  agora: string
): LeituraDeSolicitacoes {
  const linhas = [
    ...questionariosDoCandidato(state, agora),
    ...consultasAoColaborador(state, agora),
    ...devolutivasDaEmpresa(state, agora),
    ...comoEstaSendo(state, agora)
  ].sort(
    (a, b) => a.prazoEmDias - b.prazoEmDias || b.esperandoDias - a.esperandoDias
  );

  const porTipo: Record<TipoDeSolicitacao, number> = {
    'questionario-do-candidato': 0,
    'consulta-ao-colaborador': 0,
    'devolutiva-da-empresa': 0,
    'como-esta-sendo': 0
  };
  const porEstado: Record<EstadoDoPrazo, number> = {
    vencido: 0,
    'vence-hoje': 0,
    'no-prazo': 0
  };
  for (const linha of linhas) {
    porTipo[linha.tipo] += 1;
    porEstado[linha.estado] += 1;
  }

  return {
    linhas,
    contadores: {
      esperando: linhas.length,
      vencendoHoje: porEstado['vence-hoje'],
      vencidos: porEstado.vencido,
      respondidosNaJanela: respondidosNaJanela(state, agora)
    },
    porTipo,
    porEstado
  };
}

/* ------------------------------------------------------------------ *
 * Frases
 * ------------------------------------------------------------------ */

function dias(n: number): string {
  return `${n} ${n === 1 ? 'dia' : 'dias'}`;
}

/** "esperando há 3 dias" / "enviado hoje". */
export function fraseDaEspera(esperandoDias: number): string {
  return esperandoDias === 0 ? 'enviado hoje' : `há ${dias(esperandoDias)}`;
}

/** "vence em 1 dia" / "vence hoje" / "venceu há 2 dias". */
export function fraseDoPrazo(prazoEmDias: number): string {
  if (prazoEmDias === 0) return 'vence hoje';
  if (prazoEmDias > 0) return `vence em ${dias(prazoEmDias)}`;
  return `venceu há ${dias(-prazoEmDias)}`;
}

/**
 * "em 3 h" / "amanhã" / "em 2 dias" — ou, sem próximo, o porquê: "nenhum,
 * venceu" quando o prazo passou e "nenhum previsto" quando os dois horários
 * da regra já ficaram para trás.
 */
export function fraseDoProximoAutomatico(
  proximoEm: string | null,
  estado: EstadoDoPrazo,
  agora: string
): string {
  if (!proximoEm)
    return estado === 'vencido' ? 'nenhum, venceu' : 'nenhum previsto';
  const horas = Math.max(
    0,
    (Date.parse(proximoEm) - Date.parse(agora)) / HORA_MS
  );
  if (horas < 1) return 'em menos de 1 h';
  if (horas < 24) return `em ${Math.round(horas)} h`;
  const emDias = diasEntre(agora, proximoEm);
  return emDias <= 1 ? 'amanhã' : `em ${dias(emDias)}`;
}

/** "2 enviados · último há 1 dia" / "nenhum". */
export function fraseDosLembretes(
  lembretes: Solicitacao['lembretes'],
  agora: string
): string {
  if (lembretes.total === 0) return 'nenhum';
  const enviados = `${lembretes.total} ${lembretes.total === 1 ? 'enviado' : 'enviados'}`;
  if (!lembretes.ultimoEm) return enviados;
  const ha = Math.max(0, diasEntre(lembretes.ultimoEm, agora));
  return `${enviados} · último ${ha === 0 ? 'hoje' : `há ${dias(ha)}`}`;
}
