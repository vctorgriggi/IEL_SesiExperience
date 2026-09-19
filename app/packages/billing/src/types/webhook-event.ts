export type BillingWebhookEvent = Readonly<{
  id: string;
  type: string;
  provider: 'stripe' | 'abacatepay';
  data: unknown;
}>;
