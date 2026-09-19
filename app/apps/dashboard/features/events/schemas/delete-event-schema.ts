import { z } from 'zod';

export const deleteEventSchema = z.object({
  id: z.string().uuid()
});

export type DeleteEventInput = z.infer<typeof deleteEventSchema>;
