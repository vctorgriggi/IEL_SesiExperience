import { z } from 'zod';

export const registerForEventSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  registrationData: z.record(z.string(), z.unknown()).default({})
});

export type RegisterForEventInput = z.infer<typeof registerForEventSchema>;
