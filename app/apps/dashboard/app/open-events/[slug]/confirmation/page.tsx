import { notFound } from 'next/navigation';
import { getRegistrationByCode } from '@/features/events/data/get-registration-by-code';
import QRCode from 'qrcode';

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui';

type ConfirmationPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ code?: string }>;
};

export default async function ConfirmationPage({
  params,
  searchParams
}: ConfirmationPageProps) {
  const { slug } = await params;
  const { code } = await searchParams;
  if (!code) {
    notFound();
  }
  const registration = await getRegistrationByCode(code);
  if (!registration || registration.eventSlug !== slug) {
    notFound();
  }
  const qrPayload = JSON.stringify({
    code: registration.registrationCode,
    eventId: registration.eventId,
    name: registration.name
  });
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 200 });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center px-4">
          <span className="text-sm font-medium text-muted-foreground">
            Ingresso
          </span>
        </div>
      </header>

      <main className="container mx-auto max-w-md px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Inscrição confirmada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              <strong className="text-foreground">
                {registration.eventTitle}
              </strong>
            </p>
            <p>
              Participante: <strong>{registration.name}</strong>
            </p>
            {registration.ticketTypeName && (
              <p>
                Ingresso: <strong>{registration.ticketTypeName}</strong>
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Código:{' '}
              <code className="rounded bg-muted px-1 font-mono">
                {registration.registrationCode}
              </code>
            </p>
            <div className="flex flex-col items-center gap-2 pt-4">
              <img
                src={qrDataUrl}
                alt="QR Code do ingresso"
                width={200}
                height={200}
                className="rounded border border-border"
              />
              <p className="text-xs text-muted-foreground">
                Apresente este QR Code na entrada
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
