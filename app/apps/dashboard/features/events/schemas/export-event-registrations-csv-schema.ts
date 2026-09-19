import { z } from 'zod';

export const exportEventRegistrationsCsvSchema = z.object({
  eventId: z.string().uuid()
});

export type ExportEventRegistrationsCsvInput = z.infer<
  typeof exportEventRegistrationsCsvSchema
>;
