'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode
} from 'react';

import { toast } from '@workspace/ui';

import { buildInitialDemoState } from '../fixtures';
import type { DemoState, Persona } from '../types';
import { demoReducer, type DemoAction } from './reducer';
import { getPersona } from './selectors';
import { criarSincronia, SALA_PADRAO, type Sincronia } from './sincronia';
import {
  clearPersistedState,
  fromPersisted,
  persistState,
  readPersistedState,
  type PersistedState
} from './storage';

type DemoContextValue = {
  state: DemoState;
  dispatch: (action: DemoAction) => void;
  persona: Persona;
  /**
   * Falso até o estado do localStorage ser aplicado. No modo compartilhado
   * é verdadeiro desde o início: o servidor já entregou o estado.
   */
  isHydrated: boolean;
  resetDemo: () => void;
};

/** O que o layout de servidor lê da sala e entrega ao provider. */
export type EstadoInicialCompartilhado = {
  revisao: number;
  persisted: PersistedState;
};

type IelDemoProviderProps = {
  children: ReactNode;
  /**
   * `true`: o estado mora na sala do servidor e é o mesmo em todos os
   * aparelhos; nada de localStorage. Ausente: o modo de sempre, cada
   * navegador com o seu.
   */
  compartilhado?: boolean;
  /** Obrigatório com `compartilhado`; ignorado sem ele. */
  estadoInicial?: EstadoInicialCompartilhado | null;
  sala?: string;
};

/**
 * Ações que ficam no aparelho mesmo no modo compartilhado.
 *
 * `ui` são filtros e busca; `personaId` é quem está olhando esta tela. Se
 * fossem para o servidor, o celular do candidato herdaria a busca digitada
 * no notebook da analista, e trocar de persona num aparelho trocaria em
 * todos. `hydrate` e `reset` são do próprio provider — o servidor os
 * recusa, e o reinício tem caminho próprio (`resetDemo`).
 */
const ACOES_DO_APARELHO = new Set<DemoAction['type']>([
  'set-ui',
  'set-persona',
  'hydrate',
  'reset'
]);

/** Rehidrata do servidor sem perder o que é deste aparelho. */
function comOQueEDoAparelho(
  doServidor: DemoState,
  local: DemoState
): DemoState {
  return { ...doServidor, ui: local.ui, personaId: local.personaId };
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function IelDemoProvider({
  children,
  compartilhado = false,
  estadoInicial = null,
  sala = SALA_PADRAO
}: IelDemoProviderProps) {
  const [state, dispatchLocal] = useReducer(
    demoReducer,
    compartilhado ? estadoInicial : null,
    (inicial) =>
      inicial ? fromPersisted(inicial.persisted) : buildInitialDemoState()
  );
  const hydratedRef = useRef(compartilhado);
  const [, forceRender] = useReducer((count: number) => count + 1, 0);
  const stateRef = useRef(state);
  const sincroniaRef = useRef<Sincronia | null>(null);
  const revisaoInicial = estadoInicial?.revisao ?? 0;
  /*
   * O layout é dinâmico (lê `headers()`), então a cada navegação ele lê a
   * sala de novo e entrega outro `estadoInicial`. Se a revisão inicial
   * fosse dependência do efeito abaixo, cada troca de tela recriaria a
   * sincronia e a fila da anterior — com ações ainda não enviadas — seria
   * descartada. A revisão inicial só importa na primeira montagem; depois
   * quem manda é o que o servidor devolve.
   */
  const revisaoInicialRef = useRef(revisaoInicial);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Modo local: o estado inicial do servidor é sempre a base fictícia, e o
  // localStorage entra depois da montagem para não divergir do HTML.
  useEffect(() => {
    if (compartilhado) return;
    const persisted = readPersistedState();
    if (persisted) {
      dispatchLocal({ type: 'hydrate', state: persisted });
    }
    hydratedRef.current = true;
    forceRender();
  }, [compartilhado]);

  useEffect(() => {
    if (compartilhado || !hydratedRef.current) return;
    persistState(state);
  }, [state, compartilhado]);

  // Modo compartilhado: fila de envio e sondagem da sala.
  useEffect(() => {
    if (!compartilhado) return;
    const sincronia = criarSincronia({
      sala,
      revisaoInicial: revisaoInicialRef.current,
      aoReceber: ({ persisted }) => {
        dispatchLocal({
          type: 'hydrate',
          state: comOQueEDoAparelho(fromPersisted(persisted), stateRef.current)
        });
      },
      aoFalhar: (mensagem) => toast.warn(mensagem)
    });
    sincroniaRef.current = sincronia;
    const parar = sincronia.iniciar();
    return () => {
      parar();
      sincroniaRef.current = null;
    };
  }, [compartilhado, sala]);

  const dispatch = useCallback(
    (action: DemoAction) => {
      // Otimista: a tela responde na hora; o servidor confirma em seguida.
      dispatchLocal(action);
      if (compartilhado && !ACOES_DO_APARELHO.has(action.type)) {
        sincroniaRef.current?.enviar(action);
      }
    },
    [compartilhado]
  );

  const resetDemo = useCallback(() => {
    if (compartilhado) {
      dispatchLocal({ type: 'reset' });
      void sincroniaRef.current?.reiniciar();
      return;
    }
    clearPersistedState();
    dispatchLocal({ type: 'reset' });
  }, [compartilhado]);

  const value = useMemo<DemoContextValue>(
    () => ({
      state,
      dispatch,
      persona: getPersona(state),
      isHydrated: hydratedRef.current,
      resetDemo
    }),
    [state, dispatch, resetDemo]
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
