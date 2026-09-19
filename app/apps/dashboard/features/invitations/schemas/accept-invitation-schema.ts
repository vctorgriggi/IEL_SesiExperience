import { z } from 'zod';

export const acceptInvitationBodySchema = z.object({
  token: z.string().min(1, 'Token é obrigatório')
});

export type AcceptInvitationBody = z.infer<typeof acceptInvitationBodySchema>;
