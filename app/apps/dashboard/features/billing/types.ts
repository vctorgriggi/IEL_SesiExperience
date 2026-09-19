export type BillingPlanData = {
  subscriptions: Array<{
    id: string;
    active?: boolean;
    status?: string;
    periodStartsAt?: string;
    periodEndsAt?: string;
  }>;
  billings: unknown[];
};
