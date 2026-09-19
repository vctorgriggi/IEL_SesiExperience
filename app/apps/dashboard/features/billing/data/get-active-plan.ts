import 'server-only';

import {
  resolveOrganizationPlanId,
  type OrganizationForPlanResolution,
  type PlanId
} from '@workspace/billing';
import {
  db,
  eq,
  orderItemTable,
  orderTable,
  subscriptionItemTable,
  subscriptionTable
} from '@workspace/database';

type OrganizationWithPurchases = OrganizationForPlanResolution;

export function getActivePlan(organization: OrganizationWithPurchases): PlanId {
  return resolveOrganizationPlanId(organization);
}

export async function getActivePlanByOrganizationId(
  organizationId: string
): Promise<PlanId> {
  const [subsRows, ordersRows] = await Promise.all([
    db
      .select({
        subscriptionId: subscriptionTable.id,
        active: subscriptionTable.active,
        status: subscriptionTable.status,
        productId: subscriptionItemTable.productId,
        variantId: subscriptionItemTable.variantId,
        model: subscriptionItemTable.model
      })
      .from(subscriptionTable)
      .leftJoin(
        subscriptionItemTable,
        eq(subscriptionItemTable.subscriptionId, subscriptionTable.id)
      )
      .where(eq(subscriptionTable.organizationId, organizationId)),
    db
      .select({
        orderId: orderTable.id,
        status: orderTable.status,
        productId: orderItemTable.productId,
        variantId: orderItemTable.variantId,
        model: orderItemTable.model
      })
      .from(orderTable)
      .leftJoin(orderItemTable, eq(orderItemTable.orderId, orderTable.id))
      .where(eq(orderTable.organizationId, organizationId))
  ]);

  const subsMap = new Map<
    string,
    {
      active?: boolean | null;
      status?: string | null;
      items: Array<{
        productId?: string | null;
        variantId?: string | null;
        model?: string | null;
      }>;
    }
  >();

  for (const row of subsRows) {
    const existing = subsMap.get(row.subscriptionId) ?? {
      active: row.active,
      status: row.status,
      items: []
    };
    if (row.productId || row.variantId || row.model) {
      existing.items.push({
        productId: row.productId,
        variantId: row.variantId,
        model: row.model
      });
    }
    subsMap.set(row.subscriptionId, existing);
  }

  const ordersMap = new Map<
    string,
    {
      status?: string | null;
      items: Array<{
        productId?: string | null;
        variantId?: string | null;
        model?: string | null;
      }>;
    }
  >();

  for (const row of ordersRows) {
    const existing = ordersMap.get(row.orderId) ?? {
      status: row.status,
      items: []
    };
    if (row.productId || row.variantId || row.model) {
      existing.items.push({
        productId: row.productId,
        variantId: row.variantId,
        model: row.model
      });
    }
    ordersMap.set(row.orderId, existing);
  }

  return resolveOrganizationPlanId({
    subscriptions: Array.from(subsMap.values()),
    orders: Array.from(ordersMap.values())
  });
}
