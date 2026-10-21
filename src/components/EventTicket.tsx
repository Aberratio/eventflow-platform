import { Link } from 'react-router-dom';
import { TicketQr } from '@/components/TicketQr';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Download, Calendar, MapPin, User, Hash, CheckCircle2 } from 'lucide-react';
import { Ticket } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface EventTicketProps {
  ticket: Ticket;
}

/** A ticket whose date is missing/unparseable must not crash the whole tab (RangeError). */
const formatEventDate = (value?: string | null): string => {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime())
    ? format(d, 'd MMMM yyyy', { locale: pl })
    : 'Data wkrótce';
};

export const EventTicket = ({ ticket }: EventTicketProps) => {
  // Kod startowy ważny tylko dla Zapisu opłaconego/potwierdzonego.
  const qrValue = ticket.registrationStatus === 'confirmed' && ticket.qrCode ? ticket.qrCode : null;
  const inactiveMessage =
    ticket.registrationStatus === 'pending'
      ? 'Bilet pojawi się po opłaceniu zapisu.'
      : 'Bilet nieaktywny — zapis został anulowany, usunięty lub wygasł.';

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* QR Code Section */}
          <div className="flex items-center justify-center bg-muted p-6 sm:w-48 sm:flex-shrink-0">
            {qrValue ? (
              <div className="rounded-lg bg-background p-3">
                <TicketQr value={qrValue} />
              </div>
            ) : (
              <p
                data-testid="ticket-inactive"
                className="text-center text-sm text-muted-foreground"
              >
                {inactiveMessage}
              </p>
            )}
          </div>

          {/* Ticket Details */}
          <div className="flex-1 space-y-4 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{ticket.eventName}</h3>
                <p className="font-medium text-primary">{ticket.distanceName}</p>
              </div>
              <Badge variant="outline" className="px-3 py-1 font-mono text-lg">
                #{ticket.bibNumber}
              </Badge>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatEventDate(ticket.eventDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{ticket.location}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{ticket.participantName}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash className="h-4 w-4" />
                <span>Kategoria: {ticket.category}</span>
              </div>
            </div>

            {/* "odprawiono Cię o 7:42" — the check-in fact
                Biuro Zawodów reports back via return-sync, shown right on the
                Bilet the moment it's known; absent while un-checked-in, so no
                empty/placeholder row appears for the common not-yet case. */}
            {ticket.checkedInAt && (
              <Badge
                variant="outline"
                className="flex w-fit items-center gap-1.5 border-primary/40 bg-primary/10 py-1.5 text-primary"
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  Odprawiono Cię o {format(new Date(ticket.checkedInAt), 'HH:mm', { locale: pl })}
                  {ticket.checkedInBy ? ` (${ticket.checkedInBy})` : ''}
                </span>
              </Badge>
            )}

            {qrValue && (
              <div className="pt-2">
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link to={`/participant/tickets/${ticket.registrationId}/print`}>
                    <Download className="mr-2 h-4 w-4" />
                    Pobierz bilet
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
