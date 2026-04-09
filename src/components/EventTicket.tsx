import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Download, Calendar, MapPin, User, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Ticket } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface EventTicketProps {
  ticket: Ticket;
}

export const EventTicket = ({ ticket }: EventTicketProps) => {
  const { toast } = useToast();

  const handleDownload = () => {
    toast({
      title: 'Pobieranie biletu',
      description: 'Bilet PDF zostanie pobrany za chwilę...',
    });
    // Mock - in real app, would generate and download PDF
  };

  // QR code data - contains ticket verification info
  const qrData = JSON.stringify({
    ticketId: ticket.id,
    eventId: ticket.eventId,
    bibNumber: ticket.bibNumber,
    distanceId: ticket.distanceId,
  });

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* QR Code Section */}
          <div className="flex items-center justify-center bg-muted p-6 sm:w-48 sm:flex-shrink-0">
            <div className="rounded-lg bg-background p-3">
              <QRCodeSVG value={qrData} size={120} level="H" includeMargin={false} />
            </div>
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
                <span>{format(new Date(ticket.eventDate), 'd MMMM yyyy', { locale: pl })}</span>
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

            <div className="pt-2">
              <Button variant="outline" onClick={handleDownload} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Pobierz PDF
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
