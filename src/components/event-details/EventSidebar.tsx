import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GradientDivider } from '@/components/ui/gradient-divider';
import { Event, Registration, User } from '@/types';
import { Share2, Pencil, Mail, Phone, Users, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { getEditUrl } from '@/components/event-details';
import { isExternalRegistrationEvent } from './ExternalRegistrationFrame';
import { getCurrentPrice } from '@/api';

interface EventSidebarProps {
  event: Event;
  user: User | null;
  userRegistration: Registration | null;
  isRegistrationOpen: boolean;
  closedReason: string | null;
  onRegister: () => void;
  onShare: () => void;
  previewMode?: boolean;
  hideRegistrationCard?: boolean;
}

export const EventSidebar = ({
  event,
  user,
  userRegistration,
  isRegistrationOpen,
  closedReason,
  onRegister,
  onShare,
  previewMode = false,
  hideRegistrationCard = false,
}: EventSidebarProps) => {
  const hasExternalRegistration = isExternalRegistrationEvent(event);
  const lowestOnlinePrice = Math.min(
    ...event.distances.map((distance) => getCurrentPrice(distance).price),
  );

  const totalSpots = event.distances.reduce((acc, d) => acc + (d.limit ?? 0), 0);
  const totalRegistered = event.distances.reduce((acc, d) => acc + d.registeredCount, 0);
  const hasAnyLimit = event.distances.some((d) => d.limit != null);
  const remainingSpots = hasAnyLimit ? totalSpots - totalRegistered : null;

  const canEdit =
    !previewMode &&
    (user?.role === 'admin' ||
      user?.role === 'superadmin' ||
      user?.role === 'moderator' ||
      (user?.role === 'organizer' && event.organizerId === user?.id));

  return (
    <div className="space-y-6">
      {!hideRegistrationCard && (
        <Card className="sticky top-20 overflow-hidden border-white/10 bg-white/[0.04] shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
          <GradientDivider />
          <CardHeader className="pb-5">
            <CardTitle className="text-lg">
              {userRegistration
                ? '✅ Jesteś zapisany!'
                : previewMode
                  ? 'Test zapisów'
                  : 'Zapisz się'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {userRegistration ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-primary/10 bg-gradient-to-br from-primary/5 to-warning/5 p-4">
                  <div className="text-xs uppercase tracking-wide text-foreground/60">
                    Twój dystans
                  </div>
                  <div className="mt-0.5 font-semibold">{userRegistration.distanceName}</div>
                  {userRegistration.bibNumber && (
                    <>
                      <div className="mt-3 text-xs uppercase tracking-wide text-foreground/60">
                        Numer startowy
                      </div>
                      <div className="mt-0.5 text-3xl font-bold text-primary">
                        {userRegistration.bibNumber}
                      </div>
                    </>
                  )}
                </div>
                <Badge variant={userRegistration.status === 'confirmed' ? 'default' : 'secondary'}>
                  {userRegistration.status === 'confirmed' ? 'Potwierdzony' : 'Oczekuje'}
                </Badge>
              </div>
            ) : (
              <>
                {hasExternalRegistration ? (
                  <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-center">
                    <p className="text-sm font-medium">Zapisy w zewnętrznym formularzu</p>
                    <p className="mt-1 text-xs text-foreground/65">
                      Formularz jest osadzony w sekcji zapisów na tej stronie.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground/65">Cena od</span>
                      <span className="text-lg font-bold text-primary">{lowestOnlinePrice} zł</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground/65">Dystanse</span>
                      <span className="font-medium">
                        {event.distances.length}{' '}
                        {event.distances.length === 1 ? 'dostępny' : 'dostępnych'}
                      </span>
                    </div>
                    {remainingSpots !== null && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-foreground/65">
                          <Users className="h-3.5 w-3.5" />
                          Miejsca
                        </span>
                        <span
                          className={`font-medium ${remainingSpots <= 10 ? 'text-warning' : ''}`}
                        >
                          Pozostało {remainingSpots}
                        </span>
                      </div>
                    )}
                    {!hasAnyLimit && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-foreground/65">
                          <Users className="h-3.5 w-3.5" />
                          Miejsca
                        </span>
                        <span className="font-medium">Brak limitu</span>
                      </div>
                    )}
                    {isRegistrationOpen && (
                      <div className="flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        Zapisy otwarte
                      </div>
                    )}
                  </div>
                )}
                <Button
                  onClick={onRegister}
                  className="h-12 w-full rounded-lg shadow-[0_14px_40px_rgba(38,116,217,0.32)]"
                  size="lg"
                  disabled={!isRegistrationOpen}
                >
                  {previewMode ? 'Przetestuj formularz' : 'Rozpocznij zapis'}
                </Button>
                {isRegistrationOpen ? (
                  <div className="space-y-1.5">
                    <p className="flex items-center justify-center gap-1.5 text-center text-xs text-foreground/60">
                      <Clock className="h-3 w-3" />
                      {previewMode
                        ? 'Symulator nie utworzy prawdziwego zapisu ani płatności.'
                        : `Zapisy do ${format(new Date(event.registrationDeadline), 'd MMMM yyyy', { locale: pl })}`}
                    </p>
                    {!previewMode && !hasExternalRegistration && (
                      <p className="flex items-center justify-center gap-1 text-center text-xs text-foreground/55">
                        <ChevronRight className="h-3 w-3" />
                        W następnym kroku wybierzesz kategorię i pakiet
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-sm font-medium text-destructive">{closedReason}</p>
                )}
              </>
            )}

            <div className="space-y-3 border-t border-white/10 pt-5">
              <Button
                variant="outline"
                className="h-11 w-full border-white/10 bg-white/[0.035] hover:bg-white/[0.07]"
                onClick={onShare}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Udostępnij
              </Button>
            </div>

            {canEdit && (
              <div className="border-t border-white/10 pt-4">
                <Button
                  variant="secondary"
                  className="h-11 w-full border border-white/10 bg-white/[0.045] hover:bg-white/[0.08]"
                  asChild
                >
                  <Link to={getEditUrl(event, user)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edytuj wydarzenie
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div id="event-start-list-sidebar-slot" className="space-y-5" />

      {event.organizerContact && (
        <Card className="border-white/10 bg-white/[0.035]">
          <CardHeader>
            <CardTitle className="text-base">Kontakt z organizatorem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm font-medium">{event.organizerName}</p>
            <div className="space-y-2">
              <a
                href={`mailto:${event.organizerContact.email}`}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Mail className="h-4 w-4" />
                Napisz do organizatora
              </a>
              {event.organizerContact.phone && (
                <a
                  href={`tel:${event.organizerContact.phone}`}
                  className="flex items-center gap-2 text-sm text-foreground/70 transition-colors hover:text-foreground"
                >
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
