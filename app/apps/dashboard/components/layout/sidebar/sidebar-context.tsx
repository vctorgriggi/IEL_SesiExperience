'use client';

import { createContext, useContext, type ReactNode } from 'react';

export type SidebarState = {
  open: boolean;
  onClose: () => void;
  onToggle: () => void;
};

const SidebarStateContext = createContext<SidebarState | null>(null);

export function SidebarStateProvider({
  open,
  onClose,
  onToggle,
  children
}: SidebarState & { children: ReactNode }) {
  return (
    <SidebarStateContext.Provider value={{ open, onClose, onToggle }}>
      {children}
    </SidebarStateContext.Provider>
  );
}

export function useSidebar(): SidebarState | null {
  return useContext(SidebarStateContext);
}
