import 'server-only';

import {
  createAbacatePayProvider,
  createStripeProvider,
  type BillingProvider
} from '@workspace/billing';
import { db } from '@workspace/database';

function getBillingEnv() {
  return {
    provider: process.env.BILLING_PROVIDER as
      | 'stripe'
      | 'abacatepay'
      | undefined,
    stripeSecretKey: process.env.BILLING_STRIPE_SECRET_KEY,
    abacateSecretKey:
      process.env.BILLING_ABACATEPAY_SECRET_KEY ??
      process.env.ABACATEPAY_SECRET_KEY,
    dashboardUrl:
      process.env.NEXT_PUBLIC_DASHBOARD_URL ?? process.env.DASHBOARD_URL
  };
}

export function getBillingProvider(): BillingProvider | null {
  const env = getBillingEnv();
  if (env.provider === 'stripe') {
    if (!env.stripeSecretKey) {
      return null;
    }
    return createStripeProvider({ secretKey: env.stripeSecretKey }, db);
  }
  if (env.provider === 'abacatepay') {
    if (!env.abacateSecretKey) return null;
    return createAbacatePayProvider(
      {
        secretKey: env.abacateSecretKey,
        dashboardUrl: env.dashboardUrl ?? undefined
      },
      db
    );
  }
  return null;
}

export function getDashboardUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_DASHBOARD_URL ?? process.env.DASHBOARD_URL;
  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_DASHBOARD_URL ou DASHBOARD_URL obrigatório para cobrança'
    );
  }
  return url.replace(/\/$/, '');
}
