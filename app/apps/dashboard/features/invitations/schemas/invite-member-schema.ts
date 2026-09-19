import { z } from 'zod';

export const inviteMemberSchema = z.object({
  email: z.string().email('Email invalido'),
  role: z.enum(['member', 'admin'])
});

export type InviteMemberFormData = z.infer<typeof inviteMemberSchema>;
