import { keys } from '../../keys';
import type { EmailProvider as EmailProviderType } from './types';

const PROVIDERS: Record<
  string,
  { load: () => Promise<Record<string, EmailProviderType>>; key: string }
> = {
  nodemailer: {
    load: () => import('./nodemailer'),
    key: 'nodemailerEmailProvider'
  },
  postmark: { load: () => import('./postmark'), key: 'postmarkEmailProvider' },
  resend: { load: () => import('./resend'), key: 'resendEmailProvider' },
  sendgrid: { load: () => import('./sendgrid'), key: 'sendgridEmailProvider' }
};

const name = keys().EMAIL_PROVIDER ?? 'nodemailer';
const config = PROVIDERS[name] ?? PROVIDERS.nodemailer;
const module = await config.load();

export const EmailProvider = module[config.key] as EmailProviderType;
