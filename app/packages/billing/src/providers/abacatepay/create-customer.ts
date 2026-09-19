import { organizationTable, eq, type DatabaseType } from '@workspace/database';

import { getAbacatePayClient } from './client';
import type { AbacatePayCreateCustomerBody } from './types';
import { BillingError } from '../../errors';

export type CreateAbacatePayCustomerForUserInput = {
  userId: string;
  name: string;
  email: string;
};

export type CreateAbacatePayCustomerForOrganizationInput = {
  organizationId: string;
  organizationName: string;
  organizationEmail: string;
  organizationPhone?: string | null;
};

/**
 * Cria cliente AbacatePay e salva o id na organização.
 * Uso: antes da primeira cobrança.
 */
export async function createAbacatePayCustomerForOrganization(
  db: DatabaseType,
  secretKey: string,
  input: CreateAbacatePayCustomerForOrganizationInput
): Promise<string> {
  const client = getAbacatePayClient(secretKey);
  const body: AbacatePayCreateCustomerBody = {
    name: input.organizationName,
    email: input.organizationEmail
  };
  if (input.organizationPhone?.trim()) {
    body.cellphone = input.organizationPhone.trim();
  }

  let json;
  try {
    json = await client.createCustomer(body);
  } catch (err) {
    throw new BillingError(
      'AbacatePay createCustomer request failed',
      'abacatepay_api',
      err
    );
  }

  if (json.error || !json.data?.id) {
    throw new BillingError(
      json.error ?? 'Failed to create AbacatePay customer',
      'abacatepay_api'
    );
  }

  const customerId = json.data.id;
  await db
    .update(organizationTable)
    .set({ billingCustomerId: customerId })
    .where(eq(organizationTable.id, input.organizationId));

  return customerId;
}

/**
 * Cria cliente AbacatePay para o usuário.
 * Uso: fluxo de signup com AbacatePay.
 */
export async function createAbacatePayCustomerForUser(
  db: DatabaseType,
  secretKey: string,
  input: CreateAbacatePayCustomerForUserInput
): Promise<string | null> {
  const client = getAbacatePayClient(secretKey);

  let json;
  try {
    json = await client.createCustomer({
      name: input.name,
      email: input.email
    });
  } catch (err) {
    throw new BillingError(
      'AbacatePay createCustomer request failed',
      'abacatepay_api',
      err
    );
  }

  if (json.error || !json.data?.id) {
    return null;
  }

  const customerId = json.data.id;
  // A tabela de usuário não tem billingCustomerId.
  return customerId;
}
