import { z } from 'zod';

export const memberIdSchema = z.object({
  memberId: z.string().min(1, 'Membro invalido')
});

export type MemberIdInput = z.infer<typeof memberIdSchema>;
