import type SendmailTransport from 'nodemailer/lib/sendmail-transport';
import type SMTPConnection from 'nodemailer/lib/smtp-connection';

import { keys } from '../../../keys';

export type NodemailerTransport =
  | SendmailTransport.Options
  | SMTPConnection.Options
  | string;

export function detectTransport(): NodemailerTransport {
  const env = keys();

  if (env.EMAIL_NODEMAILER_URL) {
    try {
      const url = new URL(env.EMAIL_NODEMAILER_URL);
      const port = parseInt(url.port) || 25;
      const auth =
        url.username && url.password
          ? {
              user: decodeURIComponent(url.username),
              pass: decodeURIComponent(url.password)
            }
          : undefined;

      return {
        host: url.hostname,
        port,
        auth,
        secure: port === 465,
        requireTLS: port === 587,
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
      };
    } catch (error) {
      console.error(
        'Failed to parse EMAIL_NODEMAILER_URL (use SMTP and encode @ in username as %40):',
        error
      );
    }
  }

  if (!env.EMAIL_NODEMAILER_URL && process.env.NODE_ENV === 'production') {
    console.warn(
      'EMAIL_NODEMAILER_URL não definida; caindo no sendmail, que não existe em serverless. Defina EMAIL_NODEMAILER_URL, ou EMAIL_ETHEREAL=true para uma caixa de testes.'
    );
  }
  return {
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail',
    secure: true
  };
}
