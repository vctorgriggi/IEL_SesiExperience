import { render } from '@react-email/render';

import { EmailProvider } from '../provider';
import {
  PaymentConfirmedEmail,
  type PaymentConfirmedEmailProps
} from './payment-confirmed-email';

export async function sendPaymentConfirmedEmail(
  input: PaymentConfirmedEmailProps & { recipient: string }
): Promise<void> {
  const component = PaymentConfirmedEmail(input);
  const html = await render(component);
  const text = await render(component, { plainText: true });

  await EmailProvider.sendEmail({
    recipient: input.recipient,
    subject: 'Pagamento confirmado',
    html,
    text
  });
}
