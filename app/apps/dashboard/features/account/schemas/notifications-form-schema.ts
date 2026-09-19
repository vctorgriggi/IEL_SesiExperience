import { z } from 'zod';

export const marketingEmailsSchema = z.object({
  enabledNewsletter: z.boolean(),
  enabledProductUpdates: z.boolean()
});

export const transactionalEmailsSchema = z.object({
  enabledInboxNotifications: z.boolean(),
  enabledWeeklySummary: z.boolean()
});

export type MarketingEmailsValues = z.infer<typeof marketingEmailsSchema>;
export type TransactionalEmailsValues = z.infer<
  typeof transactionalEmailsSchema
>;
