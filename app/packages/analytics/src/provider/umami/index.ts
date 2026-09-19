/** Provider de analytics Umami. */

import { keys } from '../../../keys';
import type { AnalyticsProvider } from '../types';
import { shouldDisableLocalhost } from '../lib';

declare global {
  interface Window {
    umami?: (ev: string, data?: Record<string, unknown>) => void;
  }
}

type UmamiConfig = { host?: string; websiteId?: string; disableLocalhost?: boolean };

function resolveConfig(config?: unknown): { host: string; websiteId: string } | null {
  const c = config as UmamiConfig | undefined;
  const k = keys();
  const host = c?.host ?? k.NEXT_PUBLIC_ANALYTICS_UMAMI_HOST;
  const websiteId =
    c?.websiteId ?? k.NEXT_PUBLIC_ANALYTICS_UMAMI_WEBSITE_ID;
  const disableEnv =
    c === undefined
      ? k.NEXT_PUBLIC_ANALYTICS_LOCALHOST
      : c.disableLocalhost
        ? 'true'
        : undefined;

  if (!host || !websiteId || shouldDisableLocalhost(disableEnv)) {
    return null;
  }
  return { host: host.replace(/\/$/, ''), websiteId };
}

function init(config?: unknown): void {
  const resolved = resolveConfig(config);
  if (!resolved) return;

  const { host, websiteId } = resolved;
  const script = document.createElement('script');
  script.async = true;
  script.defer = true;
  script.setAttribute('data-website-id', websiteId);
  script.src = `${host}/umami.js`;
  document.head.appendChild(script);
}

function track(name: string, properties?: Record<string, unknown>): void {
  window.umami?.(name, properties);
}

const umamiProvider: AnalyticsProvider = {
  init,
  track
};

export default umamiProvider;
