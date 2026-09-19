import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const emailProviderSchema = z
  .enum(['nodemailer', 'postmark', 'resend', 'sendgrid'])
  .optional()
  .default('nodemailer');

export const keys = () =>
  createEnv({
    server: {
      EMAIL_PROVIDER: emailProviderSchema,
      EMAIL_FROM: z.string().default('noreply@example.com'),
      EMAIL_FEEDBACK_INBOX: z.string().email().optional(),
      EMAIL_NODEMAILER_URL: z.string().optional(),
      EMAIL_ETHEREAL: z
        .string()
        .optional()
        .transform((value) => value === 'true' || value === '1'),
      EMAIL_POSTMARK_SERVER_TOKEN: z.string().optional(),
      EMAIL_RESEND_API_KEY: z.string().optional(),
      EMAIL_SENDGRID_API_KEY: z.string().optional()
    },
    runtimeEnv: {
      EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
      EMAIL_FROM: process.env.EMAIL_FROM,
      EMAIL_FEEDBACK_INBOX: process.env.EMAIL_FEEDBACK_INBOX,
      EMAIL_NODEMAILER_URL: process.env.EMAIL_NODEMAILER_URL,
      EMAIL_ETHEREAL: process.env.EMAIL_ETHEREAL,
      EMAIL_POSTMARK_SERVER_TOKEN: process.env.EMAIL_POSTMARK_SERVER_TOKEN,
      EMAIL_RESEND_API_KEY: process.env.EMAIL_RESEND_API_KEY,
      EMAIL_SENDGRID_API_KEY: process.env.EMAIL_SENDGRID_API_KEY
    },
    emptyStringAsUndefined: true
  });
