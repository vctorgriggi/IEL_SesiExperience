import { z } from 'zod';

import {
  organizationAddressSchema,
  organizationEmailSchema,
  organizationNameSchema,
  organizationPhoneSchema,
  organizationWebsiteSchema
} from './organization-fields';

export const updateOrganizationDetailsSchema = z.object({
  name: organizationNameSchema.optional(),
  address: organizationAddressSchema.nullable().optional(),
  phone: organizationPhoneSchema.nullable().optional(),
  email: organizationEmailSchema.nullable().optional(),
  website: organizationWebsiteSchema.nullable().optional()
});

export type UpdateOrganizationDetailsInput = z.infer<
  typeof updateOrganizationDetailsSchema
>;
