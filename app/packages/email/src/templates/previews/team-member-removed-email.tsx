import { TeamMemberRemovedEmail } from '../../organization/team-member-removed-email';

export default function TeamMemberRemovedEmailPreview() {
  return (
    <TeamMemberRemovedEmail
      appName="Arki"
      name="João Silva"
      organizationName="Acme Inc"
      dashboardLink="https://example.com/dashboard"
    />
  );
}
