import { render } from '@react-email/render';

import { APP_NAME } from '@workspace/common/app';

import { EmailProvider } from '../provider';
import { MagicLinkEmail, type MagicLinkEmailProps } from './magic-link-email';

export async function sendMagicLinkEmail(
  input: MagicLinkEmailProps & { recipient: string }
): Promise<void> {
  const appName = input.appName ?? APP_NAME;
  const component = MagicLinkEmail({
    appName,
    signInLink: input.signInLink
  });
  const html = await render(component);
  const text = await render(component, { plainText: true });

  await EmailProvider.sendEmail({
    recipient: input.recipient,
    subject: `Entrar no ${appName}`,
    html,
    text
  });
}
