import nodemailer, { type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

import { keys } from '../../../keys';
import { type EmailPayload, type EmailProvider } from '../types';
import { detectTransport } from './detect-transport';

/**
 * Com `EMAIL_ETHEREAL`, o Nodemailer cria uma caixa de testes descartável e
 * nada é entregue de verdade: cada mensagem enviada vira uma URL de
 * pré-visualização impressa no log. É o modo indicado para demonstração, onde
 * configurar um provedor real não faz sentido.
 */
async function createTransporter(): Promise<Transporter> {
  const env = keys();

  if (!env.EMAIL_NODEMAILER_URL && env.EMAIL_ETHEREAL) {
    const account = await nodemailer.createTestAccount();
    console.info(
      `[email] Ethereal ativo. Caixa de testes: ${account.user} / ${account.pass}`
    );

    return nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass }
    });
  }

  return nodemailer.createTransport(detectTransport());
}

class NodemailerEmailProvider implements EmailProvider {
  private readonly from: string;
  private transporter: Promise<Transporter> | null = null;

  constructor() {
    const from = keys().EMAIL_FROM;
    if (!from) {
      throw new Error('Missing EMAIL_FROM in environment configuration');
    }
    this.from = from;
  }

  public async sendEmail(
    payload: EmailPayload
  ): Promise<SMTPTransport.SentMessageInfo> {
    this.transporter ??= createTransporter();
    const transporter = await this.transporter;

    const info = await transporter.sendMail({
      from: this.from,
      to: payload.recipient,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: payload.replyTo
    });

    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) {
      console.info(`[email] "${payload.subject}" para ${payload.recipient}`);
      console.info(`[email] abra a mensagem em: ${preview}`);
    }

    return info;
  }
}

export const nodemailerEmailProvider = new NodemailerEmailProvider();
