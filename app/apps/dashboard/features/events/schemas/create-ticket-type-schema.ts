import { z } from 'zod';

const dateOptional = z
  .union([z.string().datetime(), z.coerce.date(), z.date()])
  .optional()
  .nullable()
  .transform((d) =>
    d == null ? undefined : d instanceof Date ? d : new Date(d)
  );

export const createTicketTypeSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  priceCents: z.number().int().min(0).default(0),
  quantityAvailable: z.number().int().min(0).nullable().optional(),
  saleStartsAt: dateOptional,
  saleEndsAt: dateOptional,
  isVisible: z.boolean().default(true)
});

export type CreateTicketTypeInput = z.infer<typeof createTicketTypeSchema>;
