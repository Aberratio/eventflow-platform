import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Printer, ArrowLeft } from 'lucide-react';
import { getCare, getEventById, getRegistrationsByUser } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { TicketQr } from '@/components/TicketQr';

/**
 * Start card to print / save as PDF from the browser.
 * Without the app layout (navigation/footer); QR = the `pqr_…` token only, plus the `zqr_…`
 * of the Zawodnik, if available. Only for a confirmed Zapis.
 */
const TicketPrintPage = () => {
  const { registrationId } = useParams<{ registrationId: string }>();
  const { user } = useAuth();

  const regsQuery = useQuery({
    queryKey: ['registrations-by-user', user?.id],
    queryFn: () => getRegistrationsByUser(user!.id),
    enabled: Boolean(user?.id),
  });
  const registration = regsQuery.data?.data.find((r) => r.id === registrationId);

  const eventQuery = useQuery({
    queryKey: ['event', registration?.eventId],
    queryFn: () => getEventById(registration!.eventId),
    enabled: Boolean(registration?.eventId),
  });
  const careQuery = useQuery({
    queryKey: ['care'],
    queryFn: () => getCare(),
    enabled: Boolean(registration),
    retry: false,
  });

  const event = eventQuery.data?.data ?? null;
  const care = careQuery.data?.data;
  const identityCode = (() => {
    if (!registration?.competitorId || !care) return null;
    if (care.myProfile?.id === registration.competitorId) return care.myProfile.identityCode;
    return (
      care.myCompetitors.find((c) => c.competitorId === registration.competitorId)?.identityCode ??
      null
    );
  })();

  let body;
  if (regsQuery.isLoading || (registration && eventQuery.isLoading)) {
    body = <p className="text-muted-foreground">Ładowanie biletu…</p>;
  } else if (!registration) {
    body = <p>Nie znaleziono zapisu.</p>;
  } else if (registration.status !== 'confirmed' || !registration.qrCode) {
    body = (
      <p data-testid="ticket-inactive">
        {registration.status === 'pending'
          ? 'Bilet pojawi się po opłaceniu zapisu.'
          : 'Bilet nieaktywny — zapis został anulowany, usunięty lub wygasł.'}
      </p>
    );
  } else {
    const where = [event?.location, event?.city].filter(Boolean).join(', ');
    body = (
      <>
        <article className="space-y-4 rounded-lg border p-6" aria-label="Karta startowa">
          <header>
            <h1 className="text-2xl font-bold">{event?.name ?? registration.eventName}</h1>
            {event?.date && (
              <p className="text-muted-foreground">
                {format(new Date(event.date), 'd MMMM yyyy', { locale: pl })}
              </p>
            )}
            {where && <p className="text-muted-foreground">{where}</p>}
          </header>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Dystans</dt>
              <dd className="text-lg font-semibold">{registration.distanceName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Numer startowy</dt>
              <dd className="font-mono text-lg font-semibold">#{registration.bibNumber ?? '—'}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground">Zawodnik</dt>
              <dd className="text-lg font-semibold">{registration.userName}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-8">
            <figure className="space-y-1 text-center">
              <TicketQr value={registration.qrCode} size={180} />
              <figcaption className="text-xs text-muted-foreground">Kod startowy</figcaption>
            </figure>
            {identityCode && (
              <figure className="space-y-1 text-center">
                <TicketQr value={identityCode} size={180} />
                <figcaption className="text-xs text-muted-foreground">Kod tożsamości</figcaption>
              </figure>
            )}
          </div>
        </article>
        <Button onClick={() => window.print()} className="print:hidden">
          <Printer className="mr-2 h-4 w-4" />
          Drukuj / Zapisz jako PDF
        </Button>
      </>
    );
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <Button variant="ghost" asChild className="print:hidden">
        <Link to="/participant?tab=tickets">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Wróć do biletów
        </Link>
      </Button>
      {body}
    </main>
  );
};

export default TicketPrintPage;
