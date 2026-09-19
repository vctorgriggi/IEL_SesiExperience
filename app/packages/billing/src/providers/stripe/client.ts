import Stripe from 'stripe';

import { STRIPE_API_VERSION } from './constants';

const clientCache = new Map<string, Stripe>();

export function getStripeClient(secretKey: string): Stripe {
  let client = clientCache.get(secretKey);
  if (!client) {
    client = new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });
    clientCache.set(secretKey, client);
  }
  return client;
}
