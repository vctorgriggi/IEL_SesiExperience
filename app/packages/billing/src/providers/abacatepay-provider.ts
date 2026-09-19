import type { DatabaseType } from '@workspace/database';
import type { BillingProvider } from '../types';
import { createAbacatePayCheckoutAndPersist } from './abacatepay/create-billing';

export type AbacatePayProviderConfig = {
  secretKey: string;
  dashboardUrl?: string;
};

export function createAbacatePayProvider(
  config: AbacatePayProviderConfig,
  db: DatabaseType
): BillingProvider {
  return {
    async createCheckout(params) {
      const result = await createAbacatePayCheckoutAndPersist(
        db,
        config.secretKey,
        {
          organizationId: params.organizationId,
          organizationName: params.organizationName,
          organizationEmail: params.organizationEmail,
          customerId: params.customerId,
          productId: params.productId,
          productName: params.productName,
          priceId: params.priceId,
          priceType: params.priceType,
          priceInterval: params.priceInterval,
          cost: params.cost,
          currency: params.currency,
          successUrl: params.successUrl,
          cancelUrl: params.cancelUrl
        }
      );
      return {
        url: result.url,
        billingId: result.billingId,
        customerId: result.customerId
      };
    },

    async createPortalSession(params) {
      const base = config.dashboardUrl ?? params.returnUrl;
      return {
        url: base.replace(/\/$/, '') + '/organizations/meu-plano'
      };
    }
  };
}
