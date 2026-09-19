import { z } from 'zod';

import { eventFormSchema } from './event-form-schema';

export const updateEventSchema = eventFormSchema.extend({
  id: z.string().uuid()
});

export type UpdateEventInput = z.infer<typeof updateEventSchema>;
