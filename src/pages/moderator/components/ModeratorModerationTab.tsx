import { disciplineLabels, mockEvents, updateEventStatus } from '@/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Archive, Calendar, CheckCircle, Eye, FileText, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export const ModeratorModerationTab = () => {
  const [events, setEvents] = useState(mockEvents);
  const draftEvents = events.filter((event) => event.status === 'draft');

  const setStatus = async (event: Event, status: Event['status']) => {
    try {
      await updateEventStatus(event.id, status);
      setEvents((prev) => prev.map((item) => (item.id === event.id ? { ...item, status } : item)));
      toast.success(`Status wydarzenia "${event.name}" został zmieniony`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nie udało się zmienić statusu');
    }
  };

  if (draftEvents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-primary/50" />
            <p className="text-lg font-medium">Brak szkiców do przejrzenia</p>
            <p className="text-sm">Nowa logika nie wymaga kolejki akceptacji wydarzeń.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Szkice organizatorów ({draftEvents.length})</h2>
      </div>

      <div className="grid gap-4">
        {draftEvents.map((event) => (
          <Card key={event.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">{event.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{event.organizerName}</p>
                </div>
                <Badge variant="outline">Szkic</Badge>
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

                <p className="line-clamp-2 text-sm">{event.description}</p>
                <div className="text-sm">
                  <strong>Dystanse:</strong> {event.distances.map((d) => d.name).join(', ')}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button onClick={() => setStatus(event, 'active')} className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Ustaw aktywne
                  </Button>
                  <Button variant="outline" onClick={() => setStatus(event, 'archived')} className="gap-2">
                    <Archive className="h-4 w-4" />
                    Archiwizuj
                  </Button>
                  <Button variant="outline" size="default" asChild className="gap-2">
                    <a href={`/events/${event.slug}/preview`}>
                      <Eye className="h-4 w-4" />
                      Podgląd
                    </a>
                  </Button>
                  <Button variant="outline" size="default" asChild className="gap-2">
                    <a href={`/moderator/events/${event.id}`}>
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
