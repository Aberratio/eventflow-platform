import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Event, Registration } from '@/types';
import { disciplineLabels } from '@/api/mock/labels';
import {
  Users,
  Calendar,
  MapPin,
  TrendingUp,
  ExternalLink,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface EventOverviewTabProps {
  event: Event;
  registrations: Registration[];
}

export const EventOverviewTab = ({ event, registrations }: EventOverviewTabProps) => {
  const { toast } = useToast();
  const confirmedRegistrations = registrations.filter((r) => r.status === 'confirmed');
  const pendingRegistrations = registrations.filter((r) => r.status === 'pending');
  const totalRevenue = confirmedRegistrations.reduce((acc, reg) => {
    const distance = event.distances.find((d) => d.id === reg.distanceId);
    return acc + (distance?.price || 0);
  }, 0);

  const registrationsByDistance = event.distances.map((d) => ({
    distance: d,
    count: registrations.filter((r) => r.distanceId === d.id).length,
    percentage: d.limit
      ? Math.round((registrations.filter((r) => r.distanceId === d.id).length / d.limit) * 100)
      : 0,
  }));

  const handleResubmit = () => {
    toast({
      title: 'Wydarzenie zgłoszone ponownie',
      description: 'Twoje wydarzenie zostało przesłane do ponownej weryfikacji.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Rejection alert */}
      {event.status === 'rejected' && event.rejectionReason && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Wydarzenie odrzucone</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-3">{event.rejectionReason}</p>
            <Button size="sm" onClick={handleResubmit}>
              <Send className="mr-2 h-4 w-4" />
              Popraw i zgłoś ponownie
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Awaiting approval info */}
      {event.status === 'awaiting_approval' && (
        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertTitle>Oczekuje na akceptację</AlertTitle>
          <AlertDescription>
            Twoje wydarzenie zostało przesłane do weryfikacji. Otrzymasz powiadomienie po
            rozpatrzeniu.
            {event.submittedAt && (
              <span className="mt-1 block text-xs text-muted-foreground">
                Zgłoszono: {new Date(event.submittedAt).toLocaleDateString('pl-PL')}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{confirmedRegistrations.length}</div>
                <div className="text-sm text-muted-foreground">Potwierdzonych</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-warning/10 p-3">
                <Users className="h-6 w-6 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-bold">{pendingRegistrations.length}</div>
                <div className="text-sm text-muted-foreground">Oczekujących</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-success/10 p-3">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} PLN</div>
                <div className="text-sm text-muted-foreground">Przychód</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{event.date}</div>
                <div className="text-sm text-muted-foreground">Data wydarzenia</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event details */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informacje o wydarzeniu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge>{disciplineLabels[event.discipline]}</Badge>
              <Badge variant={event.status === 'published' ? 'default' : 'secondary'}>
                {event.status === 'published'
                  ? 'Opublikowane'
                  : event.status === 'draft'
                    ? 'Szkic'
                    : event.status === 'completed'
                      ? 'Zakończone'
                      : 'Anulowane'}
              </Badge>
              {event.featured && <Badge variant="outline">⭐ Wyróżnione</Badge>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {event.location}, {event.city}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Termin rejestracji: {event.registrationDeadline}</span>
              </div>
            </div>

            <p className="text-muted-foreground">{event.description}</p>

            <Button variant="outline" asChild>
              <Link to={`/events/${event.slug}`}>
                <ExternalLink className="mr-2 h-4 w-4" /> Zobacz stronę wydarzenia
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zapisy na dystanse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {registrationsByDistance.map(({ distance, count, percentage }) => (
                <div key={distance.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{distance.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {count} / {distance.limit || '∞'}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {distance.length} {distance.unit}
                    </span>
                    <span>{distance.price} PLN</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
