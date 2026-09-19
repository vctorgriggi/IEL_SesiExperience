# @workspace/analytics

## Choosing the provider

Edit **`src/provider/index.ts`**: uncomment the line for the provider you use. No runtime resolution.

```ts
// export { default as AnalyticsProvider } from './himetrica';
export { default as AnalyticsProvider } from './posthog';
// export { default as AnalyticsProvider } from './google-analytics';
// export { default as AnalyticsProvider } from './umami';
```

Set the env vars for that provider (see below).

## Usage

```tsx
'use client';

import { useEffect } from 'react';
import { initAnalytics, usePageView, trackEvent } from '@workspace/analytics';

export function AnalyticsInit() {
  useEffect(() => {
    initAnalytics();
  }, []);
  usePageView();
  return null;
}

import { useTrackEvent } from '@workspace/analytics/hooks';

function MyButton() {
  const track = useTrackEvent();
  return (
    <button onClick={() => track('button_clicked', { id: 'cta' })}>
      Click
    </button>
  );
}
```

Or call `trackEvent(name, properties)` and `identify(userId, traits)` directly.

## Structure

- **`src/provider/types.ts`** – provider contract
- **`src/provider/index.ts`** – one export active (comment/uncomment)
- **`src/provider/himetrica|posthog|google-analytics|umami/index.ts`** – implementations
- **`src/hooks/use-analytics.tsx`** – `useTrackEvent`, `usePageView`
- **`keys.ts`** – env schema (Zod) for all providers

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_ANALYTICS_LOCALHOST` | Set to `'true'` to disable tracking (e.g. on localhost). Shared by all providers. |

### Himetrica

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_ANALYTICS_HIMETRICA_API_KEY` | Yes | API key |
| `NEXT_PUBLIC_ANALYTICS_HIMETRICA_AUTO_TRACK_PAGE_VIEWS` | No | Default true; set `'false'` to disable |
| `NEXT_PUBLIC_ANALYTICS_HIMETRICA_AUTO_TRACK_ERRORS` | No | Default true; set `'false'` to disable |
| `NEXT_PUBLIC_ANALYTICS_HIMETRICA_TRACK_VITALS` | No | Default true; set `'false'` to disable |
| `NEXT_PUBLIC_ANALYTICS_HIMETRICA_RESPECT_DO_NOT_TRACK` | No | Default true; set `'false'` to ignore DNT |

### PostHog

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_ANALYTICS_POSTHOG_KEY` | Yes | Project API key |
| `NEXT_PUBLIC_ANALYTICS_POSTHOG_HOST` | No | Default `https://us.i.posthog.com` |

### Google Analytics 4

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_ANALYTICS_GA_MEASUREMENT_ID` | Yes | GA4 Measurement ID (e.g. `G-XXXXXXXXXX`) |
| `NEXT_PUBLIC_ANALYTICS_GA_DISABLE_PAGE_VIEWS_TRACKING` | No | `'true'` to disable automatic page views |

`identify(userId, traits)` for GA4 only sends `user_id`; `traits` are not sent.

### Umami

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_ANALYTICS_UMAMI_HOST` | Yes | Umami script host URL |
| `NEXT_PUBLIC_ANALYTICS_UMAMI_WEBSITE_ID` | Yes | Website ID |
