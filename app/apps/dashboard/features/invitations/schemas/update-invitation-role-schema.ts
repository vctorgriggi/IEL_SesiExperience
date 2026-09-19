import { z } from 'zod';

export const updateInvitationRoleSchema = z.object({
  invitationId: z.string().min(1, 'Convite invalido'),
  role: z.enum(['member', 'admin'])
});

export type UpdateInvitationRoleInput = z.infer<
  typeof updateInvitationRoleSchema
>;
