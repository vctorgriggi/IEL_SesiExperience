/** Provider de analytics PostHog. */

import posthog from 'posthog-js';
import { keys } from '../../../keys';
import type { AnalyticsProvider } from '../types';
import { shouldDisableLocalhost } from '../lib';

const DEFAULT_API_HOST = 'https://us.i.posthog.com';

type PosthogConfig = { key?: string; host?: string; disableLocalhost?: boolean };

function resolveConfig(config?: unknown): { key: string; host: string } | null {
  const c = config as PosthogConfig | undefined;
  const k = keys();
  const key = c?.key ?? k.NEXT_PUBLIC_ANALYTICS_POSTHOG_KEY;
  const host =
    c?.host ?? k.NEXT_PUBLIC_ANALYTICS_POSTHOG_HOST ?? DEFAULT_API_HOST;
  const disableEnv =
    c === undefined
      ? k.NEXT_PUBLIC_ANALYTICS_LOCALHOST
      : c.disableLocalhost
        ? 'true'
        : undefined;

  const shouldDisable =
    shouldDisableLocalhost(disableEnv) ||
    (process.env.NODE_ENV === 'development' && !key);

  if (!key || shouldDisable) {
    return null;
  }
  return { key, host };
}

function init(config?: unknown): void {
  const resolved = resolveConfig(config);
  if (!resolved) return;

  const { key, host } = resolved;

  posthog.init(key, {
    api_host: host,
    person_profiles: 'identified_only',
    capture_pageview: false
  });
}

function track(name: string, properties?: Record<string, unknown>): void {
  posthog.capture?.(name, properties);
}

function identify(userId: string, traits?: Record<string, unknown>): void {
  posthog.identify?.(userId, traits);
}

function reset(): void {
  posthog.reset?.();
}

const posthogProvider: AnalyticsProvider = {
  init,
  track,
  identify,
  reset
};

export default posthogProvider;
