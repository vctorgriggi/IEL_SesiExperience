import { render } from '@react-email/render';

import { APP_NAME } from '@workspace/common/app';

import { EmailProvider } from '../provider';
import {
  ConfirmEmailAddressChangeEmail,
  type ConfirmEmailAddressChangeEmailProps
} from './confirm-email-address-change-email';

export async function sendConfirmEmailAddressChangeEmail(
  input: ConfirmEmailAddressChangeEmailProps & {
    recipient: string;
    appName?: string;
  }
): Promise<void> {
  const appName = input.appName ?? APP_NAME;
  const component = ConfirmEmailAddressChangeEmail({ ...input, appName });
  const html = await render(component);
  const text = await render(component, { plainText: true });

  await EmailProvider.sendEmail({
    recipient: input.recipient,
    subject: `Confirmar novo email | ${appName}`,
    html,
    text
  });
}
