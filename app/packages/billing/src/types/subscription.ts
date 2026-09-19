export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused';

export type Subscription = Readonly<{
  id: string;
  customerId: string;
  status: SubscriptionStatus;
  currentPeriodEnd: Date;
  priceId: string;
  metadata: Readonly<Record<string, string>>;
}>;
