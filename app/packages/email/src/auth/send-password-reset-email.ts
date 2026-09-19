import { render } from '@react-email/render';

import { APP_NAME } from '@workspace/common/app';

import { EmailProvider } from '../provider';
import {
  PasswordResetEmail,
  type PasswordResetEmailProps
} from './password-reset-email';

export async function sendPasswordResetEmail(
  input: PasswordResetEmailProps & { recipient: string }
): Promise<void> {
  const appName = input.appName ?? APP_NAME;
  const component = PasswordResetEmail({ ...input, appName });
  const html = await render(component);
  const text = await render(component, { plainText: true });

  await EmailProvider.sendEmail({
    recipient: input.recipient,
    subject: `Instruções para redefinir senha | ${appName}`,
    html,
    text
  });
}
