/**
 * @workspace/analytics – Event tracking, funnels, retention.
 */

export { initAnalytics, trackEvent, identify, reset } from "./run";
export { useTrackEvent, usePageView } from "./hooks/use-analytics";
export type { AnalyticsEvent, AnalyticsProviderConfig } from "./types";
