'use client';

import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

import type { BreadcrumbItem } from './page-breadcrumb';

type BreadcrumbContextValue = {
  items: BreadcrumbItem[];
  setItems: (items: BreadcrumbItem[]) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);
const EMPTY_BREADCRUMB: BreadcrumbItem[] = [];

function areBreadcrumbItemsEqual(
  current: BreadcrumbItem[],
  next: BreadcrumbItem[]
) {
  if (current === next) return true;
  if (current.length !== next.length) return false;

  for (let i = 0; i < current.length; i++) {
    if (
      current[i]?.label !== next[i]?.label ||
      current[i]?.href !== next[i]?.href
    ) {
      return false;
    }
  }

  return true;
}

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [items, setItemsState] = useState<BreadcrumbItem[]>(EMPTY_BREADCRUMB);

  const setItems = useCallback((nextItems: BreadcrumbItem[]) => {
    setItemsState((currentItems) =>
      areBreadcrumbItemsEqual(currentItems, nextItems)
        ? currentItems
        : nextItems
    );
  }, []);

  const value = useMemo(
    () => ({
      items,
      setItems
    }),
    [items, setItems]
  );

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);

  if (!context) {
    throw new Error('useBreadcrumb must be used within BreadcrumbProvider');
  }

  return context;
}

type BreadcrumbSyncProps = {
  items?: BreadcrumbItem[];
};

export function BreadcrumbSync({ items }: BreadcrumbSyncProps) {
  const { setItems } = useBreadcrumb();
  const nextItems = items ?? EMPTY_BREADCRUMB;

  useEffect(() => {
    setItems(nextItems);
  }, [nextItems, setItems]);

  useEffect(() => {
    return () => {
      setItems(EMPTY_BREADCRUMB);
    };
  }, [setItems]);

  return null;
}
