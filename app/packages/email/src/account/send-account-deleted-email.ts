import { render } from '@react-email/render';

import { EmailProvider } from '../provider';
import {
  AccountDeletedEmail,
  type AccountDeletedEmailProps
} from './account-deleted-email';

export async function sendAccountDeletedEmail(
  input: AccountDeletedEmailProps & { recipient: string }
): Promise<void> {
  const component = AccountDeletedEmail(input);
  const html = await render(component);
  const text = await render(component, { plainText: true });

  await EmailProvider.sendEmail({
    recipient: input.recipient,
    subject: 'Conta excluída',
    html,
    text
  });
}
