'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode
} from 'react';

/** Um degrau do caminho no cabeçalho. Sem `href` é o degrau atual. */
export type PageHeaderCrumb = {
  label: string;
  href?: string;
};

/**
 * O que uma tela empresta ao cabeçalho da casca.
 *
 * O cabeçalho tem 48px e pertence à casca, não à tela; mas o caminho e as
 * ações são da tela — só ela sabe em que vaga está e o que o botão primário
 * faz ali. A tela declara, a casca desenha.
 */
export type PageHeaderContent = {
  breadcrumb?: PageHeaderCrumb[];
  actions?: ReactNode;
};

type PageHeaderStore = {
  get: () => PageHeaderContent;
  set: (content: PageHeaderContent) => void;
  subscribe: (listener: () => void) => () => void;
};

const PageHeaderContext = createContext<PageHeaderStore | null>(null);

const EMPTY: PageHeaderContent = {};

/**
 * A loja fica fora do estado do React de propósito.
 *
 * Se o conteúdo do cabeçalho morasse num `useState` acima das telas, cada
 * publicação re-renderizaria a tela que publicou — e como `actions` é um nó
 * novo a cada render, o efeito publicaria de novo, em laço. Assinando, só o
 * cabeçalho re-renderiza.
 */
export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const store = useMemo<PageHeaderStore>(() => {
    let content: PageHeaderContent = EMPTY;
    const listeners = new Set<() => void>();
    return {
      get: () => content,
      set: (next) => {
        content = next;
        for (const listener of listeners) listener();
      },
      subscribe: (listener) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      }
    };
  }, []);

  return (
    <PageHeaderContext.Provider value={store}>
      {children}
    </PageHeaderContext.Provider>
  );
}

function useStore(): PageHeaderStore | null {
  return useContext(PageHeaderContext);
}

/**
 * Publica caminho e ações no cabeçalho da casca.
 *
 * ```tsx
 * usePageHeader({
 *   breadcrumb: [
 *     { label: 'Vagas', href: routes.dashboard.iel.jobs.index },
 *     { label: company.name, href: routes.dashboard.iel.companies.byId(company.id) },
 *     { label: job.title }
 *   ],
 *   actions: <Button size="sm">Enviar 2 currículos</Button>
 * });
 * ```
 *
 * O último degrau é o da página atual e não leva `href`. Fora da casca do
 * analista (telas por link) a chamada não faz nada.
 */
export function usePageHeader(content: PageHeaderContent): void {
  const store = useStore();

  // Sem lista de dependências: publicar não re-renderiza quem publica.
  useEffect(() => {
    if (!store) return;
    store.set(content);
    return () => store.set(EMPTY);
  });
}

/** Leitura do cabeçalho. Só a casca usa. */
export function usePageHeaderContent(): PageHeaderContent {
  const store = useStore();
  const subscribe = store?.subscribe ?? (() => () => undefined);
  const get = store?.get ?? (() => EMPTY);
  return useSyncExternalStore(subscribe, get, get);
}
