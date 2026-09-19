import { MagicLinkEmail } from '../../auth/magic-link-email';

export default function MagicLinkEmailPreview() {
  return (
    <MagicLinkEmail
      appName="Arki"
      signInLink="https://example.com/auth/callback?token=abc123"
    />
  );
}
