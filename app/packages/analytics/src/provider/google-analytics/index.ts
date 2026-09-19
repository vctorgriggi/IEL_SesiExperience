/** Provider Google Analytics 4 (GA4). */

import { keys } from '../../../keys';
import type { AnalyticsProvider } from '../types';
import { shouldDisableLocalhost } from '../lib';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (
      a: string,
      b: string,
      c?: Record<string, unknown>
    ) => void;
  }
}

type GaConfig = {
  measurementId?: string;
  disableLocalhost?: boolean;
  disablePageViews?: boolean;
};

let currentMeasurementId: string | null = null;

function init(config?: unknown): void {
  const c = config as GaConfig | undefined;
  const k = keys();
  const id =
    c?.measurementId ?? k.NEXT_PUBLIC_ANALYTICS_GA_MEASUREMENT_ID;
  const disableEnv =
    c === undefined
      ? k.NEXT_PUBLIC_ANALYTICS_LOCALHOST
      : c.disableLocalhost
        ? 'true'
        : undefined;
  if (!id || shouldDisableLocalhost(disableEnv)) return;

  currentMeasurementId = id;

  const gtag = (...args: unknown[]) => {
    window.dataLayer ??= [];
    window.dataLayer.push(args);
  };
  window.gtag = gtag as Window['gtag'];
  gtag('js', new Date());

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);

  const sendPageView =
    c?.disablePageViews !== true &&
    (c === undefined
      ? k.NEXT_PUBLIC_ANALYTICS_GA_DISABLE_PAGE_VIEWS_TRACKING !== 'true'
      : true);
  gtag('config', id, { send_page_view: sendPageView });
}

function track(name: string, properties?: Record<string, unknown>): void {
  const gtag = window.gtag;
  const gaId = currentMeasurementId ?? keys().NEXT_PUBLIC_ANALYTICS_GA_MEASUREMENT_ID;
  if (gtag && gaId) {
    const category =
      properties && typeof properties['category'] === 'string'
        ? properties['category']
        : undefined;
    gtag('event', name, { ...properties, event_category: category });
  }
}

function identify(userId: string, _traits?: Record<string, unknown>): void {
  const gtag = window.gtag;
  const gaId = currentMeasurementId ?? keys().NEXT_PUBLIC_ANALYTICS_GA_MEASUREMENT_ID;
  if (gtag && gaId) {
    gtag('config', gaId, { user_id: userId });
  }
}

const gaProvider: AnalyticsProvider = {
  init,
  track,
  identify
};

export default gaProvider;
