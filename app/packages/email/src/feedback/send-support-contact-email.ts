import { EmailProvider } from '../provider';

export type SendSupportContactEmailInput = {
  recipient: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendSupportContactEmail(
  input: SendSupportContactEmailInput
): Promise<void> {
  const { recipient, userName, userEmail, subject, message } = input;
  const text = [
    `Assunto: ${subject}`,
    ``,
    `De: ${userName} <${userEmail}>`,
    ``,
    message
  ].join('\n');

  const html = [
    '<p><strong>Assunto:</strong> ' + escapeHtml(subject) + '</p>',
    '<p><strong>De:</strong> ' +
      escapeHtml(userName) +
      ' &lt;' +
      escapeHtml(userEmail) +
      '&gt;</p>',
    '<hr/>',
    '<p>' + escapeHtml(message).replace(/\n/g, '<br/>') + '</p>'
  ].join('\n');

  await EmailProvider.sendEmail({
    recipient,
    subject: `[Suporte] ${subject}`,
    html,
    text,
    replyTo: userEmail
  });
}
