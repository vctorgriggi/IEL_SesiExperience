import { render } from '@react-email/render';

import { EmailProvider } from '../provider';
import {
  SubscriptionCanceledEmail,
  type SubscriptionCanceledEmailProps
} from './subscription-canceled-email';

export async function sendSubscriptionCanceledEmail(
  input: SubscriptionCanceledEmailProps & { recipient: string }
): Promise<void> {
  const component = SubscriptionCanceledEmail(input);
  const html = await render(component);
  const text = await render(component, { plainText: true });

  await EmailProvider.sendEmail({
    recipient: input.recipient,
    subject: 'Assinatura cancelada',
    html,
    text
  });
}
