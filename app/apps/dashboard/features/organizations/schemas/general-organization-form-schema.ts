import { z } from 'zod';

import {
  organizationAddressSchema,
  organizationEmailSchema,
  organizationNameSchema,
  organizationPhoneSchema,
  organizationWebsiteSchema
} from './organization-fields';

export const generalOrganizationFormSchema = z.object({
  name: organizationNameSchema,
  address: organizationAddressSchema.optional().or(z.literal('')),
  phone: organizationPhoneSchema.optional().or(z.literal('')),
  email: organizationEmailSchema.optional().or(z.literal('')),
  website: organizationWebsiteSchema.optional().or(z.literal(''))
});

export type GeneralOrganizationFormData = z.infer<
  typeof generalOrganizationFormSchema
>;
