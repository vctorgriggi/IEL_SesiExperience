export type AnalyticsEvent = Readonly<{
  name: string;
  properties?: Record<string, unknown>;
}>;

export type HimetricaConfig = Readonly<{
  apiKey: string;
  autoTrackPageViews?: boolean;
  autoTrackErrors?: boolean;
  trackVitals?: boolean;
  respectDoNotTrack?: boolean;
}>;

export type PosthogConfig = Readonly<{
  key: string;
  host?: string;
  disableLocalhost?: boolean;
}>;

export type GaConfig = Readonly<{
  measurementId: string;
  disableLocalhost?: boolean;
  disablePageViews?: boolean;
}>;

export type UmamiConfig = Readonly<{
  host: string;
  websiteId: string;
  disableLocalhost?: boolean;
}>;

export type AnalyticsProviderConfig = Readonly<{
  himetrica?: HimetricaConfig;
  posthog?: PosthogConfig;
  ga?: GaConfig;
  umami?: UmamiConfig;
}>;
