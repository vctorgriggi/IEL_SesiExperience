import { z } from 'zod';

const dateSchema = z
  .union([z.string().datetime(), z.coerce.date(), z.date()])
  .transform((d) => (d instanceof Date ? d : new Date(d)));

const optionalCoercedInt = z.preprocess(
  (value) => (value === '' || value == null ? undefined : value),
  z.coerce.number().int().optional()
);

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'evento'
  );
}

const slugSchema = z
  .string()
  .optional()
  .transform((value) => slugify(value ?? ''));

export const eventFormSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().nullable().optional(),
  startDate: dateSchema,
  endDate: dateSchema,
  location: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  ticketType: z.enum(['free', 'paid']).default('free'),
  ticketPriceCents: optionalCoercedInt.nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  maxAttendees: optionalCoercedInt.nullable().optional(),
  isPublic: z.boolean().default(false),
  status: z
    .enum(['draft', 'published', 'cancelled', 'completed'])
    .default('draft'),
  metadata: z.record(z.string(), z.unknown()).nullable().optional()
});

export type EventFormValues = z.infer<typeof eventFormSchema>;
