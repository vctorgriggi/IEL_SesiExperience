import {
  organizationTable,
  subscriptionTable,
  subscriptionItemTable,
  orderTable,
  orderItemTable,
  billingWebhookEventsTable,
  eq,
  type DatabaseType
} from '@workspace/database';
import type {
  StripeCheckoutSessionCompletedPayload,
  StripeSubscriptionPayload
} from './webhook-payloads';

/** Dados de domínio para inserir assinatura. */
export type StripeSubscriptionInsert = {
  id: string;
  organizationId: string;
  status: string;
  active: boolean;
  provider: string;
  cancelAtPeriodEnd: boolean;
  currency: string;
  periodStartsAt: Date;
  periodEndsAt: Date;
  trialStartsAt: Date | null;
  trialEndsAt: Date | null;
};

/** Dados de domínio para inserir item da assinatura. */
export type StripeSubscriptionItemInsert = {
  id: string;
  subscriptionId: string;
  quantity: number;
  productId: string;
  variantId: string;
  priceAmount: number | null;
  interval: string;
  intervalCount: number;
  type?: string;
  model?: string;
};

/** Dados de domínio para inserir pedido avulso. */
export type StripeOrderInsert = {
  id: string;
  organizationId: string;
  status: string;
  provider: string;
  totalAmount: number;
  currency: string;
};

/** Dados de domínio para inserir item do pedido avulso. */
export type StripeOrderItemInsert = {
  id: string;
  orderId: string;
  quantity: number;
  productId: string;
  variantId: string;
  priceAmount: number | null;
  type?: string;
  model?: string;
};

/** Dados de domínio para atualizar assinatura. */
export type StripeSubscriptionUpdate = {
  status: string;
  active: boolean;
  cancelAtPeriodEnd: boolean;
  periodStartsAt: Date;
  periodEndsAt: Date;
  updatedAt: Date;
};

/** Repositório do webhook Stripe. Isola escrita no banco. */
export interface StripeWebhookRepository {
  findOrgById(orgId: string): Promise<{ id: string } | undefined>;
  findOrgByBillingCustomerId(
    customerId: string
  ): Promise<{ id: string } | undefined>;
  updateOrgBilling(
    orgId: string,
    data: { billingCustomerId: string; billingEmail?: string }
  ): Promise<void>;
  insertSubscription(data: StripeSubscriptionInsert): Promise<void>;
  insertSubscriptionItem(data: StripeSubscriptionItemInsert): Promise<void>;
  updateSubscription(
    subscriptionId: string,
    data: StripeSubscriptionUpdate
  ): Promise<void>;
  insertOrder(data: StripeOrderInsert): Promise<void>;
  insertOrderItem(data: StripeOrderItemInsert): Promise<void>;
  isEventProcessed(eventId: string): Promise<boolean>;
  recordEvent(eventId: string, eventType: string): Promise<void>;

  /** Aplica checkout.session.completed. */
  applyCheckoutSessionCompleted(
    payload: StripeCheckoutSessionCompletedPayload
  ): Promise<void>;
  /** Aplica subscription.created. */
  applySubscriptionCreated(payload: StripeSubscriptionPayload): Promise<void>;
  /** Aplica subscription.updated. */
  applySubscriptionUpdated(payload: StripeSubscriptionPayload): Promise<void>;
  /** Aplica subscription.deleted. */
  applySubscriptionDeleted(payload: StripeSubscriptionPayload): Promise<void>;
  /** Aplica subscription.paused. */
  applySubscriptionPaused(payload: StripeSubscriptionPayload): Promise<void>;
  /** Aplica subscription.resumed. */
  applySubscriptionResumed(payload: StripeSubscriptionPayload): Promise<void>;
  /** Limpa billingCustomerId da organização. */
  clearOrgBillingCustomerId(customerId: string): Promise<void>;
}

/** Cria repositório Stripe com Drizzle. */
export function createStripeWebhookRepository(
  db: DatabaseType
): StripeWebhookRepository {
  return {
    async findOrgById(orgId) {
      const [row] = await db
        .select({ id: organizationTable.id })
        .from(organizationTable)
        .where(eq(organizationTable.id, orgId))
        .limit(1);
      return row;
    },

    async findOrgByBillingCustomerId(customerId) {
      const [row] = await db
        .select({ id: organizationTable.id })
        .from(organizationTable)
        .where(eq(organizationTable.billingCustomerId, customerId))
        .limit(1);
      return row;
    },

    async updateOrgBilling(orgId, data) {
      await db
        .update(organizationTable)
        .set({
          billingCustomerId: data.billingCustomerId,
          billingEmail: data.billingEmail ?? undefined
        })
        .where(eq(organizationTable.id, orgId));
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
          periodEndsAt: data.periodEndsAt,
          trialStartsAt: data.trialStartsAt,
          trialEndsAt: data.trialEndsAt
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
          intervalCount: data.intervalCount,
          type: data.type,
          model: data.model
        })
        .onConflictDoNothing({ target: subscriptionItemTable.id });
    },

    async updateSubscription(subscriptionId, data) {
      await db
        .update(subscriptionTable)
        .set({
          status: data.status,
          active: data.active,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd,
          periodStartsAt: data.periodStartsAt,
          periodEndsAt: data.periodEndsAt,
          updatedAt: data.updatedAt
        })
        .where(eq(subscriptionTable.id, subscriptionId));
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
        .select()
        .from(billingWebhookEventsTable)
        .where(eq(billingWebhookEventsTable.eventId, eventId))
        .limit(1);
      return !!existing;
    },

    async recordEvent(eventId, eventType) {
      await db
        .insert(billingWebhookEventsTable)
        .values({
          eventId,
          service: 'stripe',
          eventType
        })
        .onConflictDoNothing({
          target: [
            billingWebhookEventsTable.eventId,
            billingWebhookEventsTable.service
          ]
        });
    },

    async applyCheckoutSessionCompleted(payload) {
      let orgId = payload.organizationId;
      if (!orgId) {
        const org = await this.findOrgByBillingCustomerId(payload.customerId);
        if (!org) return;
        orgId = org.id;
      }

      if (payload.customerEmail) {
        await this.updateOrgBilling(orgId, {
          billingCustomerId: payload.customerId,
          billingEmail: payload.customerEmail
        });
      }

      if (payload.subscription) {
        const sub = payload.subscription;
        await this.insertSubscription({
          id: sub.subscriptionId,
          organizationId: orgId,
          status: sub.status,
          active: sub.active,
          provider: 'stripe',
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          currency: sub.currency,
          periodStartsAt: sub.periodStartsAt,
          periodEndsAt: sub.periodEndsAt,
          trialStartsAt: sub.trialStartsAt,
          trialEndsAt: sub.trialEndsAt
        });
        for (const item of sub.items) {
          await this.insertSubscriptionItem({
            id: item.id,
            subscriptionId: sub.subscriptionId,
            quantity: item.quantity,
            productId: item.productId,
            variantId: item.variantId,
            priceAmount: item.priceAmount,
            interval: item.interval,
            intervalCount: item.intervalCount,
            type: item.type,
            model: item.model
          });
        }
        return;
      }

      if (payload.order) {
        const order = payload.order;
        if (order.paymentStatus !== 'paid') return;

        const totalAmount =
          order.amountTotal != null ? order.amountTotal / 100 : 0;

        await this.insertOrder({
          id: order.sessionId,
          organizationId: orgId,
          status: order.paymentStatus,
          provider: 'stripe',
          totalAmount,
          currency: order.currency
        });

        await this.insertOrderItem({
          id: 'stripe_order_item_' + order.sessionId,
          orderId: order.sessionId,
          quantity: 1,
          productId: order.productId ?? '',
          variantId: order.priceId ?? '',
          priceAmount: totalAmount
        });
      }
    },

    async applySubscriptionCreated(payload) {
      let orgId = payload.organizationId;
      if (!orgId) {
        const org = await this.findOrgByBillingCustomerId(payload.customerId);
        if (!org) return;
        orgId = org.id;
      }
      await this.insertSubscription({
        id: payload.subscriptionId,
        organizationId: orgId,
        status: payload.status,
        active: payload.active,
        provider: 'stripe',
        cancelAtPeriodEnd: payload.cancelAtPeriodEnd,
        currency: payload.currency,
        periodStartsAt: payload.periodStartsAt,
        periodEndsAt: payload.periodEndsAt,
        trialStartsAt: payload.trialStartsAt,
        trialEndsAt: payload.trialEndsAt
      });
      for (const item of payload.items) {
        await this.insertSubscriptionItem({
          id: item.id,
          subscriptionId: payload.subscriptionId,
          quantity: item.quantity,
          productId: item.productId,
          variantId: item.variantId,
          priceAmount: item.priceAmount,
          interval: item.interval,
          intervalCount: item.intervalCount,
          type: item.type,
          model: item.model
        });
      }
    },

    async applySubscriptionUpdated(payload) {
      await this.updateSubscription(payload.subscriptionId, {
        status: payload.status,
        active: payload.active,
        cancelAtPeriodEnd: payload.cancelAtPeriodEnd,
        periodStartsAt: payload.periodStartsAt,
        periodEndsAt: payload.periodEndsAt,
        updatedAt: new Date()
      });
    },

    async applySubscriptionDeleted(payload) {
      await this.updateSubscription(payload.subscriptionId, {
        status: payload.status,
        active: false,
        cancelAtPeriodEnd: payload.cancelAtPeriodEnd,
        periodStartsAt: payload.periodStartsAt,
        periodEndsAt: payload.periodEndsAt,
        updatedAt: new Date()
      });
    },

    async applySubscriptionPaused(payload) {
      await this.applySubscriptionUpdated(payload);
    },

    async applySubscriptionResumed(payload) {
      await this.applySubscriptionUpdated(payload);
    },

    async clearOrgBillingCustomerId(customerId) {
      const org = await this.findOrgByBillingCustomerId(customerId);
      if (!org) return;
      await db
        .update(organizationTable)
        .set({ billingCustomerId: null, billingEmail: null })
        .where(eq(organizationTable.id, org.id));
    }
  };
}
