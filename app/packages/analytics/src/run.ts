import { AnalyticsProvider } from "./provider";

let initialized = false;

export function initAnalytics(config?: unknown): void {
  if (typeof window === "undefined" || initialized) return;
  AnalyticsProvider.init(config);
  initialized = true;
}

export function trackEvent(
  name: string,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  initAnalytics();
  AnalyticsProvider.track(name, properties);
}

export function identify(
  userId: string,
  traits?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  initAnalytics();
  AnalyticsProvider.identify?.(userId, traits);
}

export function reset(): void {
  if (typeof window === "undefined") return;
  AnalyticsProvider.reset?.();
  initialized = false;
}
