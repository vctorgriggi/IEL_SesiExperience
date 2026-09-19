import { billingConfig, type PlanId } from './config';
import { BillingError } from './errors';
import { PriceInterval, PriceType, type Price } from './schema';

export type BillingInterval = 'monthly' | 'yearly';

export type BillingCheckoutSelection = {
  productId: PlanId;
  productName: string;
  priceId: string;
  priceType: PriceType;
  priceInterval?: PriceInterval;
  cost: number;
  currency: string;
};

export type BillingCheckoutResolution =
  | {
      kind: 'checkout';
      selection: BillingCheckoutSelection;
    }
  | {
      kind: 'no-checkout';
      productId: PlanId;
      reason: 'free' | 'enterprise';
    };

function toPriceInterval(interval: BillingInterval): PriceInterval {
  return interval === 'monthly' ? PriceInterval.Month : PriceInterval.Year;
}

function findProduct(productId: PlanId) {
  const product = billingConfig.products.find((p) => p.id === productId);
  if (!product) {
    throw new BillingError(
      'Produto de cobrança não encontrado: ' + productId,
      'configuration'
    );
  }
  return product;
}

function findPrice(
  productId: PlanId,
  predicate: (price: Price) => boolean
): Price {
  const product = findProduct(productId);

  for (const plan of product.plans) {
    for (const price of plan.prices) {
      if (predicate(price)) return price;
    }
  }

  throw new BillingError(
    'Preço não encontrado para o produto: ' + productId,
    'configuration'
  );
}

export function resolveBillingCheckout(
  productId: PlanId,
  billingInterval?: BillingInterval
): BillingCheckoutResolution {
  const product = findProduct(productId);

  if (product.cta.kind !== 'checkout') {
    return {
      kind: 'no-checkout',
      productId,
      reason: productId === 'enterprise' ? 'enterprise' : 'free'
    };
  }

  if (productId === 'pro') {
    if (!billingInterval) {
      throw new BillingError(
        'Intervalo de cobrança obrigatório para o plano Pro.',
        'invalid_input'
      );
    }

    const priceInterval = toPriceInterval(billingInterval);
    const price = findPrice(
      productId,
      (p) => p.type === PriceType.Recurring && p.interval === priceInterval
    );

    return {
      kind: 'checkout',
      selection: {
        productId,
        productName: product.name,
        priceId: price.id,
        priceType: price.type,
        priceInterval,
        cost: price.cost,
        currency: price.currency
      }
    };
  }

  if (productId === 'lifetime') {
    const price = findPrice(productId, (p) => p.type === PriceType.OneTime);

    return {
      kind: 'checkout',
      selection: {
        productId,
        productName: product.name,
        priceId: price.id,
        priceType: price.type,
        cost: price.cost,
        currency: price.currency
      }
    };
  }

  throw new BillingError(
    'Produto não suportado para checkout: ' + productId,
    'invalid_input'
  );
}
