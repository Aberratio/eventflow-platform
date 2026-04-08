import { Card, CardContent } from '@/components/ui/card';
import { Event } from '@/types';
import { Mail, Phone, Globe, Shield, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RichTextDisplay } from '@/components/ui/rich-text-display';

interface EventInfoTabProps {
  event: Event;
}

export const EventInfoTab = ({ event }: EventInfoTabProps) => (
  <Card>
    <CardContent className="pt-6 space-y-6">
      <div>
        <h3 className="font-semibold mb-4">O wydarzeniu</h3>
        <p className="text-muted-foreground">{event.description}</p>
      </div>

      {event.organizersHtml && (
        <div>
          <h4 className="font-semibold mb-3">Organizatorzy</h4>
          <RichTextDisplay html={event.organizersHtml} />
        </div>
      )}

      {event.rulesHtml && (
        <div>
          <h4 className="font-semibold mb-3">Regulamin</h4>
          <RichTextDisplay html={event.rulesHtml} />
        </div>
      )}

      {!event.organizersHtml && (
        <div>
          <h4 className="font-semibold mb-2">Lokalizacja</h4>
          <p className="text-muted-foreground">{event.location}, {event.city}</p>
        </div>
      )}

      {event.insuranceOption?.enabled && (
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Ubezpieczenie NNW
          </h4>
          <p className="text-sm text-muted-foreground">
            Ubezpieczenie NNW jest dostępne do wykupienia podczas rejestracji na zawody.
          </p>
        </div>
      )}

      {event.enableMerchandiseInRegistration && event.merchandise && event.merchandise.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            Gadżety dostępne przy rejestracji
          </h4>
          <div className="grid sm:grid-cols-2 gap-2">
            {event.merchandise.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <span className="text-sm">{item.name}</span>
                <Badge variant="secondary">{item.price} zł</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="font-semibold mb-3">Organizator</h4>
        {!event.organizersHtml && <p className="font-medium mb-3">{event.organizerName}</p>}
        {event.organizerContact && (
          <div className="space-y-2">
            <a href={`mailto:${event.organizerContact.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Mail className="h-4 w-4" />
              {event.organizerContact.email}
            </a>
            {event.organizerContact.phone && (
              <a href={`tel:${event.organizerContact.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Phone className="h-4 w-4" />
                {event.organizerContact.phone}
              </a>
            )}
            {event.organizerContact.website && (
              <a href={event.organizerContact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Globe className="h-4 w-4" />
                {event.organizerContact.website.replace('https://', '')}
              </a>
            )}
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);
