import { disciplineLabels } from '@/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RichTextDisplay } from '@/components/ui/rich-text-display';
import { Event, Registration } from '@/types';
import {
  Calendar,
  Clock,
  CreditCard,
  ExternalLink,
  Flag,
  Globe2,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  Route,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface EventOverviewTabProps {
  event: Event;
  registrations: Registration[];
}

export const EventOverviewTab = ({ event }: EventOverviewTabProps) => {
  const statusLabels: Record<Event['publicationStatus'], string> = {
    draft: 'Szkic',
    submitted: 'Do sprawdzenia',
    rejected: 'Odrzucone',
    published: 'Aktywne',
    finished: 'Zakończone',
    cancelled: 'Odwołane',
    archived: 'Zarchiwizowane',
    deleted: 'Usunięte',
  };

  const statusVariant = event.publicationStatus === 'published' ? 'default' : 'secondary';
  const eventPageUrl =
    event.publicationStatus === 'draft' ? `/events/${event.slug}/preview` : `/events/${event.slug}`;
  const dateLabel = event.isVirtual
    ? [event.startDate, event.endDate].filter(Boolean).join(' - ') || event.date
    : event.date;
  const locationLabel = event.isVirtual
    ? 'Wydarzenie wirtualne'
    : `${event.location}, ${event.city}`;
  const registrationMode =
    event.registrationEmbed?.enabled && event.registrationEmbed.mode === 'external_embed'
      ? 'Zapisy zewnętrzne'
      : event.registrationStatus === 'closed'
        ? 'Zapisy zamknięte'
        : event.registrationStatus === 'none'
          ? 'Bez zapisów'
          : 'Zapisy otwarte';
  const paymentLabel =
    event.paymentConfig?.type === 'organizer_bank'
      ? 'Przelew do organizatora'
      : event.paymentConfig?.type === 'admin_gateway'
        ? 'Bramka płatności'
        : 'Nie skonfigurowano';

  const overviewItems = [
    {
      icon: Calendar,
      label: 'Termin',
      value: dateLabel,
    },
    {
      icon: MapPin,
      label: event.isVirtual ? 'Tryb' : 'Miejsce',
      value: locationLabel,
    },
    {
      icon: Clock,
      label: 'Koniec zapisów',
      value: event.registrationDeadline || 'Nie ustawiono',
    },
    {
      icon: Flag,
      label: 'Dyscyplina',
      value: disciplineLabels[event.discipline],
    },
    {
      icon: ShieldCheck,
      label: 'Status',
      value: statusLabels[event.publicationStatus],
    },
    {
      icon: CreditCard,
      label: 'Płatności',
      value: paymentLabel,
    },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardContent className="space-y-6 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant}>{statusLabels[event.publicationStatus]}</Badge>
                <Badge variant="outline">{disciplineLabels[event.discipline]}</Badge>
                {event.featured && <Badge variant="outline">Wyróżnione</Badge>}
                {event.visibility === 'private' && <Badge variant="outline">Prywatne</Badge>}
                {event.isTest && <Badge variant="outline">Testowe</Badge>}
              </div>
              <div>
                <h2 className="text-xl font-semibold leading-tight">Najważniejsze informacje</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Komplet danych potrzebnych do szybkiej kontroli wydarzenia.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link to={eventPageUrl}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Podgląd
                </Link>
              </Button>
              <Button asChild>
                <Link to={`/organizer/events/${event.id}/settings`}>
                  <PencilLine className="mr-2 h-4 w-4" />
                  Edytuj
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {overviewItems.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-3 rounded-md border bg-muted/20 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                  </div>
                  <div className="truncate text-sm font-medium">{value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Globe2 className="h-4 w-4 text-primary" />
                Rejestracja
              </div>
              <div className="text-sm text-muted-foreground">{registrationMode}</div>
              {event.registrationEmbed?.externalUrl && (
                <div className="mt-1 truncate text-sm">{event.registrationEmbed.externalUrl}</div>
              )}
            </div>

            <div className="rounded-md border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Mail className="h-4 w-4 text-primary" />
                Kontakt organizatora
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="truncate">
                  {event.organizerContact?.email || 'Brak adresu e-mail'}
                </div>
                {event.organizerContact?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{event.organizerContact.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {event.description && (
            <div className="rounded-md border p-4">
              <div className="mb-2 text-sm font-semibold">Opis dla uczestników</div>
              <RichTextDisplay
                html={event.description}
                className="line-clamp-4 text-sm text-muted-foreground"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold">Dystanse</h2>
            <p className="text-sm text-muted-foreground">
              Zakres, limity i ceny bez statystyk zapisów.
            </p>
          </div>

          <div className="space-y-3">
            {event.distances.map((distance) => (
              <div key={distance.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{distance.name}</div>
                    {distance.length != null && (
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <Route className="h-4 w-4" />
                        <span>
                          {distance.length} {distance.unit}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold">{distance.price} PLN</div>
                    <div className="text-xs text-muted-foreground">
                      limit: {distance.limit || 'bez limitu'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
