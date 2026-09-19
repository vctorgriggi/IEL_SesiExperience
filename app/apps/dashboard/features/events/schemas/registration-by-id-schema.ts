import { z } from 'zod';

export const registrationByIdSchema = z.object({
  registrationId: z.string().uuid()
});

export type RegistrationByIdInput = z.infer<typeof registrationByIdSchema>;
