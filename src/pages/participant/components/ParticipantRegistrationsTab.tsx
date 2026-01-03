import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Registration } from '@/types';
import { Calendar, MapPin, ShoppingBag, Ticket, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { mockEvents } from '@/data/mockData';

interface ParticipantRegistrationsTabProps {
  registrations: Registration[];
}

const ParticipantRegistrationsTab = ({ registrations }: ParticipantRegistrationsTabProps) => {
  const registrationsWithEvents = registrations
    .map(reg => {
      const event = mockEvents.find(e => e.id === reg.eventId);
      return { ...reg, event };
    })
    .filter(reg => reg.event)
    .sort((a, b) => new Date(a.event!.date).getTime() - new Date(b.event!.date).getTime());

  if (registrationsWithEvents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Ticket className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-2">Brak aktywnych zapisów</h3>
          <p className="text-muted-foreground mb-4">Zapisz się na nadchodzące zawody!</p>
          <Button asChild>
            <Link to="/events">Przeglądaj wydarzenia</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {registrationsWithEvents.map(reg => (
        <Card key={reg.id} className="overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            {/* Event Image */}
            <div className="sm:w-32 h-32 sm:h-auto shrink-0">
              <img 
                src={reg.event!.imageUrl} 
                alt={reg.event!.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <CardContent className="p-4 flex-1">
              {/* Status Badge */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold line-clamp-2">{reg.event!.name}</h3>
                <Badge variant={reg.status === 'confirmed' ? 'default' : 'secondary'} className="shrink-0">
                  {reg.status === 'confirmed' ? 'Potwierdzony' : 'Oczekuje'}
                </Badge>
              </div>
              
              {/* Event Info */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(reg.event!.date), 'd MMM yyyy', { locale: pl })}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {reg.event!.city}
                </div>
              </div>
              
              {/* Registration Details */}
              <div className="space-y-2 mb-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{reg.distanceName}</Badge>
                  <Badge variant="outline">{reg.category}</Badge>
                </div>
                
                {reg.bibNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <Ticket className="h-4 w-4 text-muted-foreground" />
                    <span>Numer startowy:</span>
                    <span className="font-mono font-bold text-primary">#{reg.bibNumber}</span>
                  </div>
                )}
                
                {reg.pricePaid && (
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span>Zapłacono:</span>
                    <span className="font-semibold">{reg.pricePaid} zł</span>
                    {reg.discountCode && (
                      <Badge variant="secondary" className="text-xs">
                        -{reg.discountAmount} zł ({reg.discountCode})
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              
              {/* Merchandise */}
              {reg.merchandiseOrders && reg.merchandiseOrders.length > 0 && (
                <div className="border-t pt-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <ShoppingBag className="h-4 w-4" />
                    <span>Zamówione gadżety:</span>
                  </div>
                  <div className="space-y-1">
                    {reg.merchandiseOrders.map((order, idx) => (
                      <div key={idx} className="text-sm flex items-center gap-2">
                        {order.colorHex && (
                          <span 
                            className="w-3 h-3 rounded-full border" 
                            style={{ backgroundColor: order.colorHex }}
                          />
                        )}
                        <span>
                          {order.merchandiseName}
                          {order.size && ` (${order.size})`}
                          {order.quantity > 1 && ` x${order.quantity}`}
                        </span>
                        <span className="text-muted-foreground ml-auto">{order.price} zł</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action */}
              <div className="mt-3 pt-3 border-t">
                <Button variant="ghost" size="sm" asChild className="w-full">
                  <Link to={`/events/${reg.event!.slug}`}>Zobacz wydarzenie</Link>
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ParticipantRegistrationsTab;
