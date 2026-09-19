import { render } from '@react-email/render';

import { EmailProvider } from '../provider';
import {
  TrialEndedEmail,
  type TrialEndedEmailProps
} from './trial-ended-email';

export async function sendTrialEndedEmail(
  input: TrialEndedEmailProps & { recipient: string }
): Promise<void> {
  const component = TrialEndedEmail(input);
  const html = await render(component);
  const text = await render(component, { plainText: true });

  await EmailProvider.sendEmail({
    recipient: input.recipient,
    subject: 'Seu trial acabou',
    html,
    text
  });
}
