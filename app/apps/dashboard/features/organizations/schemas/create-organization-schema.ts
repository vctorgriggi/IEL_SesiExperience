import { z } from 'zod';

import {
  organizationNameSchema,
  organizationSlugSchema
} from './organization-fields';

export const createOrganizationSchema = z.object({
  name: organizationNameSchema,
  slug: organizationSlugSchema
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
