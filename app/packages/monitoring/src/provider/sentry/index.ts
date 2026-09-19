import {
  captureEvent,
  captureException,
  setUser,
  type Event as SentryEvent,
  type User as SentryUser
} from '@sentry/core';
import { captureRequestError, withSentryConfig } from '@sentry/nextjs';

import { keys } from '@workspace/monitoring/keys';

import type { ErrorContext, ErrorRequest, MonitoringProvider } from '../types';

async function resolveInitializer(): Promise<() => void> {
  if (typeof window !== 'undefined') {
    const { initializeSentryBrowserClient } =
      await import('./sentry.client.config');
    return initializeSentryBrowserClient;
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    const { initializeSentryEdgeClient } = await import('./sentry.edge.config');
    return initializeSentryEdgeClient;
  }

  const { initializeSentryServerClient } =
    await import('./sentry.server.config');
  return initializeSentryServerClient;
}

class SentryMonitoringProvider implements MonitoringProvider {
  public withConfig<C>(nextConfig: C): C {
    return withSentryConfig(nextConfig, {
      org: keys().MONITORING_SENTRY_ORG,
      project: keys().MONITORING_SENTRY_PROJECT,
      authToken: keys().MONITORING_SENTRY_AUTH_TOKEN, // Required for uploading source maps
      silent: process.env.NODE_ENV !== 'production', // Suppressing sdk build logs
      autoInstrumentServerFunctions: false,
      widenClientFileUpload: true,
      telemetry: false
    });
  }

  public async register(): Promise<void> {
    try {
      const initializer = await resolveInitializer();
      initializer();
    } catch (error) {
      console.error('[Sentry Monitoring] Registration failed:', error);
    }
  }

  public async captureRequestError(
    error: unknown,
    errorRequest: Readonly<ErrorRequest>,
    errorContext: Readonly<ErrorContext>
  ): Promise<void> {
    return captureRequestError(error, errorRequest, errorContext);
  }

  public captureError(error: unknown): string {
    return captureException(error);
  }

  public captureEvent<Extra extends SentryEvent>(
    event: string,
    extra?: Extra
  ): string {
    return captureEvent({
      message: event,
      ...(extra ?? {})
    });
  }

  public setUser(user: SentryUser): void {
    setUser(user);
  }
}

export default new SentryMonitoringProvider();
