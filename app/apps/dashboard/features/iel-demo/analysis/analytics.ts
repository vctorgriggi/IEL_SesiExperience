/**
 * Indicadores do painel da analista: Início, Empresas, Candidatos,
 * Integrações e BI.
 *
 * Seletores puros. Cada um diz de onde vem o número:
 *
 * - **vivo** — lido do `DemoState` (vagas, candidaturas e respostas de agora).
 *   Muda durante a demonstração.
 * - **histórico** — lido de `fixtures/outcomes.ts`, o passado simulado de
 *   vagas encerradas: retorno das empresas, contratação, permanência e
 *   reaberturas. Não muda durante a demonstração.
 *
 * Retorno e permanência deixaram de ser só histórico: a devolutiva de um
 * clique (C3) que a empresa registra na página do relatório entra na mesma
 * base, dentro da mesma janela, e **sobrepõe** o passado simulado.
 * `getComposicaoDosIndicadores` devolve, por período, quanto do indicador vem
 * de devolutiva capturada e quanto vem do histórico — é o contrato que
 * permite ao painel dizer isso na tela em vez de esconder a mistura.
 *
 * **Recorte de demonstração.** O IEL-MT opera cerca de 2.500 vagas por mês; a
 * base tem umas 40 vagas ativas e algumas centenas de vagas encerradas no
 * histórico. Os absolutos são os da base, sem multiplicador nenhum: o que
 * deve ser lido são proporções e tendências.
 *
 * **Privacidade (PRODUTO.md §5, LGPD art. 6º, III).** Toda agregação por
 * grupo que possa apontar para alguém passa por `suprimirPequenos`: com menos
 * de `MIN_RECORTE` pessoas o grupo volta com `oculto: true` e os valores em
 * `null`, e a tela mostra "—". Nenhum seletor de BI devolve nome, e-mail ou id
 * de candidato — o histórico nem os tem.
 *
 * Todos os percentuais já saem arredondados para inteiro; variações em
 * pontos percentuais também. Dias e minutos saem com uma casa decimal.
 */

import { AXIS_LABEL } from '../copy';
import { ALL_JOBS, DEMO_REFERENCE_DATE } from '../fixtures';
import {
  CANAL_LABEL,
  getOutcomesBase,
  MIND_RH_START_DATE,
  MOTIVO_LABEL,
  RETORNO_LABEL,
  setorDoHistorico,
  WHATSAPP_PILOT_START_DATE,
  type CanalComunicacao,
  type ContratacaoHistorica,
  type EntregaEmailDia,
  type EventoComunicacao,
  type ExecucaoSincronizacao,
  type MotivoNaoContratacao,
  type NumeroDaPergunta,
  type RemessaHistorica,
  type RetornoEmpresa
} from '../fixtures/outcomes';
import {
  getAdherence,
  getApplicationsByJob,
  getCompany,
  getCompatibleCount,
  getCultureSampleProgress,
  getFitStatus,
  getJob,
  getRegisteredReferrals,
  getVisibleCompanies
} from '../state/selectors';
import type { DemoState, Job, Referral } from '../types';
import { ADHERENCE_THRESHOLD } from './adherence';
import { lerDevolutiva, temDevolutiva } from './devolutiva';
import { FIT_AXES, type FitAxisId } from './fit-axes';

export {
  CANAL_LABEL,
  MIND_RH_START_DATE,
  MOTIVO_LABEL,
  RETORNO_LABEL,
  WHATSAPP_PILOT_START_DATE
};
export type {
  CanalComunicacao,
  ExecucaoSincronizacao,
  EntregaEmailDia,
  MotivoNaoContratacao,
  RetornoEmpresa
};

/* ------------------------------------------------------------------ *
 * Tipos comuns
 * ------------------------------------------------------------------ */

export type Periodo = 'mes' | 'trimestre' | 'ano';

export const PERIODO_LABEL: Record<Periodo, string> = {
  mes: 'Últimos 30 dias',
  trimestre: 'Últimos 90 dias',
  ano: 'Últimos 12 meses'
};

/** Tamanho da janela, em dias. As janelas terminam na data de referência. */
export const PERIODO_DIAS: Record<Periodo, number> = {
  mes: 30,
  trimestre: 90,
  ano: 365
};

/**
 * Unidade do KPI.
 *
 * - `'p.p.'`: `valor` é percentual inteiro (0–100) e `variacao` vem em pontos
 *   percentuais.
 * - `'abs'`: contagem; `variacao` também é contagem.
 * - `'dias'` / `'min'`: média com uma casa; `variacao` na mesma unidade.
 */
export type Unidade = 'p.p.' | 'dias' | 'abs' | 'min';

export type FonteDoDado = 'vivo' | 'historico';

export type Kpi = {
  id: string;
  rotulo: string;
  /** `null` quando não há base para a conta (a tela mostra "—"). */
  valor: number | null;
  /** Diferença para a janela anterior de mesmo tamanho; `null` sem base. */
  variacao: number | null;
  unidade: Unidade;
  /** Variação pronta: "+3 no período", "+4 p.p.", "−1,5 dias". */
  variacaoTexto: string | null;
  fonte: FonteDoDado;
  /** Tamanho da base do cálculo na janela atual. */
  n: number;
  /** De onde vem o número, em uma frase, para tooltip. */
  descricao: string;
};

/** Grupo sujeito à regra de recorte mínimo. */
export type Suprimivel = { n: number; oculto: boolean };

export type EtapaDeFunil = Suprimivel & {
  id: string;
  rotulo: string;
  /** % sobre a primeira etapa; `null` quando oculto ou sem base. */
  pctDoInicio: number | null;
  /** % sobre a etapa anterior; `null` na primeira, quando oculto ou sem base. */
  pctDaAnterior: number | null;
  /** Casos ainda sem desfecho (ex.: contratados há menos de 90 dias). */
  emApuracao?: number;
};

/* ------------------------------------------------------------------ *
 * Privacidade
 * ------------------------------------------------------------------ */

/** Menor grupo que pode ser mostrado. */
export const MIN_RECORTE = 5;

/**
 * Marca como oculto todo grupo com menos de `min` pessoas.
 *
 * `limpar` recebe o grupo oculto e devolve a versão sem valores (os campos
 * numéricos em `null`); sem `limpar`, só a marca muda. O `n` é preservado
 * para a tela poder dizer "menos de 5".
 */
export function suprimirPequenos<T extends Suprimivel>(
  grupos: readonly T[],
  min: number = MIN_RECORTE,
  limpar?: (grupo: T) => T
): T[] {
  return grupos.map((grupo) => {
    if (grupo.n >= min) return { ...grupo, oculto: false };
    const oculto = { ...grupo, oculto: true };
    return limpar ? limpar(oculto) : oculto;
  });
}

/* ------------------------------------------------------------------ *
 * Utilitários
 * ------------------------------------------------------------------ */

const DAY_MS = 86_400_000;
const REFERENCE_MS = Date.parse(`${DEMO_REFERENCE_DATE}T12:00:00.000Z`);

function dateBefore(days: number): string {
  return new Date(REFERENCE_MS - days * DAY_MS).toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number): string {
  const ms = Date.parse(`${isoDate.slice(0, 10)}T12:00:00.000Z`);
  return new Date(ms + days * DAY_MS).toISOString().slice(0, 10);
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso.slice(0, 10)}T00:00:00.000Z`);
  const to = Date.parse(`${toIso.slice(0, 10)}T00:00:00.000Z`);
  return Math.round((to - from) / DAY_MS);
}

type Janela = { inicioExclusivo: string; fim: string };

/** Janela do período; `anterior` = a janela imediatamente antes. */
function janela(periodo: Periodo, anterior = false): Janela {
  const dias = PERIODO_DIAS[periodo];
  const deslocamento = anterior ? 1 : 0;
  return {
    inicioExclusivo: dateBefore(dias * (deslocamento + 1)),
    fim: dateBefore(dias * deslocamento)
  };
}

function naJanela(data: string, j: Janela): boolean {
  const dia = data.slice(0, 10);
  return dia > j.inicioExclusivo && dia <= j.fim;
}

function pct(parte: number, total: number): number | null {
  return total === 0 ? null : Math.round((100 * parte) / total);
}

function umaCasa(valor: number): number {
  return Math.round(valor * 10) / 10;
}

function media(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return umaCasa(valores.reduce((a, b) => a + b, 0) / valores.length);
}

function diff(atual: number | null, anterior: number | null): number | null {
  if (atual === null || anterior === null) return null;
  return umaCasa(atual - anterior);
}

function numeroBr(valor: number): string {
  return String(Math.abs(valor)).replace('.', ',');
}

function textoVariacao(
  variacao: number | null,
  unidade: Unidade
): string | null {
  if (variacao === null) return null;
  const sinal = variacao > 0 ? '+' : variacao < 0 ? '−' : '±';
  const numero = numeroBr(variacao);
  switch (unidade) {
    case 'abs':
      return `${sinal}${numero} no período`;
    case 'p.p.':
      return `${sinal}${numero} p.p.`;
    case 'dias':
      return `${sinal}${numero} ${Math.abs(variacao) === 1 ? 'dia' : 'dias'}`;
    case 'min':
      return `${sinal}${numero} min`;
  }
}

function kpi(dados: Omit<Kpi, 'variacaoTexto'>): Kpi {
  return {
    ...dados,
    variacaoTexto: textoVariacao(dados.variacao, dados.unidade)
  };
}

const MESES_ABREV = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez'
] as const;

/** "2026-03" → "mar/26". */
export function rotuloDoMes(mes: string): string {
  const [ano, numero] = mes.split('-');
  return `${MESES_ABREV[Number(numero) - 1] ?? mes}/${(ano ?? '').slice(2)}`;
}

/** Os 12 meses que as telas mostram, do mais antigo ao da referência. */
function ultimos12Meses(): string[] {
  const [ano, mes] = DEMO_REFERENCE_DATE.split('-').map(Number) as [
    number,
    number
  ];
  return Array.from({ length: 12 }, (_, index) => {
    const d = new Date(Date.UTC(ano, mes - 1 - (11 - index), 1));
    return d.toISOString().slice(0, 7);
  });
}

function vagasAtivas(): Job[] {
  return ALL_JOBS.filter((job) => job.stage !== 'encerrada');
}

/** Início das remessas "dos últimos 12 meses". */
const INICIO_12_MESES = dateBefore(365);

function remessas12Meses(): RemessaHistorica[] {
  return getOutcomesBase().remessas.filter(
    (r) => r.enviadaEm > INICIO_12_MESES
  );
}

/* ------------------------------------------------------------------ *
 * Devolutiva capturada ao vivo (C3) sobrepondo o histórico
 * ------------------------------------------------------------------ */

/**
 * Uma remessa com a procedência do dado colada nela.
 *
 * `'historico'` é o passado simulado de `fixtures/outcomes.ts`; `'vivo'` é um
 * encaminhamento registrado na demonstração cuja empresa já respondeu a
 * devolutiva de um clique. O rótulo existe para que a composição do indicador
 * (`getComposicaoDosIndicadores`) possa ser dita na tela em vez de ficar
 * implícita numa soma.
 */
type RemessaDoPeriodo = RemessaHistorica & { fonte: FonteDoDado };

type ContratacaoApurada = ContratacaoHistorica & { fonte: FonteDoDado };

/**
 * O encaminhamento vivo lido como remessa.
 *
 * O histórico e o estado vivo descrevem a mesma coisa — uma lista de até
 * cinco currículos entregue a uma empresa — em formatos diferentes. Traduzir
 * o vivo para o formato do histórico é o que permite ao indicador somar os
 * dois sem duas contas paralelas.
 *
 * `etapasDias` sai zerado fora do retorno: a captura mede quanto a empresa
 * demorou para responder, e não os dias de cada etapa interna do IEL. Nenhum
 * seletor de tempo por etapa lê esta lista, justamente por isso.
 */
function remessaDoEncaminhamento(
  state: DemoState,
  referral: Referral
): RemessaDoPeriodo | null {
  if (referral.state !== 'registrado' || !referral.createdAt) return null;

  const desfechos = referral.items.map((item) => lerDevolutiva(item.outcome));
  // Sem nenhuma resposta, o encaminhamento vivo não é um dado de devolutiva:
  // é justamente o silêncio que o indicador já contabiliza pelo histórico.
  if (!desfechos.some(temDevolutiva)) return null;

  const job = getJob(referral.jobId);
  const company = getCompany(referral.companyId);
  const candidaturas = getApplicationsByJob(state, referral.jobId);

  const contratou = desfechos.some((d) => d.hiring === 'contratou');
  const naoContratou = desfechos.some((d) => d.hiring === 'nao-contratou');
  const retorno: RetornoEmpresa = contratou
    ? 'contratou'
    : naoContratou
      ? 'nao-contratou'
      : 'sem-resposta';

  // O motivo da remessa é o mais citado entre os "não contratei" dela; empate
  // fica com o primeiro da lista, que é a ordem em que a empresa os leu.
  const motivos = desfechos
    .map((d) => d.hiringReason)
    .filter((motivo): motivo is MotivoNaoContratacao => motivo !== null);
  const motivo =
    retorno === 'nao-contratou' && motivos.length > 0
      ? (motivos
          .slice()
          .sort(
            (a, b) =>
              motivos.filter((m) => m === b).length -
              motivos.filter((m) => m === a).length
          )[0] ?? null)
      : null;

  const primeiraResposta = desfechos
    .map((d) => d.hiringAt)
    .filter((at): at is string => at !== null)
    .sort()[0];

  const contratados: ContratacaoHistorica[] = [];
  referral.items.forEach((item, indiceEnvio) => {
    const desfecho = lerDevolutiva(item.outcome);
    if (desfecho.hiring !== 'contratou' || !desfecho.hiringAt) return;
    const ficou =
      desfecho.retention === 'pendente'
        ? null
        : desfecho.retention === 'continua';
    contratados.push({
      indiceEnvio,
      aderencia: Math.round(
        getAdherence(state, item.applicationId)?.total ?? 0
      ),
      contratadoEm: desfecho.hiringAt,
      // Quem saiu antes dos 90 dias pode ter passado dos 30: o IEL não
      // perguntou, e responder por ele seria inventar desfecho.
      ficou30: ficou === true ? true : null,
      ficou90: ficou
    });
  });

  return {
    fonte: 'vivo',
    id: referral.id,
    vagaId: referral.jobId,
    cargo: job?.title ?? referral.jobId,
    companyId: referral.companyId,
    setor: setorDoHistorico(company?.sector ?? '—'),
    enviadaEm: referral.createdAt,
    curriculosRecebidos: candidaturas.length,
    questionariosRespondidos: candidaturas.filter(
      (application) => getFitStatus(state, application) === 'respondido'
    ).length,
    acimaDoCorte: getCompatibleCount(state, referral.jobId),
    curriculosEnviados: referral.items.length,
    enviados: referral.items.map((item) => ({
      aderencia: Math.round(
        getAdherence(state, item.applicationId)?.total ?? 0
      ),
      porPonto: []
    })),
    retorno,
    motivo,
    diasAteRetorno: primeiraResposta
      ? daysBetween(referral.createdAt, primeiraResposta)
      : null,
    contratados,
    etapasDias: {
      perfilEmpresa: null,
      ligacao: 0,
      questionarios: 0,
      listaFinal: 0,
      retornoEmpresa: primeiraResposta
        ? daysBetween(referral.createdAt, primeiraResposta)
        : 0
    }
  };
}

/** As devolutivas capturadas na demonstração, em formato de remessa. */
function remessasVivas(state: DemoState): RemessaDoPeriodo[] {
  return getRegisteredReferrals(state)
    .map((referral) => remessaDoEncaminhamento(state, referral))
    .filter((remessa): remessa is RemessaDoPeriodo => remessa !== null);
}

/**
 * As remessas do período: o histórico simulado **mais** o que a empresa
 * respondeu ao vivo.
 *
 * O vivo vem depois do histórico e nunca o duplica: as remessas históricas
 * têm id `HIST-REM-…` e vaga `HIST-VAG-…`, que nenhuma vaga do catálogo usa.
 */
function remessasNaJanela(
  state: DemoState | null,
  j: Janela
): RemessaDoPeriodo[] {
  const historico: RemessaDoPeriodo[] = getOutcomesBase()
    .remessas.filter((r) => naJanela(r.enviadaEm, j))
    .map((r) => ({ ...r, fonte: 'historico' as const }));
  if (!state) return historico;
  return [
    ...historico,
    ...remessasVivas(state).filter((r) => naJanela(r.enviadaEm, j))
  ];
}

/**
 * Contratações cuja permanência já é fato dentro da janela.
 *
 * No histórico, o marco é o dia 90 da contratação: contar por data de
 * contratação misturaria gente que ainda não completou o prazo.
 *
 * Na devolutiva capturada, o marco é o **dia da resposta**. Uma saída antes
 * de 90 dias vira fato no dia em que a empresa avisa, não noventa dias depois
 * de uma contratação que já acabou; e "continua" só pode ser respondido
 * depois que o prazo fechou, porque é só então que a tela pergunta.
 */
function contratacoesApuradas90(
  state: DemoState | null,
  j: Janela
): ContratacaoApurada[] {
  const historico: ContratacaoApurada[] = getOutcomesBase()
    .remessas.flatMap((r) => r.contratados)
    .filter(
      (c) => c.ficou90 !== null && naJanela(addDays(c.contratadoEm, 90), j)
    )
    .map((c) => ({ ...c, fonte: 'historico' as const }));
  if (!state) return historico;

  const vivas: ContratacaoApurada[] = [];
  for (const referral of getRegisteredReferrals(state)) {
    for (const [indiceEnvio, item] of referral.items.entries()) {
      const desfecho = lerDevolutiva(item.outcome);
      if (
        desfecho.hiring !== 'contratou' ||
        desfecho.retention === 'pendente' ||
        !desfecho.retentionAt ||
        !desfecho.hiringAt ||
        !naJanela(desfecho.retentionAt, j)
      ) {
        continue;
      }
      vivas.push({
        fonte: 'vivo',
        indiceEnvio,
        aderencia: Math.round(
          getAdherence(state, item.applicationId)?.total ?? 0
        ),
        contratadoEm: desfecho.hiringAt,
        ficou30: desfecho.retention === 'continua' ? true : null,
        ficou90: desfecho.retention === 'continua'
      });
    }
  }
  return [...historico, ...vivas];
}

function permanenciaPct(contratados: ContratacaoHistorica[]): number | null {
  const apurados = contratados.filter((c) => c.ficou90 !== null);
  return pct(apurados.filter((c) => c.ficou90).length, apurados.length);
}

function retornoPct(lista: RemessaHistorica[]): number | null {
  return pct(
    lista.filter((r) => r.retorno !== 'sem-resposta').length,
    lista.length
  );
}

/* ------------------------------------------------------------------ *
 * Contrato: de onde vem cada parte do indicador
 * ------------------------------------------------------------------ */

/** Quanto de um indicador vem de cada procedência, no mesmo período. */
export type FonteDoIndicador = {
  /** Casos vindos da devolutiva que a empresa registrou na demonstração. */
  capturado: number;
  /** Casos vindos do histórico simulado de `fixtures/outcomes.ts`. */
  historico: number;
  /** `capturado + historico`: a base inteira do indicador na janela. */
  total: number;
  /** % da base que veio de devolutiva capturada. `null` quando não há base. */
  pctCapturado: number | null;
};

export type ComposicaoDosIndicadores = {
  periodo: Periodo;
  /** Base do KPI "Retorno das empresas": remessas enviadas no período. */
  retornoEmpresas: FonteDoIndicador;
  /** Base do KPI "Permanência em 90 dias": desfechos apurados no período. */
  permanencia90: FonteDoIndicador;
  /** Verdadeiro se qualquer um dos dois já tem devolutiva capturada. */
  temCaptura: boolean;
};

/**
 * **Contrato entre as telas: de onde vem cada indicador de devolutiva.**
 *
 * Os números de retorno e de permanência nasceram de histórico simulado,
 * porque o IEL não tinha como capturar o desfecho: "o RH não dá retorno pra
 * gente, de contratado" (00:05:33). A devolutiva de um clique (C3) passou a
 * capturar, e o que é capturado **sobrepõe** o histórico dentro da janela —
 * do mesmo jeito que a leitura de questionário já sobrepõe o passado gerado.
 *
 * Isto deixa o painel numa situação em que um número pode ser metade medição
 * e metade simulação. Esta função existe para que a tela possa **dizer isso
 * em voz alta** em vez de esconder a mistura: para um período, ela devolve
 * quantos casos da base vieram de devolutiva registrada ao vivo e quantos
 * vieram do histórico.
 *
 * Como usar, do lado de quem desenha o painel:
 *
 * - `total === 0` → não há base; o KPI vem `null` e a tela mostra "—".
 * - `capturado === 0` → o número é inteiramente histórico simulado; mantenha
 *   o marcador de relógio do `KpiCard` e não o apresente como medição.
 * - `capturado > 0` → parte do número é devolutiva real. Vale escrever a
 *   proporção ("3 de 41 vêm de retorno registrado"), nunca apagar o resto.
 * - `pctCapturado` já vem arredondado para inteiro, como todo percentual
 *   deste arquivo.
 *
 * As contagens são **de casos na base do indicador**, não de percentuais: o
 * indicador em si continua saindo de `getInicioKpis`, e esta função só
 * descreve a procedência do que entrou nele. Os dois lêem exatamente as
 * mesmas janelas e os mesmos filtros, para que as contagens fechem.
 *
 * Não aplica recorte mínimo: aqui não há grupo de pessoas sendo exposto, só o
 * tamanho de duas bases. O `MIN_RECORTE` continua valendo nos seletores que
 * quebram por setor, mês ou faixa.
 */
export function getComposicaoDosIndicadores(
  state: DemoState,
  periodo: Periodo
): ComposicaoDosIndicadores {
  const atual = janela(periodo);

  const remessas = remessasNaJanela(state, atual);
  const apurados = contratacoesApuradas90(state, atual);

  const compor = (fontes: readonly FonteDoDado[]): FonteDoIndicador => {
    const capturado = fontes.filter((fonte) => fonte === 'vivo').length;
    const historico = fontes.length - capturado;
    return {
      capturado,
      historico,
      total: fontes.length,
      pctCapturado: pct(capturado, fontes.length)
    };
  };

  const retornoEmpresas = compor(remessas.map((r) => r.fonte));
  const permanencia90 = compor(apurados.map((c) => c.fonte));

  return {
    periodo,
    retornoEmpresas,
    permanencia90,
    temCaptura: retornoEmpresas.capturado > 0 || permanencia90.capturado > 0
  };
}

/** Primeira inscrição de cada vaga ativa: é a data em que ela "entrou". */
function inicioDasVagas(state: DemoState): Map<string, string> {
  const inicio = new Map<string, string>();
  for (const application of state.applications) {
    const atual = inicio.get(application.jobId);
    const dia = application.appliedAt.slice(0, 10);
    if (!atual || dia < atual) inicio.set(application.jobId, dia);
  }
  return inicio;
}

/* ------------------------------------------------------------------ *
 * Início
 * ------------------------------------------------------------------ */

export type InicioKpis = {
  vagasAtivas: Kpi;
  respostaQuestionario: Kpi;
  retornoEmpresas: Kpi;
  permanencia90: Kpi;
};

/**
 * Candidaturas que **têm** resposta, e não candidaturas que **geraram
 * registro**.
 *
 * Desde que a resposta passou a ser da pessoa e a valer 12 meses, alguém pode
 * chegar a uma vaga nova já respondida: as frases daquela empresa foram
 * respondidas em outra candidatura, dentro da validade. A mesa de seleção
 * mostra essa pessoa com aderência calculada — se o funil a contasse como
 * "não respondeu", o painel discordaria da tela ao lado sobre a mesma pessoa.
 *
 * `getFitStatus` já resolve isso: ele olha o que a vaga precisa e o que a
 * pessoa tem dentro da validade.
 */
function respondidasResolvidas(state: DemoState): Set<string> {
  const respondidas = new Set<string>();
  for (const application of state.applications) {
    if (getFitStatus(state, application) === 'respondido') {
      respondidas.add(application.id);
    }
  }
  return respondidas;
}

/**
 * Situação de resposta ao questionário das candidaturas das vagas ativas.
 * Fora do prazo ainda (até 2 dias) não conta: não respondeu *ainda*.
 */
function respostaDasVagasAtivas(state: DemoState, j: Janela) {
  const ativas = new Set(vagasAtivas().map((job) => job.id));
  const respondidas = respondidasResolvidas(state);
  let base = 0;
  let responderam = 0;
  for (const application of state.applications) {
    if (!ativas.has(application.jobId)) continue;
    if (!naJanela(application.appliedAt, j)) continue;
    const respondeu = respondidas.has(application.id);
    const noPrazo =
      daysBetween(application.appliedAt, DEMO_REFERENCE_DATE) <= 2;
    if (!respondeu && noPrazo) continue;
    base += 1;
    if (respondeu) responderam += 1;
  }
  return { base, responderam, valor: pct(responderam, base) };
}

/**
 * KPIs do topo do Início.
 *
 * - `vagasAtivas` (**vivo**): vagas do catálogo que não estão encerradas. A
 *   variação conta as vagas cuja primeira inscrição caiu no período.
 * - `respostaQuestionario` (**vivo**): % das candidaturas às vagas ativas,
 *   inscritas no período e já fora do prazo de 2 dias, que responderam o
 *   questionário. Variação contra a janela anterior.
 * - `retornoEmpresas` (**histórico + devolutiva capturada**): % das remessas
 *   enviadas no período em que a empresa devolveu contratou/não contratou.
 * - `permanencia90` (**histórico + devolutiva capturada**): % dos contratados
 *   cujo desfecho foi apurado no período e que continuavam na empresa.
 *
 * Os dois últimos deixam de ser só histórico assim que uma empresa responde a
 * devolutiva de um clique (C3): a captura entra na mesma base e o `fonte`
 * passa de `'historico'` para `'vivo'`, para o cartão parar de exibir o
 * marcador de "passado simulado" num número que já tem medição dentro.
 * `getComposicaoDosIndicadores` diz quanto veio de cada lado.
 *
 * Em `'ano'` a janela anterior fica fora do histórico e a variação dos
 * indicadores históricos vem `null`.
 */
export function getInicioKpis(state: DemoState, periodo: Periodo): InicioKpis {
  const atual = janela(periodo);
  const anterior = janela(periodo, true);

  const ativas = vagasAtivas();
  const inicio = inicioDasVagas(state);
  const novas = ativas.filter((job) => {
    const dia = inicio.get(job.id);
    return dia !== undefined && naJanela(dia, atual);
  }).length;

  const respostaAtual = respostaDasVagasAtivas(state, atual);
  const respostaAnterior = respostaDasVagasAtivas(state, anterior);

  const remessasAtuais = remessasNaJanela(state, atual);
  const remessasAnteriores = remessasNaJanela(state, anterior);
  const retornoAtual = retornoPct(remessasAtuais);
  const retornoAnterior = retornoPct(remessasAnteriores);

  const apuradosAtuais = contratacoesApuradas90(state, atual);
  const apuradosAnteriores = contratacoesApuradas90(state, anterior);

  // Quanto de cada indicador já é medição, e não passado simulado.
  const retornoCapturado = remessasAtuais.filter(
    (r) => r.fonte === 'vivo'
  ).length;
  const permanenciaCapturada = apuradosAtuais.filter(
    (c) => c.fonte === 'vivo'
  ).length;

  return {
    vagasAtivas: kpi({
      id: 'vagas-ativas',
      rotulo: 'Vagas ativas',
      valor: ativas.length,
      // Se todas as vagas ativas começaram dentro da janela, "+24 no período"
      // só repete o total: sem comparação é mais honesto.
      variacao: novas < ativas.length ? novas : null,
      unidade: 'abs',
      fonte: 'vivo',
      n: ativas.length,
      descricao:
        'Vagas da base que não estão encerradas. A variação conta as que receberam a primeira inscrição no período.'
    }),
    respostaQuestionario: kpi({
      id: 'resposta-questionario',
      rotulo: 'Responderam o questionário',
      valor: respostaAtual.valor,
      variacao: diff(respostaAtual.valor, respostaAnterior.valor),
      unidade: 'p.p.',
      fonte: 'vivo',
      n: respostaAtual.base,
      descricao:
        'Candidaturas às vagas ativas, inscritas no período e fora do prazo de 2 dias, que responderam o questionário.'
    }),
    retornoEmpresas: kpi({
      id: 'retorno-empresas',
      rotulo: 'Retorno das empresas',
      valor: retornoAtual,
      variacao: diff(retornoAtual, retornoAnterior),
      unidade: 'p.p.',
      fonte: retornoCapturado > 0 ? 'vivo' : 'historico',
      n: remessasAtuais.length,
      descricao:
        retornoCapturado > 0
          ? `Remessas enviadas no período em que a empresa devolveu o resultado. ${retornoCapturado} ${retornoCapturado === 1 ? 'vem' : 'vêm'} de devolutiva registrada agora; o resto, do histórico simulado.`
          : 'Remessas enviadas no período em que a empresa devolveu o resultado (contratou ou não contratou).'
    }),
    permanencia90: kpi({
      id: 'permanencia-90',
      rotulo: 'Permanência em 90 dias',
      valor: permanenciaPct(apuradosAtuais),
      variacao: diff(
        permanenciaPct(apuradosAtuais),
        permanenciaPct(apuradosAnteriores)
      ),
      unidade: 'p.p.',
      fonte: permanenciaCapturada > 0 ? 'vivo' : 'historico',
      n: apuradosAtuais.length,
      descricao:
        permanenciaCapturada > 0
          ? `Contratados com permanência apurada no período que continuavam na empresa. ${permanenciaCapturada} ${permanenciaCapturada === 1 ? 'vem' : 'vêm'} de devolutiva registrada agora; o resto, do histórico simulado.`
          : 'Contratados que completaram 90 dias no período e continuavam na empresa.'
    })
  };
}

function montarFunil(
  etapas: { id: string; rotulo: string; n: number; emApuracao?: number }[]
): EtapaDeFunil[] {
  const primeira = etapas[0]?.n ?? 0;
  const brutas: EtapaDeFunil[] = etapas.map((etapa, index) => {
    const anteriorN = index === 0 ? null : (etapas[index - 1]?.n ?? 0);
    return {
      ...etapa,
      oculto: false,
      pctDoInicio: pct(etapa.n, primeira),
      pctDaAnterior: anteriorN === null ? null : pct(etapa.n, anteriorN)
    };
  });
  return suprimirPequenos(brutas, MIN_RECORTE, (etapa) => ({
    ...etapa,
    pctDoInicio: null,
    pctDaAnterior: null
  }));
}

/**
 * Funil do período (**histórico**): currículos recebidos → questionário
 * respondido → acima de 35% → enviados à empresa → contratados → ficaram 90
 * dias, somado sobre as vagas encerradas cuja remessa saiu no período.
 *
 * Todo o funil vem do histórico de propósito: misturar a primeira metade viva
 * com a segunda histórica daria etapas que não se contêm. `state` fica na
 * assinatura para o contrato não mudar quando houver dado real.
 *
 * "Contratados" são os que a empresa devolveu; "ficaram 90 dias" só conta
 * quem já completou o prazo — o resto vem em `emApuracao`, e o
 * `pctDaAnterior` dessa etapa é calculado só sobre quem já tem desfecho.
 */
export function getFunilDoPeriodo(
  state: DemoState,
  periodo: Periodo
): EtapaDeFunil[] {
  const lista = remessasNaJanela(state, janela(periodo));
  const soma = (f: (r: RemessaHistorica) => number) =>
    lista.reduce((total, r) => total + f(r), 0);
  const contratados = lista.flatMap((r) => r.contratados);

  const funil = montarFunil([
    {
      id: 'recebidos',
      rotulo: 'Currículos recebidos',
      n: soma((r) => r.curriculosRecebidos)
    },
    {
      id: 'respondidos',
      rotulo: 'Questionário respondido',
      n: soma((r) => r.questionariosRespondidos)
    },
    {
      id: 'acima-do-corte',
      rotulo: `Acima de ${ADHERENCE_THRESHOLD}%`,
      n: soma((r) => r.acimaDoCorte)
    },
    {
      id: 'enviados',
      rotulo: 'Enviados à empresa',
      n: soma((r) => r.curriculosEnviados)
    },
    { id: 'contratados', rotulo: 'Contratados', n: contratados.length },
    {
      id: 'ficaram-90',
      rotulo: 'Ficaram 90 dias',
      n: contratados.filter((c) => c.ficou90 === true).length,
      emApuracao: contratados.filter((c) => c.ficou90 === null).length
    }
  ]);

  // "Ficaram 90 dias" sobre a etapa anterior compara só com quem já tem
  // desfecho: dividir pelos contratados de ontem daria queda que não houve.
  const ultima = funil[funil.length - 1];
  if (ultima && !ultima.oculto) {
    ultima.pctDaAnterior = pct(
      ultima.n,
      contratados.length - (ultima.emApuracao ?? 0)
    );
  }
  return funil;
}

export type DuasPontas = {
  /** Empresas com vaga ativa cujo perfil fecha nos 10 temas. */
  empresasPerfilCompleto: Kpi;
  /** Candidaturas às vagas ativas que concluíram o questionário. */
  candidatosConcluiram: Kpi;
};

/** Empresas com vaga ativa visíveis para a persona. */
function empresasComVagaAtiva(state: DemoState) {
  const comVaga = new Set(vagasAtivas().map((job) => job.companyId));
  return getVisibleCompanies(state).filter((c) => comVaga.has(c.id));
}

/**
 * A consulta à equipe fechou: a amostra atingiu o mínimo de respostas da
 * equipe (`getCultureSampleProgress(...).ready`).
 *
 * A régua anterior — os temas fechados um a um — dava 0% em toda a base
 * de demonstração, porque cada ponto só fecha com 3 respostas da equipe
 * naquele ponto, e isso depende de quais perguntas cada colaborador
 * respondeu. Para o painel, a pergunta útil é "a empresa já respondeu?", e
 * os pontos em aberto continuam visíveis na tela da empresa.
 */
function perfilCompleto(state: DemoState, companyId: string): boolean {
  return getCultureSampleProgress(state, companyId).ready;
}

/**
 * "As duas pontas" (**vivo**): o lado da empresa (perfil completo nos 5
 * pontos) e o do candidato (questionário concluído, sobre quem já saiu do
 * prazo). Sem janela: é o retrato de agora.
 */
export function getDuasPontas(state: DemoState): DuasPontas {
  const empresas = empresasComVagaAtiva(state);
  const completas = empresas.filter((c) => perfilCompleto(state, c.id)).length;

  const tudo: Janela = {
    inicioExclusivo: '0000-00-00',
    fim: DEMO_REFERENCE_DATE
  };
  const resposta = respostaDasVagasAtivas(state, tudo);

  return {
    empresasPerfilCompleto: kpi({
      id: 'empresas-perfil-completo',
      rotulo: 'Empresas com a consulta fechada',
      valor: pct(completas, empresas.length),
      variacao: null,
      unidade: 'p.p.',
      fonte: 'vivo',
      n: empresas.length,
      descricao:
        'Empresas com vaga ativa em que a equipe já respondeu o mínimo da consulta. Os pontos ainda em aberto aparecem na tela de cada empresa.'
    }),
    candidatosConcluiram: kpi({
      id: 'candidatos-concluiram',
      rotulo: 'Candidatos que concluíram',
      valor: resposta.valor,
      variacao: null,
      unidade: 'p.p.',
      fonte: 'vivo',
      n: resposta.base,
      descricao:
        'Candidaturas às vagas ativas, já fora do prazo de 2 dias, com o questionário concluído.'
    })
  };
}

export type IntegracaoId = 'empregare' | 'email' | 'whatsapp';
export type IntegracaoEstado = 'ok' | 'atencao' | 'configurando';

export type IntegracaoStatus = {
  id: IntegracaoId;
  rotulo: string;
  estado: IntegracaoEstado;
  /** Frase pronta: "Sincronizado · hoje 06:00". */
  detalhe: string;
  /** ISO da última atividade conhecida, quando houver. */
  ultimaAtividade: string | null;
};

function diaCurto(data: string): string {
  if (data === DEMO_REFERENCE_DATE) return 'hoje';
  if (data === dateBefore(1)) return 'ontem';
  const [, mes, dia] = data.split('-');
  return `${dia}/${mes}`;
}

/**
 * Status das integrações (**histórico**, fixo na base): última execução do
 * Empregare, entrega de e-mail dos últimos 30 dias e o piloto de WhatsApp.
 */
export function getStatusIntegracoes(): IntegracaoStatus[] {
  const base = getOutcomesBase();
  const ultima = base.sincronizacoes[0];
  const email = getEntregaDeEmail();
  const convitesWhatsapp = base.comunicacao.filter(
    (e) => e.canal === 'whatsapp'
  ).length;

  return [
    {
      id: 'empregare',
      rotulo: 'Empregare',
      estado: ultima?.status === 'atencao' ? 'atencao' : 'ok',
      detalhe: ultima
        ? `Sincronizado · ${diaCurto(ultima.data)} ${ultima.hora}`
        : 'Sem sincronização registrada',
      ultimaAtividade: ultima?.executadaEm ?? null
    },
    {
      id: 'email',
      rotulo: 'E-mail',
      estado: 'ok',
      detalhe:
        email.entregaPct === null
          ? 'Conectado'
          : `Conectado · ${email.entregaPct}% entregues em 30 dias`,
      ultimaAtividade: null
    },
    {
      id: 'whatsapp',
      rotulo: 'WhatsApp',
      estado: 'configurando',
      detalhe: `Em configuração · piloto desde ${diaCurto(WHATSAPP_PILOT_START_DATE)} (${convitesWhatsapp} convites)`,
      ultimaAtividade: null
    }
  ];
}

/* ------------------------------------------------------------------ *
 * Empresas
 * ------------------------------------------------------------------ */

export type EmpresasKpis = {
  empresasComVagaAtiva: Kpi;
  perfilCompleto: Kpi;
  tempoParaCompletarPerfil: Kpi;
  roteirosGerados: Kpi;
  roteirosUsados: Kpi;
  retornoSobreCurriculos: Kpi;
};

function tempoMedioPerfil(j: Janela): { valor: number | null; n: number } {
  const dias = getOutcomesBase()
    .perfisEmpresa.filter((p) => p.completoEm && naJanela(p.completoEm, j))
    .map((p) => daysBetween(p.iniciadoEm, p.completoEm!));
  return { valor: media(dias), n: dias.length };
}

function retornoSobreCurriculos(lista: RemessaHistorica[]): number | null {
  const enviados = lista.reduce((t, r) => t + r.curriculosEnviados, 0);
  const comRetorno = lista
    .filter((r) => r.retorno !== 'sem-resposta')
    .reduce((t, r) => t + r.curriculosEnviados, 0);
  return pct(comRetorno, enviados);
}

/**
 * KPIs da aba Empresas.
 *
 * - `empresasComVagaAtiva` (**vivo**): variação = empresas cuja primeira vaga
 *   ativa recebeu inscrição no período.
 * - `perfilCompleto` (**vivo**): % dessas empresas com perfil fechado nos 5
 *   pontos. Sem variação: não há histórico do perfil das empresas vivas.
 * - `tempoParaCompletarPerfil` (**histórico**): dias entre abrir a consulta e
 *   o perfil fechar, nas consultas concluídas no período (empresas sem vaga
 *   ativa hoje).
 * - `roteirosGerados` / `roteirosUsados` (**histórico**, estado do roteiro
 *   por empresa com vaga ativa): gerados / usados no período.
 * - `retornoSobreCurriculos` (**histórico**): % dos currículos enviados no
 *   período cuja remessa teve retorno.
 */
export function getEmpresasKpis(
  state: DemoState,
  periodo: Periodo
): EmpresasKpis {
  const atual = janela(periodo);
  const anterior = janela(periodo, true);

  const empresas = empresasComVagaAtiva(state);
  const inicio = inicioDasVagas(state);
  const primeiraPorEmpresa = new Map<string, string>();
  for (const job of vagasAtivas()) {
    const dia = inicio.get(job.id);
    if (!dia) continue;
    const atualDia = primeiraPorEmpresa.get(job.companyId);
    if (!atualDia || dia < atualDia) primeiraPorEmpresa.set(job.companyId, dia);
  }
  const novas = empresas.filter((c) => {
    const dia = primeiraPorEmpresa.get(c.id);
    return dia !== undefined && naJanela(dia, atual);
  }).length;
  const completas = empresas.filter((c) => perfilCompleto(state, c.id)).length;

  const tempoAtual = tempoMedioPerfil(atual);
  const tempoAnterior = tempoMedioPerfil(anterior);

  const roteiros = getOutcomesBase().roteiros;
  const conta = (campo: 'geradoEm' | 'usadoEm', j: Janela) =>
    roteiros.filter((r) => r[campo] !== null && naJanela(r[campo]!, j)).length;
  const geradosAtual = conta('geradoEm', atual);
  const usadosAtual = conta('usadoEm', atual);

  const remessasAtuais = remessasNaJanela(state, atual);
  const retornoAtual = retornoSobreCurriculos(remessasAtuais);

  return {
    empresasComVagaAtiva: kpi({
      id: 'empresas-com-vaga-ativa',
      rotulo: 'Empresas com vaga ativa',
      valor: empresas.length,
      variacao: novas,
      unidade: 'abs',
      fonte: 'vivo',
      n: empresas.length,
      descricao:
        'Empresas com pelo menos uma vaga não encerrada. A variação conta as que abriram a primeira vaga no período.'
    }),
    perfilCompleto: kpi({
      id: 'perfil-completo',
      rotulo: 'Consulta à equipe fechada',
      valor: pct(completas, empresas.length),
      variacao: null,
      unidade: 'p.p.',
      fonte: 'vivo',
      n: empresas.length,
      descricao:
        'Empresas com vaga ativa em que a equipe já respondeu o mínimo da consulta. Os pontos ainda em aberto aparecem na tela de cada empresa.'
    }),
    tempoParaCompletarPerfil: kpi({
      id: 'tempo-perfil',
      rotulo: 'Tempo para completar o perfil',
      valor: tempoAtual.valor,
      variacao: diff(tempoAtual.valor, tempoAnterior.valor),
      unidade: 'dias',
      fonte: 'historico',
      n: tempoAtual.n,
      descricao:
        'Dias entre abrir a consulta à equipe e o perfil fechar, nas consultas concluídas no período.'
    }),
    roteirosGerados: kpi({
      id: 'roteiros-gerados',
      rotulo: 'Roteiros de ligação gerados',
      valor: geradosAtual,
      variacao: geradosAtual - conta('geradoEm', anterior),
      unidade: 'abs',
      fonte: 'historico',
      n: roteiros.length,
      descricao: 'Roteiros de ligação gerados no período.'
    }),
    roteirosUsados: kpi({
      id: 'roteiros-usados',
      rotulo: 'Roteiros usados na ligação',
      valor: usadosAtual,
      variacao: usadosAtual - conta('usadoEm', anterior),
      unidade: 'abs',
      fonte: 'historico',
      n: roteiros.length,
      descricao: 'Roteiros marcados como usados na ligação no período.'
    }),
    retornoSobreCurriculos: kpi({
      id: 'retorno-curriculos',
      rotulo: 'Retorno sobre currículos',
      valor: retornoAtual,
      variacao: diff(
        retornoAtual,
        retornoSobreCurriculos(remessasNaJanela(state, anterior))
      ),
      unidade: 'p.p.',
      fonte: 'historico',
      n: remessasAtuais.reduce((t, r) => t + r.curriculosEnviados, 0),
      descricao:
        'Currículos enviados no período cuja remessa recebeu retorno da empresa.'
    })
  };
}

export type ItemRetorno = {
  retorno: RetornoEmpresa;
  rotulo: string;
  n: number;
  pct: number | null;
};

export type ItemMotivo = {
  motivo: MotivoNaoContratacao;
  rotulo: string;
  n: number;
  /** % sobre as remessas "não contratou". */
  pct: number | null;
};

export type DistribuicaoRetorno = Suprimivel & {
  itens: ItemRetorno[];
  motivos: ItemMotivo[];
  motivoMaisCitado: {
    motivo: MotivoNaoContratacao;
    rotulo: string;
    pct: number;
  } | null;
};

export type GrupoRetorno = DistribuicaoRetorno & {
  /** Setor, ou mês `YYYY-MM`. */
  chave: string;
  rotulo: string;
};

export type RetornoDasEmpresas = DistribuicaoRetorno & {
  grupos: GrupoRetorno[];
};

const RETORNOS: RetornoEmpresa[] = [
  'contratou',
  'nao-contratou',
  'sem-resposta'
];
const MOTIVOS = Object.keys(MOTIVO_LABEL) as MotivoNaoContratacao[];

function distribuir(lista: RemessaHistorica[]): DistribuicaoRetorno {
  const naoContratou = lista.filter((r) => r.retorno === 'nao-contratou');
  const motivos = MOTIVOS.map((motivo) => {
    const n = naoContratou.filter((r) => r.motivo === motivo).length;
    return {
      motivo,
      rotulo: MOTIVO_LABEL[motivo],
      n,
      pct: pct(n, naoContratou.length)
    };
  }).sort((a, b) => b.n - a.n);
  const topo = motivos[0];
  return {
    n: lista.length,
    oculto: false,
    itens: RETORNOS.map((retorno) => {
      const n = lista.filter((r) => r.retorno === retorno).length;
      return {
        retorno,
        rotulo: RETORNO_LABEL[retorno],
        n,
        pct: pct(n, lista.length)
      };
    }),
    motivos,
    motivoMaisCitado:
      topo && topo.n > 0 && topo.pct !== null
        ? { motivo: topo.motivo, rotulo: topo.rotulo, pct: topo.pct }
        : null
  };
}

function limparDistribuicao<T extends DistribuicaoRetorno>(grupo: T): T {
  return {
    ...grupo,
    itens: grupo.itens.map((i) => ({ ...i, pct: null })),
    motivos: grupo.motivos.map((m) => ({ ...m, pct: null })),
    motivoMaisCitado: null
  };
}

/**
 * Retorno das empresas (**histórico**): contratou / não contratou / sem
 * resposta sobre as remessas enviadas no período, com os motivos do "não" e o
 * mais citado. `agruparPor` quebra por setor da empresa ou por mês de envio;
 * grupos com menos de 5 remessas vêm ocultos.
 */
export function getRetornoDasEmpresas(
  periodo: Periodo,
  agruparPor?: 'setor' | 'mes',
  /**
   * Opcional, e opcional de propósito: passar o estado faz a devolutiva
   * capturada na demonstração entrar na distribuição; omitir mantém a
   * leitura puramente histórica. Quem chamar sem estado não muda de
   * comportamento (ver `getComposicaoDosIndicadores`).
   */
  state?: DemoState
): RetornoDasEmpresas {
  const lista = remessasNaJanela(state ?? null, janela(periodo));
  const total = distribuir(lista);

  let grupos: GrupoRetorno[] = [];
  if (agruparPor) {
    const porChave = new Map<string, RemessaHistorica[]>();
    for (const r of lista) {
      const chave = agruparPor === 'setor' ? r.setor : r.enviadaEm.slice(0, 7);
      porChave.set(chave, [...(porChave.get(chave) ?? []), r]);
    }
    const brutos = [...porChave.entries()].map(([chave, itens]) => ({
      ...distribuir(itens),
      chave,
      rotulo: agruparPor === 'setor' ? chave : rotuloDoMes(chave)
    }));
    brutos.sort((a, b) =>
      agruparPor === 'mes' ? a.chave.localeCompare(b.chave) : b.n - a.n
    );
    grupos = suprimirPequenos(brutos, MIN_RECORTE, limparDistribuicao);
  }

  const [totalSuprimido] = suprimirPequenos(
    [total],
    MIN_RECORTE,
    limparDistribuicao
  );
  return { ...(totalSuprimido ?? total), grupos };
}

export type CoortePermanencia = Suprimivel & {
  /** `YYYY-MM` da contratação. */
  mes: string;
  rotulo: string;
  /** Contratados no mês (os que a empresa devolveu). */
  contratados: number;
  /** Quantos já completaram 30 / 90 dias (ou saíram antes). */
  apurados30: number;
  apurados90: number;
  ficaram30Pct: number | null;
  ficaram90Pct: number | null;
};

/**
 * Permanência aos 30 e 90 dias por coorte de contratação (**histórico**).
 *
 * Sem argumento, devolve os 12 meses; com `mesDeContratacao` (`YYYY-MM`),
 * só aquela coorte. `n` = contratados da coorte; coortes com menos de 5
 * vêm ocultas. Coortes recentes têm `apurados90` menor que `contratados`
 * (o prazo ainda corre) e, enquanto a coorte inteira não for apurada, o
 * percentual correspondente vem `null` — a tela mostra "em apuração".
 */
export function getPermanenciaPorCoorte(
  mesDeContratacao?: string
): CoortePermanencia[] {
  const contratados = getOutcomesBase().remessas.flatMap((r) => r.contratados);
  const meses = mesDeContratacao ? [mesDeContratacao] : ultimos12Meses();

  const brutas: CoortePermanencia[] = meses.map((mes) => {
    const coorte = contratados.filter((c) => c.contratadoEm.startsWith(mes));
    const a30 = coorte.filter((c) => c.ficou30 !== null);
    const a90 = coorte.filter((c) => c.ficou90 !== null);
    // Percentual só com a coorte inteira apurada: antes disso, quem já saiu
    // tem desfecho e quem ficou ainda não, e a taxa sairia puxada para baixo.
    const completa30 = a30.length === coorte.length;
    const completa90 = a90.length === coorte.length;
    return {
      mes,
      rotulo: rotuloDoMes(mes),
      n: coorte.length,
      oculto: false,
      contratados: coorte.length,
      apurados30: a30.length,
      apurados90: a90.length,
      ficaram30Pct: completa30
        ? pct(a30.filter((c) => c.ficou30).length, a30.length)
        : null,
      ficaram90Pct: completa90
        ? pct(a90.filter((c) => c.ficou90).length, a90.length)
        : null
    };
  });

  return suprimirPequenos(brutas, MIN_RECORTE, (c) => ({
    ...c,
    ficaram30Pct: null,
    ficaram90Pct: null
  }));
}

export type EstadoRoteiro = 'nao-gerado' | 'gerado' | 'aberto' | 'usado';

export const ESTADO_ROTEIRO_LABEL: Record<EstadoRoteiro, string> = {
  'nao-gerado': 'Não gerado',
  gerado: 'Gerado',
  aberto: 'Aberto',
  usado: 'Usado na ligação'
};

export type RoteiroDeLigacaoLinha = {
  companyId: string;
  empresa: string;
  geradoEm: string | null;
  abertoEm: string | null;
  usadoEm: string | null;
  estado: EstadoRoteiro;
};

export type RoteirosDeLigacao = {
  itens: RoteiroDeLigacaoLinha[];
  total: number;
  gerados: number;
  abertos: number;
  usados: number;
};

/**
 * Roteiros de ligação por empresa com vaga ativa visível para a persona
 * (estado do roteiro no **histórico**; lista de empresas **viva**). Só o
 * estado, nunca o conteúdo.
 */
export function getRoteirosDeLigacao(state: DemoState): RoteirosDeLigacao {
  const porEmpresa = new Map(
    getOutcomesBase().roteiros.map((r) => [r.companyId, r])
  );
  const itens = empresasComVagaAtiva(state).map((company) => {
    const r = porEmpresa.get(company.id);
    const geradoEm = r?.geradoEm ?? null;
    const abertoEm = r?.abertoEm ?? null;
    const usadoEm = r?.usadoEm ?? null;
    const estado: EstadoRoteiro = usadoEm
      ? 'usado'
      : abertoEm
        ? 'aberto'
        : geradoEm
          ? 'gerado'
          : 'nao-gerado';
    return {
      companyId: company.id,
      empresa: company.name,
      geradoEm,
      abertoEm,
      usadoEm,
      estado
    };
  });
  return {
    itens,
    total: itens.length,
    gerados: itens.filter((i) => i.geradoEm).length,
    abertos: itens.filter((i) => i.abertoEm).length,
    usados: itens.filter((i) => i.usadoEm).length
  };
}

/* ------------------------------------------------------------------ *
 * Candidatos
 * ------------------------------------------------------------------ */

export type FiltrosCandidatos = {
  jobId?: string;
  canal?: CanalComunicacao;
};

/**
 * Convites com o estado vivo sobreposto: quem respondeu durante a
 * demonstração passa a contar como concluído. Candidaturas que não existem
 * mais no estado saem; as criadas por planilha ainda não têm convite.
 */
function eventosVivos(state: DemoState): EventoComunicacao[] {
  const existentes = new Set(state.applications.map((a) => a.id));
  const respondidas = respondidasResolvidas(state);
  return getOutcomesBase()
    .comunicacao.filter((e) => existentes.has(e.applicationId))
    .map((e) => {
      if (e.concluido || !respondidas.has(e.applicationId)) return e;
      return {
        ...e,
        entregue: true,
        aberto: true,
        iniciado: true,
        concluido: true,
        paradaEm: null,
        dispositivo: e.dispositivo ?? 'celular',
        duracaoMin: e.duracaoMin ?? 5
      };
    });
}

function eventosFiltrados(
  state: DemoState,
  j: Janela,
  filtros?: FiltrosCandidatos
): EventoComunicacao[] {
  return eventosVivos(state).filter(
    (e) =>
      naJanela(e.enviadoEm, j) &&
      (!filtros?.jobId || e.jobId === filtros.jobId) &&
      (!filtros?.canal || e.canal === filtros.canal)
  );
}

export type CandidatosKpis = {
  taxaAbertura: Kpi;
  conclusao: Kpi;
  tempoMedioResposta: Kpi;
  viaCelular: Kpi;
  consentimentos: Kpi;
};

function metricasCandidatos(state: DemoState, eventos: EventoComunicacao[]) {
  const consentidas = new Set(
    (state.fitResponses ?? [])
      .filter((r) => r.consent.acceptedAt && r.consent.version)
      .map((r) => r.applicationId)
  );
  const entregues = eventos.filter((e) => e.entregue);
  const abertos = eventos.filter((e) => e.aberto);
  const iniciados = eventos.filter((e) => e.iniciado);
  const concluidos = eventos.filter((e) => e.concluido);
  // Quem passou do aceite registrou consentimento; quem concluiu precisa ter
  // o registro na resposta. Qualquer coisa abaixo de 100% é alarme.
  const comConsentimento = iniciados.filter(
    (e) => !e.concluido || consentidas.has(e.applicationId)
  );
  return {
    base: eventos.length,
    entregues: entregues.length,
    abertos: abertos.length,
    iniciados: iniciados.length,
    concluidos: concluidos.length,
    abertura: pct(abertos.length, entregues.length),
    conclusao: pct(concluidos.length, eventos.length),
    tempo: media(
      concluidos.map((e) => e.duracaoMin).filter((m): m is number => m !== null)
    ),
    celular: pct(
      abertos.filter((e) => e.dispositivo === 'celular').length,
      abertos.length
    ),
    consentimento: pct(comConsentimento.length, iniciados.length)
  };
}

/**
 * KPIs da aba Candidatos (**vivo**: convites às candidaturas da base,
 * com as respostas do estado sobrepostas), no período e filtros dados.
 *
 * - `taxaAbertura`: abertos / entregues.
 * - `conclusao`: concluídos / enviados.
 * - `tempoMedioResposta`: minutos entre começar e concluir, média.
 * - `viaCelular`: % das aberturas pelo celular.
 * - `consentimentos`: % dos questionários iniciados com aceite registrado.
 *
 * As candidaturas da base têm até ~60 dias: em `'trimestre'` e `'ano'` a
 * janela anterior fica vazia e a variação vem `null`.
 */
export function getCandidatosKpis(
  state: DemoState,
  periodo: Periodo,
  filtros?: FiltrosCandidatos
): CandidatosKpis {
  const atual = metricasCandidatos(
    state,
    eventosFiltrados(state, janela(periodo), filtros)
  );
  const anterior = metricasCandidatos(
    state,
    eventosFiltrados(state, janela(periodo, true), filtros)
  );

  return {
    taxaAbertura: kpi({
      id: 'taxa-abertura',
      rotulo: 'Taxa de abertura',
      valor: atual.abertura,
      variacao: diff(atual.abertura, anterior.abertura),
      unidade: 'p.p.',
      fonte: 'vivo',
      n: atual.entregues,
      descricao: 'Convites abertos sobre convites entregues.'
    }),
    conclusao: kpi({
      id: 'conclusao',
      rotulo: 'Concluíram o questionário',
      valor: atual.conclusao,
      variacao: diff(atual.conclusao, anterior.conclusao),
      unidade: 'p.p.',
      fonte: 'vivo',
      n: atual.base,
      descricao: 'Questionários concluídos sobre convites enviados.'
    }),
    tempoMedioResposta: kpi({
      id: 'tempo-resposta',
      rotulo: 'Tempo médio de resposta',
      valor: atual.tempo,
      variacao: diff(atual.tempo, anterior.tempo),
      unidade: 'min',
      fonte: 'vivo',
      n: atual.concluidos,
      descricao: 'Minutos entre começar e concluir o questionário.'
    }),
    viaCelular: kpi({
      id: 'via-celular',
      rotulo: 'Pelo celular',
      valor: atual.celular,
      variacao: diff(atual.celular, anterior.celular),
      unidade: 'p.p.',
      fonte: 'vivo',
      n: atual.abertos,
      descricao: 'Aberturas do convite feitas pelo celular.'
    }),
    consentimentos: kpi({
      id: 'consentimentos',
      rotulo: 'Consentimentos registrados',
      valor: atual.consentimento,
      variacao: diff(atual.consentimento, anterior.consentimento),
      unidade: 'p.p.',
      fonte: 'vivo',
      n: atual.iniciados,
      descricao:
        'Questionários iniciados com aceite registrado (versão e horário). Deve ser sempre 100%.'
    })
  };
}

export type FunilDaComunicacao = {
  total: EtapaDeFunil[];
  porCanal: {
    canal: CanalComunicacao;
    rotulo: string;
    etapas: EtapaDeFunil[];
  }[];
};

function funilDeEventos(eventos: EventoComunicacao[]): EtapaDeFunil[] {
  return montarFunil([
    { id: 'enviada', rotulo: 'Mensagem enviada', n: eventos.length },
    {
      id: 'entregue',
      rotulo: 'Entregue',
      n: eventos.filter((e) => e.entregue).length
    },
    {
      id: 'aberta',
      rotulo: 'Aberta',
      n: eventos.filter((e) => e.aberto).length
    },
    {
      id: 'iniciado',
      rotulo: 'Questionário iniciado',
      n: eventos.filter((e) => e.iniciado).length
    },
    {
      id: 'concluido',
      rotulo: 'Questionário concluído',
      n: eventos.filter((e) => e.concluido).length
    }
  ]);
}

/**
 * Funil da comunicação (**vivo**): enviada → entregue → aberta → iniciado
 * (passou do aceite) → concluído, no total e por canal. Etapas com menos de
 * 5 pessoas vêm ocultas (relevante com filtro de vaga).
 */
export function getFunilDaComunicacao(
  state: DemoState,
  periodo: Periodo,
  filtros?: FiltrosCandidatos
): FunilDaComunicacao {
  const eventos = eventosFiltrados(state, janela(periodo), filtros);
  const canais: CanalComunicacao[] = filtros?.canal
    ? [filtros.canal]
    : ['email', 'whatsapp'];
  return {
    total: funilDeEventos(eventos),
    porCanal: canais.map((canal) => ({
      canal,
      rotulo: CANAL_LABEL[canal],
      etapas: funilDeEventos(eventos.filter((e) => e.canal === canal))
    }))
  };
}

export type PontoDeAbandono = {
  ponto: 'aceite' | NumeroDaPergunta;
  /** "Aceite" ou "Frase 2 · Mudanças e novidades". */
  rotulo: string;
  n: number;
  /** % sobre quem abriu o convite. */
  pct: number | null;
};

export type OndeOCandidatoPara = Suprimivel & {
  /** Quem abriu o convite: a base do percentual. */
  abertos: number;
  pontos: PontoDeAbandono[];
};

/**
 * Onde o candidato para (**vivo**): abandonos no aceite e em cada uma das 10
 * perguntas, sobre quem abriu o convite. Quem ainda está no prazo não conta
 * como abandono. Com menos de 5 aberturas no recorte, tudo vem oculto.
 */
export function getOndeOCandidatoPara(
  state: DemoState,
  periodo: Periodo,
  filtros?: FiltrosCandidatos
): OndeOCandidatoPara {
  const eventos = eventosFiltrados(state, janela(periodo), filtros);
  const abertos = eventos.filter((e) => e.aberto).length;
  const pontos: PontoDeAbandono[] = [
    { ponto: 'aceite' as const, rotulo: 'Aceite' },
    // O candidato responde uma frase por tema, na ordem dos temas.
    ...FIT_AXES.map((axis, index) => ({
      ponto: (index + 1) as NumeroDaPergunta,
      rotulo: `Frase ${index + 1} · ${AXIS_LABEL[axis.id]}`
    }))
  ].map((p) => {
    const n = eventos.filter((e) => e.paradaEm === p.ponto).length;
    return { ...p, n, pct: pct(n, abertos) };
  });

  const [resultado] = suprimirPequenos(
    [{ n: abertos, oculto: false, abertos, pontos }],
    MIN_RECORTE,
    (r) => ({ ...r, pontos: r.pontos.map((p) => ({ ...p, pct: null })) })
  );
  return resultado!;
}

/* ------------------------------------------------------------------ *
 * Integrações
 * ------------------------------------------------------------------ */

/**
 * Log das 10 últimas sincronizações diárias do Empregare (06:00, Cuiabá),
 * da mais recente para a mais antiga (**histórico**). Uma delas vem com
 * `status: 'atencao'` e a observação da tentativa refeita.
 */
export function getLogDeSincronizacao(): ExecucaoSincronizacao[] {
  return getOutcomesBase().sincronizacoes;
}

export type EntregaDeEmail = {
  periodoDias: 30;
  enviados: number;
  entregues: number;
  abertos: number;
  devolvidos: number;
  entregaPct: number | null;
  aberturaPct: number | null;
  devolvidosPct: number | null;
  /** 30 dias, do mais antigo à referência. */
  porDia: EntregaEmailDia[];
};

/**
 * Entrega de e-mail nos últimos 30 dias (**histórico**, agregado dos
 * convites de e-mail da base). Abertura sobre entregues.
 */
export function getEntregaDeEmail(): EntregaDeEmail {
  const porDia = getOutcomesBase().entregaEmail30d;
  const soma = (campo: keyof Omit<EntregaEmailDia, 'data'>) =>
    porDia.reduce((t, d) => t + d[campo], 0);
  const enviados = soma('enviados');
  const entregues = soma('entregues');
  const abertos = soma('abertos');
  const devolvidos = soma('devolvidos');
  return {
    periodoDias: 30,
    enviados,
    entregues,
    abertos,
    devolvidos,
    entregaPct: pct(entregues, enviados),
    aberturaPct: pct(abertos, entregues),
    devolvidosPct: pct(devolvidos, enviados),
    porDia
  };
}

/* ------------------------------------------------------------------ *
 * BI
 * ------------------------------------------------------------------ */

export type FaixaAderenciaId = 'abaixo-35' | '35-59' | '60-mais';

export const FAIXAS_ADERENCIA: {
  id: FaixaAderenciaId;
  rotulo: string;
  min: number;
  /** Exclusivo. */
  max: number;
}[] = [
  { id: 'abaixo-35', rotulo: '< 35', min: 0, max: ADHERENCE_THRESHOLD },
  { id: '35-59', rotulo: '35–59', min: ADHERENCE_THRESHOLD, max: 60 },
  { id: '60-mais', rotulo: '≥ 60', min: 60, max: 101 }
];

export type FaixaPermanencia = Suprimivel & {
  faixa: FaixaAderenciaId;
  rotulo: string;
  /** Contratados com os 90 dias apurados. */
  apurados: number;
  ficaram: number | null;
  permanencia90Pct: number | null;
};

export type FiltrosBi = { setor?: string };

/**
 * Setores que aparecem no histórico dos últimos 12 meses, em ordem
 * alfabética: são as opções do filtro de setor do BI. Os nomes já vêm
 * unificados (`setorDoHistorico`).
 */
export function getSetoresDoHistorico(): string[] {
  return [...new Set(remessas12Meses().map((r) => r.setor))].sort((a, b) =>
    a.localeCompare(b)
  );
}

/** Contratados cujo marco de 90 dias caiu na janela, com o filtro de setor. */
function apuradosDoPeriodo(
  periodo: Periodo,
  filtros?: FiltrosBi
): ContratacaoHistorica[] {
  const j = janela(periodo);
  return getOutcomesBase()
    .remessas.filter((r) => !filtros?.setor || r.setor === filtros.setor)
    .flatMap((r) => r.contratados)
    .filter(
      (c) => c.ficou90 !== null && naJanela(addDays(c.contratadoEm, 90), j)
    );
}

/**
 * Aderência na entrada × permanência aos 90 dias (**histórico**), nas faixas
 * < 35, 35–59 e ≥ 60. Conta os contratados cujo marco de 90 dias caiu no
 * período; `n` = apurados na faixa, e faixa com menos de 5 vem oculta.
 *
 * Três faixas, não quatro: acima de 80 quase nunca passavam 5 contratados
 * num ano, e a última barra ficava oculta ou oscilando por uma pessoa.
 */
export function getAderenciaVsPermanencia(
  periodo: Periodo,
  filtros?: FiltrosBi
): FaixaPermanencia[] {
  const contratados = apuradosDoPeriodo(periodo, filtros);

  const brutas: FaixaPermanencia[] = FAIXAS_ADERENCIA.map((faixa) => {
    const grupo = contratados.filter(
      (c) => c.aderencia >= faixa.min && c.aderencia < faixa.max
    );
    const ficaram = grupo.filter((c) => c.ficou90).length;
    return {
      faixa: faixa.id,
      rotulo: faixa.rotulo,
      n: grupo.length,
      oculto: false,
      apurados: grupo.length,
      ficaram,
      permanencia90Pct: pct(ficaram, grupo.length)
    };
  });

  return suprimirPequenos(brutas, MIN_RECORTE, (f) => ({
    ...f,
    ficaram: null,
    permanencia90Pct: null
  }));
}

export type LeituraDoCorte = {
  corte: number;
  /** % dos questionários respondidos que ficaram abaixo do corte. */
  deFora: number | null;
  /** Permanência 90d de quem passa do corte; `null` se oculto. */
  permanenciaAcimaPct: number | null;
  /** Permanência 90d de quem não passa; `null` se oculto. */
  permanenciaAbaixoPct: number | null;
  /** Acima ÷ abaixo, uma casa; `null` quando um dos lados está oculto. */
  razao: number | null;
  nAcima: number;
  nAbaixo: number;
};

/**
 * O corte de 35% numa frase (**histórico**): quanto ele deixa de fora e
 * quantas vezes mais fica, aos 90 dias, quem passa dele.
 *
 * "De fora" sai do funil (questionários respondidos abaixo do corte, nas
 * remessas do período). A permanência usa a mesma base de
 * `getAderenciaVsPermanencia`. Lado com menos de 5 contratados fica oculto e
 * a razão vem `null`; também vem `null` se ninguém abaixo do corte ficou.
 */
export function getLeituraDoCorte(
  periodo: Periodo,
  filtros?: FiltrosBi
): LeituraDoCorte {
  const remessas = remessasNaJanela(null, janela(periodo)).filter(
    (r) => !filtros?.setor || r.setor === filtros.setor
  );
  const respondidos = remessas.reduce(
    (t, r) => t + r.questionariosRespondidos,
    0
  );
  const acimaNoFunil = remessas.reduce((t, r) => t + r.acimaDoCorte, 0);

  const apurados = apuradosDoPeriodo(periodo, filtros);
  const acima = apurados.filter((c) => c.aderencia >= ADHERENCE_THRESHOLD);
  const abaixo = apurados.filter((c) => c.aderencia < ADHERENCE_THRESHOLD);
  const permAcima = acima.length < MIN_RECORTE ? null : permanenciaPct(acima);
  const permAbaixo =
    abaixo.length < MIN_RECORTE ? null : permanenciaPct(abaixo);

  // A razão sai das contagens, não dos percentuais já arredondados.
  const taxa = (lista: ContratacaoHistorica[]) =>
    lista.filter((c) => c.ficou90).length / lista.length;
  const razao =
    permAcima === null || permAbaixo === null || taxa(abaixo) === 0
      ? null
      : umaCasa(taxa(acima) / taxa(abaixo));

  return {
    corte: ADHERENCE_THRESHOLD,
    deFora:
      respondidos < MIN_RECORTE
        ? null
        : pct(respondidos - acimaNoFunil, respondidos),
    permanenciaAcimaPct: permAcima,
    permanenciaAbaixoPct: permAbaixo,
    razao,
    nAcima: acima.length,
    nAbaixo: abaixo.length
  };
}

export type ReaberturaMes = {
  /** `YYYY-MM`. */
  mes: string;
  rotulo: string;
  reaberturas: number;
  /** Vagas abertas no mês: o denominador da taxa. */
  vagas: number;
  /** Reaberturas a cada 100 vagas abertas no mês, uma casa. */
  taxaPor100: number | null;
  /**
   * Média móvel de 3 meses da taxa (o mês e os dois anteriores), uma casa.
   * `null` no mês em curso: a linha para no último mês fechado.
   */
  mediaMovel3: number | null;
  /** O mês é o de entrada do Mind RH ou posterior. */
  aposMindRh: boolean;
  /** Mês da referência, ainda em curso. */
  parcial: boolean;
};

export type ReaberturasPorMes = {
  meses: ReaberturaMes[];
  /** `YYYY-MM` do mês de entrada, para a linha vertical do gráfico. */
  mesMindRh: string;
  /** Taxa a cada 100 vagas nos meses fechados antes da entrada. */
  taxaAntes: number | null;
  /** Taxa a cada 100 vagas nos meses fechados a partir da entrada. */
  taxaDepois: number | null;
  /** Variação da taxa, em % (negativo = queda). */
  variacaoPct: number | null;
};

/**
 * Reabertura a cada 100 vagas, por mês (**histórico**).
 *
 * Numerador: vagas que voltaram ao Empregare em até 90 dias depois de uma
 * contratação, pela data em que reabriram. Denominador: vagas abertas no mês
 * — as encerradas, pelo mês da lista, e, no mês em curso, as que ainda estão
 * em andamento. É o indicador que a diretoria acompanha e o critério de
 * sucesso do MVP; em taxa, um mês com menos vagas não parece melhor.
 *
 * Antes e depois são taxas agregadas (soma das reaberturas ÷ soma das vagas
 * dos meses fechados), não a média das taxas mensais: mês pequeno não pesa
 * como mês cheio. Contagem de vagas, não de pessoas: sem supressão.
 */
export function getReaberturasPorMes(filtros?: FiltrosBi): ReaberturasPorMes {
  const base = getOutcomesBase();
  const doSetor = (setor: string) => !filtros?.setor || setor === filtros.setor;
  const reaberturas = base.reaberturas.filter((r) => doSetor(r.setor));
  const remessas = base.remessas.filter((r) => doSetor(r.setor));
  const emAndamento = base.vagasEmAndamento.filter((v) => doSetor(v.setor));
  const mesMindRh = MIND_RH_START_DATE.slice(0, 7);
  const mesReferencia = DEMO_REFERENCE_DATE.slice(0, 7);

  const taxa = (reab: number, vagas: number) =>
    vagas === 0 ? null : umaCasa((100 * reab) / vagas);

  const brutos = ultimos12Meses().map((mes) => {
    const reab = reaberturas.filter((r) => r.reabertaEm.startsWith(mes)).length;
    const vagas =
      remessas.filter((r) => r.enviadaEm.startsWith(mes)).length +
      emAndamento.filter((v) => v.abertaEm.startsWith(mes)).length;
    return {
      mes,
      rotulo: rotuloDoMes(mes),
      reaberturas: reab,
      vagas,
      taxaPor100: taxa(reab, vagas),
      aposMindRh: mes >= mesMindRh,
      parcial: mes === mesReferencia
    };
  });

  const meses: ReaberturaMes[] = brutos.map((mes, index) => {
    if (mes.parcial) return { ...mes, mediaMovel3: null };
    const janela3 = brutos
      .slice(Math.max(0, index - 2), index + 1)
      .map((m) => m.taxaPor100)
      .filter((t): t is number => t !== null);
    return { ...mes, mediaMovel3: media(janela3) };
  });

  const fechados = meses.filter((m) => !m.parcial);
  const taxaDe = (lista: ReaberturaMes[]) =>
    taxa(
      lista.reduce((t, m) => t + m.reaberturas, 0),
      lista.reduce((t, m) => t + m.vagas, 0)
    );
  const taxaAntes = taxaDe(fechados.filter((m) => !m.aposMindRh));
  const taxaDepois = taxaDe(fechados.filter((m) => m.aposMindRh));

  return {
    meses,
    mesMindRh,
    taxaAntes,
    taxaDepois,
    variacaoPct:
      taxaAntes && taxaDepois !== null
        ? Math.round((100 * (taxaDepois - taxaAntes)) / taxaAntes)
        : null
  };
}

export type PontoQueMaisSepara = Suprimivel & {
  setor: string;
  /** Rótulo do ponto do dia a dia; `null` quando oculto ou sem saída. */
  ponto: string | null;
  pontoId: FitAxisId | null;
  /**
   * Quanto quem ficou 90 dias combinava a mais que quem saiu, nesse ponto,
   * em pontos percentuais. `null` quando oculto ou sem os dois grupos.
   */
  diferencaPp: number | null;
};

/**
 * O tema que mais pesa, por setor (**histórico**, últimos 12 meses).
 *
 * Para cada setor, entre os contratados com os 90 dias apurados: a diferença
 * de "combina" entre quem ficou e quem saiu, ponto a ponto, e o ponto em que
 * ela é maior. É a pergunta que a analista leva para a ligação com a empresa.
 *
 * `n` = contratados apurados do setor; com menos de 5, a linha vem oculta.
 * Setor sem ninguém que saiu (ou sem ninguém que ficou) não tem comparação e
 * vem com `diferencaPp: null`. Ordem: maior diferença primeiro, sem
 * comparação e ocultos no fim.
 */
export function getPontoQueMaisSeparaPorSetor(
  filtros?: FiltrosBi
): PontoQueMaisSepara[] {
  const porSetor = new Map<string, { ficou: number[][]; saiu: number[][] }>();
  for (const r of remessas12Meses()) {
    if (filtros?.setor && r.setor !== filtros.setor) continue;
    for (const c of r.contratados) {
      if (c.ficou90 === null) continue;
      const envio = r.enviados[c.indiceEnvio];
      if (!envio) continue;
      const grupo = porSetor.get(r.setor) ?? { ficou: [], saiu: [] };
      (c.ficou90 ? grupo.ficou : grupo.saiu).push(envio.porPonto);
      porSetor.set(r.setor, grupo);
    }
  }

  const brutas: PontoQueMaisSepara[] = [...porSetor.entries()].map(
    ([setor, { ficou, saiu }]) => {
      const n = ficou.length + saiu.length;
      if (ficou.length === 0 || saiu.length === 0) {
        return {
          setor,
          n,
          oculto: false,
          ponto: null,
          pontoId: null,
          diferencaPp: null
        };
      }
      const mediaNoPonto = (lista: number[][], indice: number) =>
        lista.reduce((t, l) => t + (l[indice] ?? 0), 0) / lista.length;
      const diferencas = FIT_AXES.map((axis, indice) => ({
        axis,
        diferenca: mediaNoPonto(ficou, indice) - mediaNoPonto(saiu, indice)
      }));
      const maior = [...diferencas].sort(
        (a, b) => b.diferenca - a.diferenca
      )[0]!;
      return {
        setor,
        n,
        oculto: false,
        ponto: AXIS_LABEL[maior.axis.id],
        pontoId: maior.axis.id,
        diferencaPp: Math.round(maior.diferenca)
      };
    }
  );

  const linhas = suprimirPequenos(brutas, MIN_RECORTE, (l) => ({
    ...l,
    ponto: null,
    pontoId: null,
    diferencaPp: null
  }));
  const ordem = (l: PontoQueMaisSepara) =>
    l.oculto ? 2 : l.diferencaPp === null ? 1 : 0;
  return linhas.sort(
    (a, b) =>
      ordem(a) - ordem(b) ||
      (b.diferencaPp ?? 0) - (a.diferencaPp ?? 0) ||
      b.n - a.n
  );
}

export type EtapaDaVagaId =
  | 'perfil-empresa'
  | 'ligacao'
  | 'questionarios'
  | 'lista-final'
  | 'retorno-empresa';

export type TempoDeEtapa = {
  id: EtapaDaVagaId;
  rotulo: string;
  /** Média em dias, uma casa. */
  dias: number;
  /** % do ciclo total. */
  pct: number;
};

export type TempoPorEtapa = {
  etapas: TempoDeEtapa[];
  totalDias: number;
  /** A etapa mais longa. */
  gargalo: EtapaDaVagaId;
  /** Vagas consideradas. */
  n: number;
};

/**
 * Onde o tempo da vaga vai embora (**histórico**): média de dias por etapa
 * nas vagas encerradas desde a entrada do Mind RH — antes dela o ciclo não
 * tinha a etapa de perfil. O retorno da empresa costuma ser metade do ciclo.
 */
export function getTempoPorEtapa(): TempoPorEtapa {
  const lista = getOutcomesBase().remessas.filter(
    (r) => r.enviadaEm >= MIND_RH_START_DATE
  );
  const definicoes: {
    id: EtapaDaVagaId;
    rotulo: string;
    valor: (r: RemessaHistorica) => number;
  }[] = [
    {
      id: 'perfil-empresa',
      rotulo: 'Perfil da empresa',
      valor: (r) => r.etapasDias.perfilEmpresa ?? 0
    },
    { id: 'ligacao', rotulo: 'Ligação', valor: (r) => r.etapasDias.ligacao },
    {
      id: 'questionarios',
      rotulo: 'Questionários',
      valor: (r) => r.etapasDias.questionarios
    },
    {
      id: 'lista-final',
      rotulo: 'Lista final',
      valor: (r) => r.etapasDias.listaFinal
    },
    {
      id: 'retorno-empresa',
      rotulo: 'Retorno da empresa',
      valor: (r) => r.etapasDias.retornoEmpresa
    }
  ];
  const medias = definicoes.map((d) => ({
    id: d.id,
    rotulo: d.rotulo,
    dias: media(lista.map(d.valor)) ?? 0
  }));
  const total = umaCasa(medias.reduce((t, m) => t + m.dias, 0));
  const etapas = medias.map((m) => ({
    ...m,
    pct: total === 0 ? 0 : Math.round((100 * m.dias) / total)
  }));
  const gargalo =
    [...etapas].sort((a, b) => b.dias - a.dias)[0]?.id ?? 'retorno-empresa';
  return { etapas, totalDias: total, gargalo, n: lista.length };
}

export type EmpresaReabertura = {
  companyId: string;
  empresa: string;
  setor: string;
  /** Vagas reabertas nos últimos 12 meses. */
  reaberturas: number;
  /** Vagas encerradas (remessas) nos últimos 12 meses. */
  vagas: number;
  /** Reaberturas / vagas. */
  taxaPct: number | null;
};

/**
 * Empresas com mais reabertura nos últimos 12 meses (**histórico**). Nome e
 * setor da empresa, nunca contato nem candidato. Empate desfeito pela taxa.
 */
export function getEmpresasComMaisReabertura(limite = 5): EmpresaReabertura[] {
  const base = getOutcomesBase();
  const nomes = new Map(base.empresas.map((e) => [e.companyId, e]));
  const reab = new Map<string, number>();
  for (const r of base.reaberturas) {
    if (r.reabertaEm <= INICIO_12_MESES) continue;
    reab.set(r.companyId, (reab.get(r.companyId) ?? 0) + 1);
  }
  const vagas = new Map<string, number>();
  for (const r of remessas12Meses()) {
    vagas.set(r.companyId, (vagas.get(r.companyId) ?? 0) + 1);
  }

  return [...reab.entries()]
    .map(([companyId, reaberturas]) => {
      const empresa = nomes.get(companyId);
      const total = vagas.get(companyId) ?? 0;
      return {
        companyId,
        empresa: empresa?.nome ?? companyId,
        setor: empresa?.setor ?? '—',
        reaberturas,
        vagas: total,
        taxaPct: pct(reaberturas, total)
      };
    })
    .sort(
      (a, b) =>
        b.reaberturas - a.reaberturas || (b.taxaPct ?? 0) - (a.taxaPct ?? 0)
    )
    .slice(0, Math.max(0, limite));
}
