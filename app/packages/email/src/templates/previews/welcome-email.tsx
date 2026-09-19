import { WelcomeEmail } from '../../auth/welcome-email';

export default function WelcomeEmailPreview() {
  return (
    <WelcomeEmail
      appName="Arki"
      getStartedLink="https://example.com/organizations"
      name="João Silva"
    />
  );
}
