import { render } from '@react-email/render';

import { APP_NAME } from '@workspace/common/app';

import { EmailProvider } from '../provider';
import {
  VerifyEmailAddressEmail,
  type VerifyEmailAddressEmailProps
} from './verify-email-address-email';

export async function sendVerifyEmailAddressEmail(
  input: VerifyEmailAddressEmailProps & { recipient: string; appName?: string }
): Promise<void> {
  const appName = input.appName ?? APP_NAME;
  const component = VerifyEmailAddressEmail({ ...input, appName });
  const html = await render(component);
  const text = await render(component, { plainText: true });

  await EmailProvider.sendEmail({
    recipient: input.recipient,
    subject: `Verificar email | ${appName}`,
    html,
    text
  });
}
