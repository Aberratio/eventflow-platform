import { approveEvent, disciplineLabels, getEvents, rejectEvent } from '@/api';
import { QUERY_KEYS } from '@/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Event } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Calendar, CheckCircle, Eye, FileText, MapPin, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { htmlToPlainText } from '@/lib/html';

export const ModeratorModerationTab = () => {
  const queryClient = useQueryClient();
  const { data: eventsResponse, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.events, 'moderator-moderation'],
    queryFn: () => getEvents({ includeUnpublished: true, includePrivate: true, pageSize: 100 }),
  });
  const events = eventsResponse?.data ?? [];
  const pendingEvents = events.filter((event) => event.publicationStatus === 'submitted');

  const approveMutation = useMutation({
    mutationFn: (event: Event) => approveEvent(event.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events });
      toast.success('Wydarzenie zatwierdzone i opublikowane.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Nie udało się zatwierdzić wydarzenia');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ event, reason }: { event: Event; reason: string }) =>
      rejectEvent(event.id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events });
      toast.success('Wydarzenie odesłane do poprawy.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Nie udało się odesłać wydarzenia');
    },
  });

  const approve = (event: Event) => approveMutation.mutate(event);

  const reject = (event: Event) => {
    const reason = window.prompt('Podaj powód odesłania wydarzenia do poprawy:');
    if (!reason?.trim()) return;
    rejectMutation.mutate({ event, reason: reason.trim() });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Ladowanie wydarzen...
        </CardContent>
      </Card>
    );
  }

  if (pendingEvents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-primary/50" />
            <p className="text-lg font-medium">Brak wydarzeń do sprawdzenia</p>
            <p className="text-sm">Organizatorzy muszą najpierw oddać szkic do sprawdzenia.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Wydarzenia do sprawdzenia ({pendingEvents.length})
        </h2>
      </div>

      <div className="grid gap-4">
        {pendingEvents.map((event) => (
          <Card key={event.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">{event.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{event.organizerName}</p>
                </div>
                <Badge variant="outline">Do sprawdzenia</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(event.date), 'd MMMM yyyy', { locale: pl })}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {event.city}
                  </span>
                  <Badge variant="secondary">{disciplineLabels[event.discipline]}</Badge>
                </div>

                <p className="line-clamp-2 text-sm">{htmlToPlainText(event.description)}</p>
                <div className="text-sm">
                  <strong>Dystanse:</strong> {event.distances.map((d) => d.name).join(', ')}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button onClick={() => approve(event)} className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Zatwierdź
                  </Button>
                  <Button variant="destructive" onClick={() => reject(event)} className="gap-2">
                    <XCircle className="h-4 w-4" />
                    Odeslij
                  </Button>
                  <Button variant="outline" size="default" asChild className="gap-2">
                    <a href={`/events/${event.slug}/preview`}>
                      <Eye className="h-4 w-4" />
                      Podgląd
                    </a>
                  </Button>
                  <Button variant="outline" size="default" asChild className="gap-2">
                    <a href={`/moderator/events/${event.id}/overview`}>
                      <FileText className="h-4 w-4" />
                      Zarządzaj
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
