import { z } from 'zod';

export const deleteTicketTypeSchema = z.object({
  eventId: z.string().uuid(),
  ticketTypeId: z.string().uuid()
});

export type DeleteTicketTypeInput = z.infer<typeof deleteTicketTypeSchema>;
