/** Provider de analytics Himetrica. */

import { HimetricaClient } from '@himetrica/tracker-js';
import { keys } from '../../../keys';
import type { AnalyticsProvider } from '../types';
import { shouldDisableLocalhost } from '../lib';

type HimetricaConfig = {
  apiKey?: string;
  autoTrackPageViews?: boolean;
  autoTrackErrors?: boolean;
  trackVitals?: boolean;
  respectDoNotTrack?: boolean;
  disableLocalhost?: boolean;
};

let client: HimetricaClient | null = null;

function init(config?: unknown): void {
  const c = config as HimetricaConfig | undefined;
  const k = keys();
  const apiKey = c?.apiKey ?? k.NEXT_PUBLIC_ANALYTICS_HIMETRICA_API_KEY;
  const disableEnv =
    c === undefined ? k.NEXT_PUBLIC_ANALYTICS_LOCALHOST : c.disableLocalhost ? 'true' : undefined;
  if (!apiKey || shouldDisableLocalhost(disableEnv)) return;

  const autoTrackPageViews =
    c?.autoTrackPageViews ??
    (k.NEXT_PUBLIC_ANALYTICS_HIMETRICA_AUTO_TRACK_PAGE_VIEWS !== 'false');
  const autoTrackErrors =
    c?.autoTrackErrors ??
    (k.NEXT_PUBLIC_ANALYTICS_HIMETRICA_AUTO_TRACK_ERRORS !== 'false');
  const trackVitals =
    c?.trackVitals ??
    (k.NEXT_PUBLIC_ANALYTICS_HIMETRICA_TRACK_VITALS !== 'false');
  const respectDoNotTrack =
    c?.respectDoNotTrack ??
    (k.NEXT_PUBLIC_ANALYTICS_HIMETRICA_RESPECT_DO_NOT_TRACK !== 'false');

  client = new HimetricaClient({
    apiKey,
    autoTrackPageViews,
    autoTrackErrors,
    trackVitals,
    respectDoNotTrack
  });
}

function track(name: string, properties?: Record<string, unknown>): void {
  client?.track(name, properties);
}

function identify(userId: string, traits?: Record<string, unknown>): void {
  client?.identify({ metadata: { userId, ...traits } });
}

function reset(): void {
  client?.destroy();
  client = null;
}

const himetricaProvider: AnalyticsProvider = {
  init,
  track,
  identify,
  reset
};

export default himetricaProvider;
