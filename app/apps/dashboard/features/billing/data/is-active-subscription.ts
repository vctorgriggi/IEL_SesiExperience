export type SubscriptionLike = {
  active?: boolean | null;
  status?: string | null;
};

export function isActiveSubscription(sub: SubscriptionLike): boolean {
  if (sub.active != null) return sub.active === true;
  const status = (sub.status ?? '').toLowerCase();
  return status === 'active' || status === 'trialing';
}
