import { notFound } from 'next/navigation';
import { PublicEventRegistrationForm } from '@/components/events/public/public-event-registration-form';
import { getPublicEventBySlug } from '@/features/events/data/get-public-event-by-slug';
import { getPublicEventTicketTypes } from '@/features/events/data/get-public-event-ticket-types';
import { getTicketPriceLabel } from '@/features/events/utils/get-ticket-price-label';
import { eventDateFormatter, eventTimeFormatter } from '@/lib/formatters';
import {
  Calendar01Icon,
  Location01Icon,
  UserMultipleIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui';

type PageProps = { params: Promise<{ slug: string }> };

export default async function PublicEventPage({ params }: PageProps) {
  const { slug } = await params;
  const [event, ticketTypes] = await Promise.all([
    getPublicEventBySlug(slug),
    getPublicEventTicketTypes(slug)
  ]);
  if (!event) notFound();

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const priceLabel = getTicketPriceLabel(ticketTypes);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center px-4">
          <span className="text-sm font-medium text-muted-foreground">
            Evento
          </span>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-8">
        <article className="space-y-8">
          {event.imageUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
              <img
                src={event.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
            {event.createdBy?.name && (
              <p className="text-sm text-muted-foreground">
                Organizado por {event.createdBy.name}
              </p>
            )}
          </div>

          {event.description && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Sobre o evento</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="whitespace-pre-wrap text-sm">
                  {event.description}
                </CardDescription>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={Calendar01Icon}
                    size={18}
                    className="shrink-0 text-muted-foreground"
                  />
                  <span>
                    {eventDateFormatter.format(startDate)} ·{' '}
                    {eventTimeFormatter.format(startDate)} –{' '}
                    {eventTimeFormatter.format(endDate)}
                  </span>
                </li>
                {event.location && (
                  <li className="flex items-center gap-2">
                    <HugeiconsIcon
                      icon={Location01Icon}
                      size={18}
                      className="shrink-0 text-muted-foreground"
                    />
                    <span>{event.location}</span>
                  </li>
                )}
                {event.maxAttendees != null && (
                  <li className="flex items-center gap-2">
                    <HugeiconsIcon
                      icon={UserMultipleIcon}
                      size={18}
                      className="shrink-0 text-muted-foreground"
                    />
                    <span>Máx. {event.maxAttendees} participantes</span>
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <span className="font-medium">{priceLabel}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <section
            id="inscrever"
            className="scroll-mt-8"
          >
            <Card>
              <CardHeader>
                <CardTitle>Inscreva-se</CardTitle>
                <CardDescription>
                  Preencha seus dados para garantir sua vaga no evento.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PublicEventRegistrationForm
                  eventSlug={slug}
                  eventTitle={event.title}
                  ticketTypes={ticketTypes}
                />
              </CardContent>
            </Card>
          </section>
        </article>
      </main>
    </div>
  );
}
