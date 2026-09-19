import { buildInitialDemoState, DEMO_SCHEMA_VERSION } from '../fixtures';
import type { DemoState } from '../types';

export const DEMO_STORAGE_KEY = 'iel-demo-state';

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

    const parsed = JSON.parse(raw) as Partial<DemoState>;
    if (parsed.schemaVersion !== DEMO_SCHEMA_VERSION) {
      window.localStorage.removeItem(DEMO_STORAGE_KEY);
      return null;
    }

    // Campos ausentes voltam ao padrão: versões antigas não quebram a tela.
    return { ...buildInitialDemoState(), ...parsed } as DemoState;
  } catch {
    return null;
  }
}

export function persistState(state: DemoState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Sem persistência o protótipo segue funcionando na sessão atual.
  }
}

export function clearPersistedState(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(DEMO_STORAGE_KEY);
  } catch {
    // Ignora: limpar é melhor esforço.
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}
