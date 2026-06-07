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
    <CardContent className="space-y-6 pt-6">
      <div>
        <h3 className="mb-4 font-semibold">O wydarzeniu</h3>
        <RichTextDisplay html={event.description} className="text-muted-foreground" />
      </div>

      {event.organizersHtml && (
        <div>
          <h4 className="mb-3 font-semibold">Organizatorzy</h4>
          <RichTextDisplay html={event.organizersHtml} />
        </div>
      )}

      {event.rulesHtml && (
        <div>
          <h4 className="mb-3 font-semibold">Regulamin</h4>
          <RichTextDisplay html={event.rulesHtml} />
        </div>
      )}

      {!event.organizersHtml && (
        <div>
          <h4 className="mb-2 font-semibold">Lokalizacja</h4>
          <p className="text-muted-foreground">
            {event.location}, {event.city}
          </p>
        </div>
      )}

      {event.insuranceOption?.enabled && (
        <div>
          <h4 className="mb-2 flex items-center gap-2 font-semibold">
            <Shield className="h-4 w-4 text-primary" />
            Ubezpieczenie NNW
          </h4>
          <p className="text-sm text-muted-foreground">
            Ubezpieczenie NNW jest dostępne do wykupienia podczas rejestracji na zawody.
          </p>
        </div>
      )}

      {event.enableMerchandiseInRegistration &&
        event.merchandise &&
        event.merchandise.length > 0 && (
          <div>
            <h4 className="mb-3 flex items-center gap-2 font-semibold">
              <ShoppingBag className="h-4 w-4 text-primary" />
              Gadżety dostępne przy rejestracji
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {event.merchandise.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-2"
                >
                  <span className="text-sm">{item.name}</span>
                  <Badge variant="secondary">{item.price} zł</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

      <div>
        <h4 className="mb-3 font-semibold">Organizator</h4>
        {!event.organizersHtml && <p className="mb-3 font-medium">{event.organizerName}</p>}
        {event.organizerContact && (
          <div className="space-y-2">
            <a
              href={`mailto:${event.organizerContact.email}`}
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="h-4 w-4" />
              {event.organizerContact.email}
            </a>
            {event.organizerContact.phone && (
              <a
                href={`tel:${event.organizerContact.phone}`}
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Phone className="h-4 w-4" />
                {event.organizerContact.phone}
              </a>
            )}
            {event.organizerContact.website && (
              <a
                href={event.organizerContact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
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
