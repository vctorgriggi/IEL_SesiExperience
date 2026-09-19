import { buildInitialDemoState, DEMO_SCHEMA_VERSION } from '../fixtures';
import type {
  AnalysisByApplication,
  Application,
  DemoState,
  Evidence
} from '../types';

export const DEMO_STORAGE_KEY = 'iel-demo-state';

/** Intervalo mínimo entre gravações: o campo de busca dispara a cada tecla. */
const PERSIST_INTERVAL_MS = 400;

/**
 * O que vai para o localStorage.
 *
 * A base tem centenas de candidaturas e milhares de registros, mas quase nada
 * disso muda durante a demonstração — é volume gerado a partir de uma semente
 * fixa, reconstruído igual a cada carga. Gravar tudo custaria alguns megabytes
 * por tecla digitada e estouraria a cota do navegador.
 *
 * Então guardamos apenas o que divergiu da base inicial. O resto é derivado de
 * novo na leitura.
 */
type PersistedState = {
  schemaVersion: number;
  personaId: string;
  dataSources: DemoState['dataSources'];
  teams: DemoState['teams'];
  clarifications: DemoState['clarifications'];
  /** Pesos confirmados pela empresa durante a demonstração. */
  axisWeights: DemoState['axisWeights'];
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
};

type Baseline = {
  applications: Map<string, string>;
  analysis: Map<string, string>;
  evidenceIds: Set<string>;
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
    evidenceIds: new Set(initial.evidences.map((evidence) => evidence.id))
  };
  return baseline;
}

function toPersisted(state: DemoState): PersistedState {
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

  return {
    schemaVersion: DEMO_SCHEMA_VERSION,
    personaId: state.personaId,
    dataSources: state.dataSources,
    teams: state.teams,
    clarifications: state.clarifications,
    axisWeights: state.axisWeights,
    referrals: state.referrals,
    history: state.history,
    appliedSyncEventIds: state.appliedSyncEventIds,
    comparison: state.comparison,
    referralList: state.referralList,
    ui: state.ui,
    changedApplications,
    changedAnalysis,
    addedEvidences
  };
}

function fromPersisted(persisted: PersistedState): DemoState {
  const state = buildInitialDemoState();

  const overrides = new Map(
    (persisted.changedApplications ?? []).map((application) => [
      application.id,
      application
    ])
  );

  return {
    ...state,
    personaId: persisted.personaId ?? state.personaId,
    dataSources: persisted.dataSources ?? state.dataSources,
    teams: persisted.teams ?? state.teams,
    clarifications: persisted.clarifications ?? state.clarifications,
    axisWeights: persisted.axisWeights ?? state.axisWeights,
    referrals: persisted.referrals ?? state.referrals,
    history: persisted.history ?? state.history,
    appliedSyncEventIds:
      persisted.appliedSyncEventIds ?? state.appliedSyncEventIds,
    comparison: persisted.comparison ?? state.comparison,
    referralList: persisted.referralList ?? state.referralList,
    ui: { ...state.ui, ...persisted.ui },
    applications: state.applications.map(
      (application) => overrides.get(application.id) ?? application
    ),
    analysis: { ...state.analysis, ...(persisted.changedAnalysis ?? {}) },
    evidences: [...state.evidences, ...(persisted.addedEvidences ?? [])]
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

export function nowIso(): string {
  return new Date().toISOString();
}
