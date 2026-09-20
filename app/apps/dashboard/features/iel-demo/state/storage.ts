import type { CheckIn } from '../analysis/acompanhamento';
import { buildInitialDemoState, DEMO_SCHEMA_VERSION } from '../fixtures';
import { DEMO_REFERENCE_DATE } from '../fixtures/companies';
import type {
  AnalysisByApplication,
  Application,
  CultureAnswer,
  CultureRespondentInvite,
  DemoState,
  Evidence
} from '../types';

export const DEMO_STORAGE_KEY = 'iel-demo-state';

/** Intervalo mínimo entre gravações: o campo de busca dispara a cada tecla. */
const PERSIST_INTERVAL_MS = 400;

/**
 * O que vai para o localStorage — e, no modo compartilhado, para a coluna
 * `estado` da sala no banco (`state/servidor.ts`). Um formato só, gravado em
 * dois lugares: o que o servidor devolve rehidrata pelo mesmo caminho do
 * navegador.
 *
 * A base tem centenas de candidaturas e milhares de registros, mas quase nada
 * disso muda durante a demonstração — é volume gerado a partir de uma semente
 * fixa, reconstruído igual a cada carga. Gravar tudo custaria alguns megabytes
 * por tecla digitada e estouraria a cota do navegador.
 *
 * Então guardamos apenas o que divergiu da base inicial. O resto é derivado de
 * novo na leitura.
 */
export type PersistedState = {
  schemaVersion: number;
  personaId: string;
  dataSources: DemoState['dataSources'];
  teams: DemoState['teams'];
  clarifications: DemoState['clarifications'];
  /** Pesos confirmados pela empresa durante a demonstração. */
  axisWeights: DemoState['axisWeights'];
  /**
   * Respostas de fit que não existiam na base inicial, ou que a substituíram.
   * Delta como o resto: a base gerada traz centenas de respostas idênticas a
   * cada carga, e gravá-las de novo seria repetir o que já se reconstrói.
   */
  changedFitResponses: DemoState['fitResponses'];
  /**
   * Check-ins que não existiam na base inicial, ou que a substituíram.
   * Delta por `id` como as respostas de fit: os três semeados voltam a cada
   * carga e não precisam ser gravados de novo.
   */
  changedCheckIns?: CheckIn[];
  referrals: DemoState['referrals'];
  history: DemoState['history'];
  appliedSyncEventIds: DemoState['appliedSyncEventIds'];
  comparison: DemoState['comparison'];
  referralList: DemoState['referralList'];
  ui: DemoState['ui'];
  /** Candidaturas cujo estado saiu do inicial. */
  changedApplications: Application[];
  /** Análises alteradas, por candidatura. */
  changedAnalysis: AnalysisByApplication;
  /** Evidências que não existiam na base inicial. */
  addedEvidences: Evidence[];
  /**
   * Respostas de cultura novas ou substituídas (M2).
   *
   * Entram no delta porque a resposta de um colaborador convidado muda a média
   * da empresa, e uma média que volta ao valor de fábrica depois de recarregar
   * a página desmentiria o "N de M responderam" da tela ao lado.
   *
   * Com o instrumento de 52 frases, um convite respondido traz um registro por
   * frase do bloco (cerca de 15) e a confirmação da gestão traz um por frase do
   * tema. Continua sendo delta por `id`: o que a base já reconstrói a cada
   * carga não é gravado de novo.
   */
  changedCultureAnswers: CultureAnswer[];
  /** Convites criados ou alterados (resposta, reenvio). */
  changedCultureInvites: CultureRespondentInvite[];
  /** Talentos que chegaram por importação de planilha (M6). */
  importedTalents: DemoState['importedTalents'];
  /** Importações já aplicadas, com a impressão digital de cada planilha. */
  spreadsheetImports: DemoState['spreadsheetImports'];
  /**
   * Ajustes da analista no instrumento (frases desligadas, `discrimina`
   * sobrescrito). É pequeno e já é um delta por natureza: vazio significa o
   * instrumento do cliente. Ausente em gravações anteriores a este campo.
   */
  instrumento?: DemoState['instrumento'];
};

type Baseline = {
  applications: Map<string, string>;
  analysis: Map<string, string>;
  evidenceIds: Set<string>;
  fitResponses: Map<string, string>;
  checkIns: Map<string, string>;
  cultureAnswers: Map<string, string>;
  cultureInvites: Map<string, string>;
};

let baseline: Baseline | null = null;

/** Índice da base inicial, montado uma vez por processo. */
function getBaseline(): Baseline {
  if (baseline) return baseline;

  const initial = buildInitialDemoState();
  baseline = {
    applications: new Map(
      initial.applications.map((application) => [
        application.id,
        JSON.stringify(application)
      ])
    ),
    analysis: new Map(
      Object.entries(initial.analysis).map(([id, entry]) => [
        id,
        JSON.stringify(entry)
      ])
    ),
    evidenceIds: new Set(initial.evidences.map((evidence) => evidence.id)),
    fitResponses: new Map(
      (initial.fitResponses ?? []).map((response) => [
        response.applicationId,
        JSON.stringify(response)
      ])
    ),
    checkIns: new Map(
      (initial.checkIns ?? []).map((checkIn) => [
        checkIn.id,
        JSON.stringify(checkIn)
      ])
    ),
    cultureAnswers: new Map(
      initial.cultureAnswers.map((answer) => [
        answer.id,
        JSON.stringify(answer)
      ])
    ),
    cultureInvites: new Map(
      (initial.cultureInvites ?? []).map((invite) => [
        invite.id,
        JSON.stringify(invite)
      ])
    )
  };
  return baseline;
}

/** Reduz o estado ao delta gravável. Pura: serve ao navegador e ao servidor. */
export function toPersisted(state: DemoState): PersistedState {
  const base = getBaseline();

  const changedApplications = state.applications.filter(
    (application) =>
      base.applications.get(application.id) !== JSON.stringify(application)
  );

  const changedAnalysis: AnalysisByApplication = {};
  for (const [applicationId, entry] of Object.entries(state.analysis)) {
    if (base.analysis.get(applicationId) !== JSON.stringify(entry)) {
      changedAnalysis[applicationId] = entry;
    }
  }

  const addedEvidences = state.evidences.filter(
    (evidence) => !base.evidenceIds.has(evidence.id)
  );

  const changedFitResponses = (state.fitResponses ?? []).filter(
    (response) =>
      base.fitResponses.get(response.applicationId) !== JSON.stringify(response)
  );

  const changedCheckIns = (state.checkIns ?? []).filter(
    (checkIn) => base.checkIns.get(checkIn.id) !== JSON.stringify(checkIn)
  );

  const changedCultureAnswers = state.cultureAnswers.filter(
    (answer) => base.cultureAnswers.get(answer.id) !== JSON.stringify(answer)
  );

  const changedCultureInvites = (state.cultureInvites ?? []).filter(
    (invite) => base.cultureInvites.get(invite.id) !== JSON.stringify(invite)
  );

  return {
    schemaVersion: DEMO_SCHEMA_VERSION,
    personaId: state.personaId,
    dataSources: state.dataSources,
    teams: state.teams,
    clarifications: state.clarifications,
    axisWeights: state.axisWeights,
    changedFitResponses,
    changedCheckIns,
    referrals: state.referrals,
    history: state.history,
    appliedSyncEventIds: state.appliedSyncEventIds,
    comparison: state.comparison,
    referralList: state.referralList,
    ui: state.ui,
    changedApplications,
    changedAnalysis,
    addedEvidences,
    changedCultureAnswers,
    changedCultureInvites,
    importedTalents: state.importedTalents ?? [],
    spreadsheetImports: state.spreadsheetImports ?? [],
    instrumento: state.instrumento
  };
}

/**
 * Reconstrói o estado inteiro: base fictícia + delta. Pura e tolerante a
 * campos ausentes, porque um delta gravado numa versão anterior do mesmo
 * `schemaVersion` pode não conhecer um campo novo.
 */
export function fromPersisted(persisted: PersistedState): DemoState {
  const state = buildInitialDemoState();

  const overrides = new Map(
    (persisted.changedApplications ?? []).map((application) => [
      application.id,
      application
    ])
  );

  const changedCultureAnswers = persisted.changedCultureAnswers ?? [];
  const changedCultureAnswerIds = new Set(
    changedCultureAnswers.map((answer) => answer.id)
  );
  const changedCultureInvites = persisted.changedCultureInvites ?? [];
  const changedInviteIds = new Set(
    changedCultureInvites.map((invite) => invite.id)
  );

  // A remessa semeada (`fixtures/acompanhamento.ts`) chegou depois de a
  // demonstração já ter sido aberta em muitos navegadores, e `referrals` é
  // gravado inteiro, não como delta. Sem isto, quem já tem estado no
  // localStorage nunca veria a remessa — e ela é a cena do acompanhamento.
  // Uma remessa da base que o estado gravado não conhece entra na frente;
  // as gravadas continuam mandando.
  const persistedReferrals = persisted.referrals ?? state.referrals;
  const persistedReferralIds = new Set(
    persistedReferrals.map((referral) => referral.id)
  );
  const changedCheckIns = persisted.changedCheckIns ?? [];
  const changedCheckInIds = new Set(changedCheckIns.map((c) => c.id));

  return {
    ...state,
    personaId: persisted.personaId ?? state.personaId,
    dataSources: persisted.dataSources ?? state.dataSources,
    teams: persisted.teams ?? state.teams,
    clarifications: persisted.clarifications ?? state.clarifications,
    axisWeights: persisted.axisWeights ?? state.axisWeights,
    referrals: [
      ...state.referrals.filter(
        (referral) => !persistedReferralIds.has(referral.id)
      ),
      ...persistedReferrals
    ],
    history: persisted.history ?? state.history,
    appliedSyncEventIds:
      persisted.appliedSyncEventIds ?? state.appliedSyncEventIds,
    comparison: persisted.comparison ?? state.comparison,
    referralList: persisted.referralList ?? state.referralList,
    ui: { ...state.ui, ...persisted.ui },
    applications: [
      ...state.applications.map(
        (application) => overrides.get(application.id) ?? application
      ),
      ...(persisted.changedApplications ?? []).filter(
        (application) =>
          !state.applications.some((entry) => entry.id === application.id)
      )
    ],
    cultureAnswers: [
      ...state.cultureAnswers.filter(
        (answer) => !changedCultureAnswerIds.has(answer.id)
      ),
      ...changedCultureAnswers
    ],
    cultureInvites: [
      ...(state.cultureInvites ?? []).filter(
        (invite) => !changedInviteIds.has(invite.id)
      ),
      ...changedCultureInvites
    ],
    importedTalents: persisted.importedTalents ?? state.importedTalents,
    spreadsheetImports:
      persisted.spreadsheetImports ?? state.spreadsheetImports,
    instrumento: persisted.instrumento ?? state.instrumento,
    analysis: { ...state.analysis, ...(persisted.changedAnalysis ?? {}) },
    evidences: [...state.evidences, ...(persisted.addedEvidences ?? [])],
    // A resposta gravada vence a da base: refazer o questionário substitui,
    // não acumula — o mesmo contrato do reducer.
    fitResponses: [
      ...(state.fitResponses ?? []).filter(
        (response) =>
          !(persisted.changedFitResponses ?? []).some(
            (changed) => changed.applicationId === response.applicationId
          )
      ),
      ...(persisted.changedFitResponses ?? [])
    ],
    // Mesma regra: o check-in gravado vence o da base, por id.
    checkIns: [
      ...(state.checkIns ?? []).filter(
        (checkIn) => !changedCheckInIds.has(checkIn.id)
      ),
      ...changedCheckIns
    ]
  };
}

/**
 * Leitura isolada do browser: o estado inicial do servidor é sempre a base
 * fictícia, e a hidratação do localStorage acontece depois da montagem para
 * evitar divergência de renderização.
 */
export function readPersistedState(): DemoState | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PersistedState;
    if (parsed.schemaVersion !== DEMO_SCHEMA_VERSION) {
      window.localStorage.removeItem(DEMO_STORAGE_KEY);
      return null;
    }

    return fromPersisted(parsed);
  } catch {
    return null;
  }
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let lastWriteAt = 0;
/** Último estado ainda não gravado, para descarregar antes de sair da página. */
let pendingState: DemoState | null = null;
let unloadHookInstalled = false;

function write(state: DemoState): void {
  lastWriteAt = Date.now();
  pendingState = null;
  try {
    window.localStorage.setItem(
      DEMO_STORAGE_KEY,
      JSON.stringify(toPersisted(state))
    );
  } catch {
    // Sem persistência o protótipo segue funcionando na sessão atual.
  }
}

/**
 * Grava o que ficou pendente antes da página sair.
 *
 * Sem isto, agir e navegar em seguida — registrar um encaminhamento e trocar
 * de persona, por exemplo — perderia a última alteração, porque ela ainda
 * estaria esperando o intervalo do throttle.
 */
function flushPending(): void {
  if (!pendingState) return;
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  write(pendingState);
}

function installUnloadHook(): void {
  if (unloadHookInstalled || typeof window === 'undefined') return;
  if (typeof window.addEventListener !== 'function') return;
  unloadHookInstalled = true;
  window.addEventListener('pagehide', flushPending);
  window.addEventListener('visibilitychange', () => {
    if (
      typeof document !== 'undefined' &&
      document.visibilityState === 'hidden'
    )
      flushPending();
  });
}

/**
 * Grava já na primeira chamada e espaça as seguintes.
 *
 * Escrever a cada tecla digitada na busca travaria a interface; adiar todas as
 * gravações faria "salvar e recarregar" perder o progresso mais recente. O
 * meio-termo é gravar na borda de entrada e agrupar a rajada seguinte.
 */
export function persistState(state: DemoState): void {
  if (typeof window === 'undefined') return;

  installUnloadHook();
  pendingState = state;

  const elapsed = Date.now() - lastWriteAt;
  if (elapsed >= PERSIST_INTERVAL_MS) {
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
    write(state);
    return;
  }

  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    write(state);
  }, PERSIST_INTERVAL_MS - elapsed);
}

export function clearPersistedState(): void {
  if (typeof window === 'undefined') return;
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  lastWriteAt = 0;
  pendingState = null;
  try {
    window.localStorage.removeItem(DEMO_STORAGE_KEY);
  } catch {
    // Ignora: limpar é melhor esforço.
  }
}

/**
 * "Agora" da demonstração: o dia é sempre `DEMO_REFERENCE_DATE`, a hora é a
 * real. A base fictícia tem prazos (convites de 3 dias, questionário de 2)
 * ancorados nessa data; se o relógio real vencesse esses prazos, a demo
 * quebraria sozinha com o passar dos dias. Todo carimbo do reducer e todo
 * seletor de prazo passam por aqui — um relógio só.
 */
export function nowIso(): string {
  return `${DEMO_REFERENCE_DATE}T${new Date().toISOString().slice(11)}`;
}
