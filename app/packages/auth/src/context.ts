import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getRedirectToSignIn } from '@workspace/auth/redirect';
import { checkSession } from '@workspace/auth/session';
import {
  db,
  eq,
  jsonAggBuildObject,
  membershipTable,
  orderItemTable,
  orderTable,
  organizationTable,
  subscriptionItemTable,
  subscriptionTable,
  userTable
} from '@workspace/database';
import { routes } from '@workspace/routes';

import { dedupedAuth, signOut } from '.';

const dedupedGetActiveOrganizationSlug = cache(async function () {
  const headerList = await headers();
  const organizationSlugFromHeader = headerList.get('x-organization-slug');
  if (organizationSlugFromHeader) {
    return organizationSlugFromHeader;
  }

  const cookieStore = await cookies();
  const organizationSlugFromCookie = cookieStore.get('organizationSlug')?.value;
  if (organizationSlugFromCookie) {
    return organizationSlugFromCookie;
  }

  console.warn(
    'No organization slug in headers or cookies. Check middleware/current organization selection.'
  );
  return redirect('/');
});

const dedupedGetActiveOrganization = cache(async function () {
  const organizationSlug = await dedupedGetActiveOrganizationSlug();

  const [organization] = await db
    .select({
      id: organizationTable.id,
      logo: organizationTable.logo,
      name: organizationTable.name,
      email: organizationTable.email,
      slug: organizationTable.slug,
      billingCustomerId: organizationTable.billingCustomerId,
      memberships: jsonAggBuildObject({
        organizationId: membershipTable.organizationId,
        userId: membershipTable.userId,
        role: membershipTable.role,
        isOwner: membershipTable.isOwner
      })
    })
    .from(organizationTable)
    .leftJoin(
      membershipTable,
      eq(membershipTable.organizationId, organizationTable.id)
    )
    .where(eq(organizationTable.slug, organizationSlug))
    .groupBy(organizationTable.id)
    .limit(1);

  if (!organization) {
    return redirect('/');
  }

  const [subscriptions, orders] = await Promise.all([
    db
      .select({
        id: subscriptionTable.id,
        active: subscriptionTable.active,
        status: subscriptionTable.status,
        cancelAtPeriodEnd: subscriptionTable.cancelAtPeriodEnd,
        currency: subscriptionTable.currency,
        provider: subscriptionTable.provider,
        trialStartsAt: subscriptionTable.trialStartsAt,
        trialEndsAt: subscriptionTable.trialEndsAt,
        periodStartsAt: subscriptionTable.periodStartsAt,
        periodEndsAt: subscriptionTable.periodEndsAt,
        items: jsonAggBuildObject({
          id: subscriptionItemTable.id,
          subscriptionId: subscriptionItemTable.subscriptionId,
          quantity: subscriptionItemTable.quantity,
          productId: subscriptionItemTable.productId,
          variantId: subscriptionItemTable.variantId,
          priceAmount: subscriptionItemTable.priceAmount,
          interval: subscriptionItemTable.interval,
          intervalCount: subscriptionItemTable.intervalCount,
          type: subscriptionItemTable.type,
          model: subscriptionItemTable.model
        })
      })
      .from(subscriptionTable)
      .leftJoin(
        subscriptionItemTable,
        eq(subscriptionItemTable.subscriptionId, subscriptionTable.id)
      )
      .where(eq(subscriptionTable.organizationId, organization.id))
      .groupBy(subscriptionTable.id),
    db
      .select({
        id: orderTable.id,
        status: orderTable.status,
        currency: orderTable.currency,
        provider: orderTable.provider,
        items: jsonAggBuildObject({
          id: orderItemTable.id,
          quantity: orderItemTable.quantity,
          productId: orderItemTable.productId,
          variantId: orderItemTable.variantId,
          priceAmount: orderItemTable.priceAmount,
          type: orderItemTable.type,
          model: orderItemTable.model
        })
      })
      .from(orderTable)
      .leftJoin(orderItemTable, eq(orderItemTable.orderId, orderTable.id))
      .where(eq(orderTable.organizationId, organization.id))
      .groupBy(orderTable.id)
  ]);

  return {
    ...organization,
    subscriptions,
    orders,
    logo: organization.logo ? organization.logo : undefined
  };
});

const dedupedGetUserInfo = cache(async function (userId: string) {
  const [userInfo] = await db
    .select({
      completedOnboarding: userTable.completedOnboarding,
      memberships: jsonAggBuildObject({
        organizationId: membershipTable.organizationId,
        userId: membershipTable.userId,
        role: membershipTable.role,
        isOwner: membershipTable.isOwner
      })
    })
    .from(userTable)
    .leftJoin(membershipTable, eq(membershipTable.userId, userTable.id))
    .where(eq(userTable.id, userId))
    .groupBy(userTable.id)
    .limit(1);

  if (!userInfo) {
    return signOut({ redirectTo: routes.dashboard.auth.signIn });
  }

  return userInfo;
});

export async function getAuthContext() {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getRedirectToSignIn());
  }

  const userInfo = await dedupedGetUserInfo(session.user.id);

  const enrichedSession = {
    ...session,
    user: {
      ...session.user,
      ...userInfo
    }
  };

  return { session: enrichedSession };
}

export async function getAuthOrganizationContext() {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getRedirectToSignIn());
  }

  const activeOrganization = await dedupedGetActiveOrganization();
  const userInfo = await dedupedGetUserInfo(session.user.id);

  if (
    !userInfo.memberships.some(
      (m: { organizationId: string | null }) =>
        m.organizationId === activeOrganization.id
    )
  ) {
    return redirect('/');
  }

  const enrichedSession = {
    ...session,
    user: {
      ...session.user,
      ...userInfo
    }
  };

  return { session: enrichedSession, organization: activeOrganization };
}
