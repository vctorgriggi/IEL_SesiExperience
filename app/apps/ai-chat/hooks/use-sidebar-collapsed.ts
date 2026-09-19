'use client';

import { useEffect, useState } from 'react';

import { useLocalStorage } from '@workspace/ui';

const SIDEBAR_COLLAPSED_KEY = 'arki-ai-chat-sidebar-collapsed';

export function useSidebarCollapsed() {
  const [mounted, setMounted] = useState(false);
  const [stored, setStored] = useLocalStorage(SIDEBAR_COLLAPSED_KEY, false);

  useEffect(() => setMounted(true), []);

  return {
    collapsed: mounted && stored,
    toggle: () => setStored((current) => !current)
  };
}
