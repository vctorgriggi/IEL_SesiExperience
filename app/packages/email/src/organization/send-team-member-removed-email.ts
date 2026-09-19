import { render } from '@react-email/render';

import { EmailProvider } from '../provider';
import {
  TeamMemberRemovedEmail,
  type TeamMemberRemovedEmailProps
} from './team-member-removed-email';

export async function sendTeamMemberRemovedEmail(
  input: TeamMemberRemovedEmailProps & { recipient: string }
): Promise<void> {
  const component = TeamMemberRemovedEmail(input);
  const html = await render(component);
  const text = await render(component, { plainText: true });

  await EmailProvider.sendEmail({
    recipient: input.recipient,
    subject: `Você saiu de ${input.organizationName}`,
    html,
    text
  });
}
