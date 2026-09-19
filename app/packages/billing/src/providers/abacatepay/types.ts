
export type { BillingWebhookEvent } from '../../types';

export interface AbacatePayWebhookPayload {
  id?: string;
  event?: string;
  data?: {
    billing?: {
      id: string;
      status: string;
      amount?: number;
      customer?: { id: string; metadata?: { email?: string } };
    };
    pix?: { billingId?: string };
  };
}

export type AbacatePayCustomerMetadata = {
  name?: string;
  cellphone?: string;
  email?: string;
  taxId?: string;
};

export type AbacatePayCustomer = {
  id: string;
  metadata: AbacatePayCustomerMetadata;
};

export type AbacatePayBillingResponse = {
  data?: {
    id: string;
    url: string;
    customer?: AbacatePayCustomer;
  };
  error?: string;
};

export type AbacatePayCreateBillingBody = {
  frequency: string;
  methods: string[];
  products: Array<{
    externalId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  returnUrl: string;
  completionUrl: string;
  customerId?: string;
  customer?: {
    name: string;
    email: string;
  };
};

export type AbacatePayCreateCustomerBody = {
  name: string;
  email: string;
  cellphone?: string;
  taxId?: string;
};

export type AbacatePayCreateCustomerResponse = {
  data?: { id: string };
  error?: string;
};
