import { z } from 'zod';

export const updateMemberRoleSchema = z.object({
  memberId: z.string().min(1, 'Membro invalido'),
  role: z.enum(['member', 'admin'])
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
