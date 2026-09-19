
import { billingConfig, type PlanId } from './config';

export type BillingProductConfig = {
  id: PlanId;
  isFree: boolean;
  priceIds: string[];
};

function uniq<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function getPriceIdsForProduct(productId: PlanId): string[] {
  const product = billingConfig.products.find((p) => p.id === productId);
  if (!product) return [];
  return uniq(product.plans.flatMap((plan) => plan.prices.map((price) => price.id)));
}

export function getBillingProductsConfig(): {
  products: BillingProductConfig[];
} {
  const products = billingConfig.products
    .filter((p) => !p.hidden)
    .map((product) => ({
      id: product.id as PlanId,
      isFree: !!product.isFree,
      priceIds: getPriceIdsForProduct(product.id as PlanId)
    }));

  return { products };
}

const productsConfig = getBillingProductsConfig();

export const freeProductExists = productsConfig.products.some(
  (product) => product.isFree
);

export type OrganizationForPurchases = {
  subscriptions: {
    active: boolean;
    items: { productId?: string | null; variantId: string }[];
  }[];
  orders: {
    status?: string | null;
    items: { productId?: string | null; variantId: string }[];
  }[];
};

function isSuccessfulOrderStatus(status: string | null | undefined): boolean {
  const s = (status ?? '').toLowerCase();
  return s === 'paid' || s === 'succeeded' || s === 'completed' || s === 'complete';
}

export function createPurchasesHelper(organization: OrganizationForPurchases) {
  const hasPurchasedProduct = (productId?: PlanId | PlanId[]) => {
    const productIds = productId
      ? Array.isArray(productId)
        ? productId
        : [productId]
      : productsConfig.products.map((product) => product.id);

    const priceIds = productsConfig.products
      .filter((product) => productIds.includes(product.id))
      .flatMap((product) => product.priceIds);

    const matchSubscription = organization.subscriptions
      .filter((sub) => sub.active)
      .flatMap((sub) => sub.items)
      .some(
        (item) =>
          (item.productId != null && productIds.includes(item.productId as PlanId)) ||
          priceIds.includes(item.variantId)
      );

    const matchOrder = organization.orders
      .filter((order) => isSuccessfulOrderStatus(order.status))
      .flatMap((order) => order.items)
      .some(
        (item) =>
          (item.productId != null && productIds.includes(item.productId as PlanId)) ||
          priceIds.includes(item.variantId)
      );

    return matchSubscription || matchOrder;
  };

  const purchasedProducts = productsConfig.products.filter((product) =>
    hasPurchasedProduct(product.id)
  );

  return {
    purchasedProducts,
    hasPurchasedProduct
  };
}
