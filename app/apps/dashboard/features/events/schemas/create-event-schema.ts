import { z } from 'zod';

import { eventFormSchema } from './event-form-schema';

export const createEventSchema = eventFormSchema;

export type CreateEventInput = z.infer<typeof createEventSchema>;
