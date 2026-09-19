export type AnalyticsProvider = {
  init(config?: unknown): void;
  track(name: string, properties?: Record<string, unknown>): void;
  identify?(userId: string, traits?: Record<string, unknown>): void;
  reset?(): void;
};
