import { render } from '@react-email/render';

import { EmailProvider } from '../provider';
import {
  PaymentFailedEmail,
  type PaymentFailedEmailProps
} from './payment-failed-email';

export async function sendPaymentFailedEmail(
  input: PaymentFailedEmailProps & { recipient: string }
): Promise<void> {
  const component = PaymentFailedEmail(input);
  const html = await render(component);
  const text = await render(component, { plainText: true });

  await EmailProvider.sendEmail({
    recipient: input.recipient,
    subject: 'Cobrança não processada',
    html,
    text
  });
}
