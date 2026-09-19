export type BillingErrorCode =
  | 'organization_not_found'
  | 'checkout_url_missing'
  | 'portal_url_missing'
  | 'configuration'
  | 'invalid_input'
  | 'stripe_api'
  | 'abacatepay_api'
  | 'webhook_signature_invalid'
  | 'webhook_secret_missing'
  | 'webhook_parse_failed';

export class BillingError extends Error {
  readonly statusCode = 502;

  constructor(
    message: string,
    public readonly code: BillingErrorCode,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'BillingError';
    Object.setPrototypeOf(this, BillingError.prototype);
  }
}
