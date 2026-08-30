import { approveEvent, disciplineLabels, getEvents, rejectEvent } from '@/api';
import { QUERY_KEYS } from '@/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Event } from '@/types';
import { CheckCircle, FileText, Eye, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const statusLabels: Record<Event['publicationStatus'], string> = {
  draft: 'Szkic',
  submitted: 'Do sprawdzenia',
  rejected: 'Odrzucone',
  published: 'Opublikowane',
  finished: 'Zakończone',
  cancelled: 'Odwołane',
};

export const AdminModerationTab = () => {
  const queryClient = useQueryClient();
  const { data: eventsResponse, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.events, 'admin-moderation'],
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
      toast.error(error instanceof Error ? error.message : 'Nie udalo sie zatwierdzic wydarzenia');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ event, reason }: { event: Event; reason: string }) =>
      rejectEvent(event.id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events });
      toast.success('Wydarzenie odeslane do poprawy.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Nie udalo sie odrzucic wydarzenia');
    },
  });

  const approve = (event: Event) => approveMutation.mutate(event);

  const reject = (event: Event) => {
    const reason = window.prompt('Podaj powod odeslania wydarzenia do poprawy:');
    if (!reason?.trim()) return;
    rejectMutation.mutate({ event, reason: reason.trim() });
  };

  const renderEvents = (items: Event[], emptyText: string) => {
    if (items.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-primary/50" />
            <h3 className="mb-2 text-lg font-medium">{emptyText}</h3>
          </CardContent>
        </Card>
      );
    }

    return items.map((event) => (
      <Card key={event.id}>
        <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{event.name}</h3>
              <Badge variant="outline">{statusLabels[event.publicationStatus]}</Badge>
              <Badge variant="secondary">{disciplineLabels[event.discipline]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {event.organizerName} · {event.date} · {event.city}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/events/${event.slug}/preview`}>
                <Eye className="mr-2 h-4 w-4" />
                Podglad
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`/admin/events/${event.id}`}>
                <FileText className="mr-2 h-4 w-4" />
                Zarzadzaj
              </a>
            </Button>
            {event.publicationStatus === 'submitted' && (
              <>
                <Button size="sm" onClick={() => approve(event)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Zatwierdz
                </Button>
                <Button variant="destructive" size="sm" onClick={() => reject(event)}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Odeslij
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Moderacja wydarzen</h2>
        <p className="text-muted-foreground">
          Admin lub moderator zatwierdza wydarzenie oddane do sprawdzenia. Zatwierdzenie publikuje
          je od razu.
        </p>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Ladowanie wydarzen...
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Do sprawdzenia ({pendingEvents.length})</h3>
        {renderEvents(pendingEvents, 'Brak wydarzen do sprawdzenia')}
      </div>
    </div>
  );
};
