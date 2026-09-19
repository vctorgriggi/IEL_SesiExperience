'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Loading03Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { routes } from '@workspace/routes';

const ORG_SWITCH_START = 'org-switch-start';
const HIDE_DELAY_MS = 500;
const MAX_VISIBLE_MS = 8_000;
const SELECT_ORG_PATH_PREFIX = routes.dashboard.select('');

function useOrgSwitchLoaderVisible() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    const handleStart = () => setVisible(true);
    window.addEventListener(ORG_SWITCH_START, handleStart);
    return () => window.removeEventListener(ORG_SWITCH_START, handleStart);
  }, []);

  useEffect(() => {
    if (!visible) return;

    const hideIfNotOnSelectPage = () => {
      if (!pathnameRef.current.startsWith(SELECT_ORG_PATH_PREFIX)) {
        setVisible(false);
      }
    };

    const hideAfterDelay = window.setTimeout(
      hideIfNotOnSelectPage,
      HIDE_DELAY_MS
    );
    const forceHide = window.setTimeout(
      () => setVisible(false),
      MAX_VISIBLE_MS
    );

    return () => {
      window.clearTimeout(hideAfterDelay);
      window.clearTimeout(forceHide);
    };
  }, [visible]);

  return visible;
}

function OrgSwitchOverlay() {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="status"
      aria-live="polite"
      aria-label="Trocando workspace"
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card px-8 py-8 shadow-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <HugeiconsIcon
            icon={Loading03Icon}
            size={28}
            className="animate-spin text-primary"
          />
        </div>
        <p className="text-sm font-medium text-foreground">
          Trocando workspace...
        </p>
        <p className="text-xs text-muted-foreground">
          Carregando sua organização
        </p>
      </div>
    </div>
  );
}

export function OrgSwitchLoader() {
  const visible = useOrgSwitchLoaderVisible();
  if (!visible) return null;
  return <OrgSwitchOverlay />;
}

export function dispatchOrgSwitchStart() {
  window.dispatchEvent(new CustomEvent(ORG_SWITCH_START));
}
