import 'server-only';

import type { BillingPlanData } from '@/features/billing/types';

import {
  abacateBillingsTable,
  db,
  desc,
  eq,
  organizationTable,
  subscriptionTable
} from '@workspace/database';

/**
 * Usado por RSC (pages/layouts). Sem rota de API.
 */
export async function getBillingPlan(
  organizationSlug: string
): Promise<BillingPlanData> {
  const [org] = await db
    .select({ id: organizationTable.id })
    .from(organizationTable)
    .where(eq(organizationTable.slug, organizationSlug))
    .limit(1);

  if (!org) {
    return { subscriptions: [], billings: [] };
  }

  const [subscriptions, billings] = await Promise.all([
    db
      .select({
        id: subscriptionTable.id,
        active: subscriptionTable.active,
        status: subscriptionTable.status
      })
      .from(subscriptionTable)
      .where(eq(subscriptionTable.organizationId, org.id)),
    process.env.BILLING_PROVIDER === 'abacatepay'
      ? db
          .select()
          .from(abacateBillingsTable)
          .where(eq(abacateBillingsTable.organizationId, org.id))
          .orderBy(desc(abacateBillingsTable.createdAt))
      : Promise.resolve([])
  ]);

  return {
    subscriptions: subscriptions.map((s) => ({
      id: s.id,
      active: s.active,
      status: s.status
    })),
    billings: billings as unknown[]
  };
}
