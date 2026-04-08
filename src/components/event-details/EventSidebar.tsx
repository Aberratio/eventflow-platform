import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Event, Registration, User } from '@/types';
import { Share2, Pencil, Globe, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { getEditUrl } from '@/components/event-details';

interface EventSidebarProps {
  event: Event;
  user: User | null;
  userRegistration: Registration | null;
  isRegistrationOpen: boolean;
  closedReason: string | null;
  onRegister: () => void;
  onShare: () => void;
}

export const EventSidebar = ({
  event, user, userRegistration,
  isRegistrationOpen, closedReason,
  onRegister, onShare,
}: EventSidebarProps) => {
  const canEdit = user?.role === 'admin' || user?.role === 'moderator' ||
    (user?.role === 'organizer' && event.organizerId === user?.id);

  return (
    <div className="space-y-6">
      <Card className="sticky top-20 border-primary/20 shadow-md overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-warning to-primary" />
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {userRegistration ? '✅ Jesteś zapisany!' : 'Zapisz się'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {userRegistration ? (
            <div className="space-y-3">
              <div className="p-4 bg-gradient-to-br from-primary/5 to-warning/5 rounded-lg border border-primary/10">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Twój dystans</div>
                <div className="font-semibold mt-0.5">{userRegistration.distanceName}</div>
                {userRegistration.bibNumber && (
                  <>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mt-3">Numer startowy</div>
                    <div className="font-bold text-3xl text-primary mt-0.5">{userRegistration.bibNumber}</div>
                  </>
                )}
              </div>
              <Badge variant={userRegistration.status === 'confirmed' ? 'default' : 'secondary'}>
                {userRegistration.status === 'confirmed' ? 'Potwierdzony' : 'Oczekuje'}
              </Badge>
            </div>
          ) : (
            <>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">
                  Ceny od <span className="font-bold text-lg text-primary">{Math.min(...event.distances.map(d => d.price))} zł</span>
                </p>
              </div>
              <Button onClick={onRegister} className="w-full" size="lg" disabled={!isRegistrationOpen}>
                Zapisz się teraz
              </Button>
              {isRegistrationOpen ? (
                <p className="text-xs text-muted-foreground text-center">
                  Zapisy do {format(new Date(event.registrationDeadline), 'd MMMM yyyy', { locale: pl })}
                </p>
              ) : (
                <p className="text-sm text-destructive text-center font-medium">{closedReason}</p>
              )}
            </>
          )}

          <div className="pt-4 border-t space-y-2">
            <Button variant="outline" className="w-full" onClick={onShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Udostępnij
            </Button>
          </div>

          {canEdit && (
            <div className="pt-4 border-t">
              <Button variant="secondary" className="w-full" asChild>
                <Link to={getEditUrl(event, user)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edytuj wydarzenie
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {event.organizerContact && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kontakt z organizatorem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm font-medium">{event.organizerName}</p>
            <div className="space-y-2">
              <a href={`mailto:${event.organizerContact.email}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Mail className="h-4 w-4" />
                Napisz do organizatora
              </a>
              {event.organizerContact.phone && (
                <a href={`tel:${event.organizerContact.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Phone className="h-4 w-4" />
                  {event.organizerContact.phone}
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
