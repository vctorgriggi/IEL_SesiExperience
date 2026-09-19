import {
  abacateBillingsTable,
  and,
  billingWebhookEventsTable,
  eq,
  orderItemTable,
  orderTable,
  subscriptionItemTable,
  subscriptionTable,
  type DatabaseType
} from '@workspace/database';

const ABACATEPAY_SERVICE = 'abacatepay';

/** Linha de cobrança Abacate por billingId. */
export type AbacateBillingRow = {
  organizationId: string;
  /** @deprecated Marcador legado só de intervalo ('monthly'|'yearly'). */
  planType?: string | null;
  productId?: string | null;
  priceId?: string | null;
  billingInterval?: string | null;
  priceType?: string | null;
  amount: number;
};

/** Dados de domínio para inserir assinatura. */
export type AbacateSubscriptionInsert = {
  id: string;
  organizationId: string;
  status: string;
  active: boolean;
  provider: string;
  cancelAtPeriodEnd: boolean;
  currency: string;
  periodStartsAt: Date;
  periodEndsAt: Date;
};

/** Dados de domínio para inserir item da assinatura. */
export type AbacateSubscriptionItemInsert = {
  id: string;
  subscriptionId: string;
  quantity: number;
  productId: string;
  variantId: string;
  priceAmount: number;
  interval: string;
  intervalCount: number;
};

/** Dados de domínio para inserir pedido avulso. */
export type AbacateOrderInsert = {
  id: string;
  organizationId: string;
  status: string;
  provider: string;
  totalAmount: number;
  currency: string;
};

/** Dados de domínio para inserir item do pedido avulso. */
export type AbacateOrderItemInsert = {
  id: string;
  orderId: string;
  quantity: number;
  productId: string;
  variantId: string;
  priceAmount: number;
  type?: string;
  model?: string;
};

/** Repositório do webhook AbacatePay. Isola escrita no banco. */
export interface AbacatePayWebhookRepository {
  findAbacateBillingByBillingId(
    billingId: string
  ): Promise<AbacateBillingRow | undefined>;
  updateAbacateBillingStatus(billingId: string, status: string): Promise<void>;
  insertSubscription(data: AbacateSubscriptionInsert): Promise<void>;
  insertSubscriptionItem(data: AbacateSubscriptionItemInsert): Promise<void>;
  insertOrder(data: AbacateOrderInsert): Promise<void>;
  insertOrderItem(data: AbacateOrderItemInsert): Promise<void>;
  isEventProcessed(eventId: string): Promise<boolean>;
  recordEvent(eventId: string, eventType: string): Promise<void>;
}

/** Cria repositório AbacatePay com Drizzle. */
export function createAbacatePayWebhookRepository(
  db: DatabaseType
): AbacatePayWebhookRepository {
  return {
    async findAbacateBillingByBillingId(billingId) {
      const [row] = await db
        .select({
          organizationId: abacateBillingsTable.organizationId,
          planType: abacateBillingsTable.planType,
          productId: abacateBillingsTable.productId,
          priceId: abacateBillingsTable.priceId,
          billingInterval: abacateBillingsTable.billingInterval,
          priceType: abacateBillingsTable.priceType,
          amount: abacateBillingsTable.amount
        })
        .from(abacateBillingsTable)
        .where(eq(abacateBillingsTable.billingId, billingId))
        .limit(1);
      return row;
    },

    async updateAbacateBillingStatus(billingId, status) {
      await db
        .update(abacateBillingsTable)
        .set({ status, updatedAt: new Date() })
        .where(eq(abacateBillingsTable.billingId, billingId));
    },

    async insertSubscription(data) {
      await db
        .insert(subscriptionTable)
        .values({
          id: data.id,
          organizationId: data.organizationId,
          status: data.status,
          active: data.active,
          provider: data.provider,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd,
          currency: data.currency,
          periodStartsAt: data.periodStartsAt,
          periodEndsAt: data.periodEndsAt
        })
        .onConflictDoNothing({ target: subscriptionTable.id });
    },

    async insertSubscriptionItem(data) {
      await db
        .insert(subscriptionItemTable)
        .values({
          id: data.id,
          subscriptionId: data.subscriptionId,
          quantity: data.quantity,
          productId: data.productId,
          variantId: data.variantId,
          priceAmount: data.priceAmount,
          interval: data.interval,
          intervalCount: data.intervalCount
        })
        .onConflictDoNothing({ target: subscriptionItemTable.id });
    },

    async insertOrder(data) {
      await db
        .insert(orderTable)
        .values({
          id: data.id,
          organizationId: data.organizationId,
          status: data.status,
          provider: data.provider,
          totalAmount: data.totalAmount,
          currency: data.currency
        })
        .onConflictDoNothing({ target: orderTable.id });
    },

    async insertOrderItem(data) {
      await db
        .insert(orderItemTable)
        .values({
          id: data.id,
          orderId: data.orderId,
          quantity: data.quantity,
          productId: data.productId,
          variantId: data.variantId,
          priceAmount: data.priceAmount,
          type: data.type,
          model: data.model
        })
        .onConflictDoNothing({ target: orderItemTable.id });
    },

    async isEventProcessed(eventId) {
      const [existing] = await db
        .select({ id: billingWebhookEventsTable.id })
        .from(billingWebhookEventsTable)
        .where(
          and(
            eq(billingWebhookEventsTable.eventId, eventId),
            eq(billingWebhookEventsTable.service, ABACATEPAY_SERVICE)
          )
        )
        .limit(1);
      return !!existing;
    },

    async recordEvent(eventId, eventType) {
      await db
        .insert(billingWebhookEventsTable)
        .values({
          eventId,
          service: ABACATEPAY_SERVICE,
          eventType
        })
        .onConflictDoNothing({
          target: [
            billingWebhookEventsTable.eventId,
            billingWebhookEventsTable.service
          ]
        });
    }
  };
}
