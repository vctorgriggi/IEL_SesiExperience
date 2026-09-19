/**
 * Base: https://api.abacatepay.com/v1, Bearer token.
 * Cached per secretKey (singleton per process).
 */

import type {
  AbacatePayBillingResponse,
  AbacatePayCreateBillingBody,
  AbacatePayCreateCustomerBody,
  AbacatePayCreateCustomerResponse
} from './types';

const ABACATEPAY_API_BASE = 'https://api.abacatepay.com/v1';

export type AbacatePayClientConfig = {
  secretKey: string;
};

export type AbacatePayClient = {
  createBilling(body: AbacatePayCreateBillingBody): Promise<AbacatePayBillingResponse>;
  createCustomer(body: AbacatePayCreateCustomerBody): Promise<AbacatePayCreateCustomerResponse>;
};

const clientCache = new Map<string, AbacatePayClient>();

function headers(secretKey: string, extra?: Record<string, string>) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${secretKey}`,
    ...extra
  };
}

function createAbacatePayClientInternal(secretKey: string): AbacatePayClient {
  return {
    async createBilling(
      body: AbacatePayCreateBillingBody
    ): Promise<AbacatePayBillingResponse> {
      const res = await fetch(`${ABACATEPAY_API_BASE}/billing/create`, {
        method: 'POST',
        headers: headers(secretKey),
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`AbacatePay createBilling failed (${res.status}): ${errorBody || res.statusText}`);
      }
      return (await res.json()) as AbacatePayBillingResponse;
    },

    async createCustomer(
      body: AbacatePayCreateCustomerBody
    ): Promise<AbacatePayCreateCustomerResponse> {
      const res = await fetch(`${ABACATEPAY_API_BASE}/customer/create`, {
        method: 'POST',
        headers: headers(secretKey),
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`AbacatePay createCustomer failed (${res.status}): ${errorBody || res.statusText}`);
      }
      return (await res.json()) as AbacatePayCreateCustomerResponse;
    }
  };
}

export function getAbacatePayClient(secretKey: string): AbacatePayClient {
  let client = clientCache.get(secretKey);
  if (!client) {
    client = createAbacatePayClientInternal(secretKey);
    clientCache.set(secretKey, client);
  }
  return client;
}

export function createAbacatePayClient(config: AbacatePayClientConfig): AbacatePayClient {
  return getAbacatePayClient(config.secretKey);
}
