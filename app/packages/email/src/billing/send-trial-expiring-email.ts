import { render } from '@react-email/render';

import { EmailProvider } from '../provider';
import {
  TrialExpiringEmail,
  type TrialExpiringEmailProps
} from './trial-expiring-email';

export async function sendTrialExpiringEmail(
  input: TrialExpiringEmailProps & { recipient: string }
): Promise<void> {
  const component = TrialExpiringEmail(input);
  const html = await render(component);
  const text = await render(component, { plainText: true });

  await EmailProvider.sendEmail({
    recipient: input.recipient,
    subject: 'Seu trial acaba em 3 dias',
    html,
    text
  });
}
