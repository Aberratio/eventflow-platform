import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EventTicket } from '@/components/EventTicket';
import { Ticket } from '@/types';
import { TicketIcon, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ParticipantTicketsTabProps {
  tickets: Ticket[];
}

const ParticipantTicketsTab = ({ tickets }: ParticipantTicketsTabProps) => {
  const activeTickets = tickets.filter((t) => new Date(t.eventDate) >= new Date());
  const pastTickets = tickets.filter((t) => new Date(t.eventDate) < new Date());

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Bilety są dostępne dla potwierdzonych zapisów. Pokaż kod QR podczas rejestracji na
          zawodach.
        </AlertDescription>
      </Alert>

      {/* Active tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TicketIcon className="h-5 w-5" />
            Nadchodzące wydarzenia ({activeTickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeTickets.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <TicketIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Brak biletów na nadchodzące wydarzenia.</p>
              <p className="text-sm">Zapisz się na zawody, aby otrzymać bilet.</p>
            </div>
          ) : (
            activeTickets.map((ticket) => <EventTicket key={ticket.id} ticket={ticket} />)
          )}
        </CardContent>
      </Card>

      {/* Past tickets */}
      {pastTickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">
              Archiwalne ({pastTickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pastTickets.map((ticket) => (
              <div key={ticket.id} className="opacity-60">
                <EventTicket ticket={ticket} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ParticipantTicketsTab;
