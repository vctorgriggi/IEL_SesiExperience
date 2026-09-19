import {
  abacateBillingsTable,
  and,
  eq,
  type DatabaseType
} from '@workspace/database';

import type { AbacatePayCreateBillingBody } from './types';
import { getAbacatePayClient } from './client';
import { createAbacatePayCustomerForOrganization } from './create-customer';
import { BillingError } from '../../errors';
import type { PlanId } from '../../config';
import { PriceInterval, PriceType } from '../../schema';

export type CreateAbacatePayCheckoutInput = {
  organizationId: string;
  organizationName: string;
  organizationEmail: string | null;
  customerId: string | null;
  productId: PlanId;
  productName: string;
  priceId: string;
  priceType: PriceType;
  priceInterval?: PriceInterval;
  cost: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
};

export type CreateAbacatePayCheckoutResult = {
  url: string;
  billingId: string;
  customerId?: string;
};

function costToCents(cost: number): number {
  return Math.round(cost * 100);
}

function toLegacyPlanType(
  priceInterval?: PriceInterval
): 'monthly' | 'yearly' | null {
  if (!priceInterval) return null;
  return priceInterval === PriceInterval.Year ? 'yearly' : 'monthly';
}

/** Cobrança única (PIX ou cartão); assinatura é tratada no nosso DB após webhook. */
function buildBillingBody(
  input: CreateAbacatePayCheckoutInput,
  customerId: string,
  priceCents: number
): AbacatePayCreateBillingBody {
  return {
    frequency: 'ONE_TIME',
    methods: ['PIX', 'CARD'],
    products: [
      {
        externalId: 'arki:' + input.productId + ':' + input.priceId,
        name: input.productName,
        quantity: 1,
        price: priceCents
      }
    ],
    returnUrl: input.cancelUrl,
    completionUrl: input.successUrl,
    customerId
  };
}

async function resolveCustomerId(
  db: DatabaseType,
  secretKey: string,
  input: CreateAbacatePayCheckoutInput
): Promise<string> {
  if (input.customerId) return input.customerId;

  if (input.organizationEmail == null || input.organizationEmail === '') {
    throw new BillingError(
      'Organization email is required when no AbacatePay customer exists',
      'configuration'
    );
  }

  return createAbacatePayCustomerForOrganization(db, secretKey, {
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    organizationEmail: input.organizationEmail
  });
}

export async function createAbacatePayCheckoutAndPersist(
  db: DatabaseType,
  secretKey: string,
  input: CreateAbacatePayCheckoutInput
): Promise<CreateAbacatePayCheckoutResult> {
  const priceCents = costToCents(input.cost);
  const customerId = await resolveCustomerId(db, secretKey, input);
  const body = buildBillingBody(input, customerId, priceCents);

  const client = getAbacatePayClient(secretKey);
  let json;
  try {
    json = await client.createBilling(body);
  } catch (err) {
    throw new BillingError(
      'AbacatePay createBilling request failed',
      'abacatepay_api',
      err
    );
  }

  if (json.error || !json.data?.url) {
    throw new BillingError(
      json.error ?? 'Failed to create AbacatePay billing',
      'abacatepay_api'
    );
  }

  const legacyPlanType =
    input.priceType === PriceType.Recurring
      ? toLegacyPlanType(input.priceInterval)
      : null;

  await db.insert(abacateBillingsTable).values({
    organizationId: input.organizationId,
    billingId: json.data.id,
    status: 'PENDING',
    planType: legacyPlanType,
    amount: priceCents,
    productId: input.productId,
    priceId: input.priceId,
    billingInterval: legacyPlanType,
    priceType: input.priceType
  });

  return {
    url: json.data.url,
    billingId: json.data.id,
    customerId
  };
}

export async function getAbacatePayBillingStatus(
  db: DatabaseType,
  organizationId: string,
  billingId: string
): Promise<{ status: string } | null> {
  const [row] = await db
    .select({ status: abacateBillingsTable.status })
    .from(abacateBillingsTable)
    .where(
      and(
        eq(abacateBillingsTable.organizationId, organizationId),
        eq(abacateBillingsTable.billingId, billingId)
      )
    )
    .limit(1);

  return row ? { status: row.status } : null;
}
