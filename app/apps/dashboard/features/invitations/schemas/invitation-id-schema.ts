import { z } from 'zod';

export const invitationIdSchema = z.object({
  invitationId: z.string().min(1, 'Convite invalido')
});

export type InvitationIdInput = z.infer<typeof invitationIdSchema>;
