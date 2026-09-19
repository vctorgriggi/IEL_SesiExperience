export type CreateCheckoutSessionInput = Readonly<{
  organizationId: string;
  priceId: string;
  quantity?: number;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}>;

export type CreatePortalSessionInput = Readonly<{
  organizationId: string;
  returnUrl: string;
}>;
