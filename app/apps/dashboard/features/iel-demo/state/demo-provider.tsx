'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode
} from 'react';

import { buildInitialDemoState } from '../fixtures';
import type { DemoState, Persona } from '../types';
import { demoReducer, type DemoAction } from './reducer';
import { getPersona } from './selectors';
import {
  clearPersistedState,
  persistState,
  readPersistedState
} from './storage';

type DemoContextValue = {
  state: DemoState;
  dispatch: (action: DemoAction) => void;
  persona: Persona;
  /** Falso até o estado do localStorage ser aplicado. */
  isHydrated: boolean;
  resetDemo: () => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

export function IelDemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    demoReducer,
    null,
    buildInitialDemoState
  );
  const hydratedRef = useRef(false);
  const [, forceRender] = useReducer((count: number) => count + 1, 0);

  useEffect(() => {
    const persisted = readPersistedState();
    if (persisted) {
      dispatch({ type: 'hydrate', state: persisted });
    }
    hydratedRef.current = true;
    forceRender();
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    persistState(state);
  }, [state]);

  const value = useMemo<DemoContextValue>(
    () => ({
      state,
      dispatch,
      persona: getPersona(state),
      isHydrated: hydratedRef.current,
      resetDemo: () => {
        clearPersistedState();
        dispatch({ type: 'reset' });
      }
    }),
    [state]
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useIelDemo(): DemoContextValue {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error(
      'useIelDemo precisa estar dentro de <IelDemoProvider> (rota /iel).'
    );
  }
  return context;
}
