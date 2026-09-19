import { z } from 'zod';

export const registerForEventPublicSchema = z.object({
  eventSlug: z.string().min(1, 'Slug do evento é obrigatório'),
  ticketId: z.string().uuid('Selecione um tipo de ingresso'),
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido')
});

export type RegisterForEventPublicInput = z.infer<
  typeof registerForEventPublicSchema
>;
