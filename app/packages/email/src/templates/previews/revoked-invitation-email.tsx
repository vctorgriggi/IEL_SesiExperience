import { RevokedInvitationEmail } from '../../invitations/revoked-invitation-email';

export default function RevokedInvitationEmailPreview() {
  return (
    <RevokedInvitationEmail
      appName="Arki"
      organizationName="Minha Organização"
    />
  );
}
