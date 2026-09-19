import { z } from 'zod';

export const cancelRegistrationSchema = z.object({
  eventId: z.string().uuid(),
  registrationId: z.string().uuid()
});

export type CancelRegistrationInput = z.infer<typeof cancelRegistrationSchema>;
