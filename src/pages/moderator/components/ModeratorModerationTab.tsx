import { approveEvent, disciplineLabels, mockEvents, rejectEvent } from '@/api';
import { useState } from 'react';
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
  const [events, setEvents] = useState(mockEvents);
  const pendingEvents = events.filter((event) => event.status === 'awaiting_approval');

  const approve = async (event: Event) => {
    try {
      const response = await approveEvent(event.id);
      setEvents((prev) =>
        prev.map((item) => (item.id === event.id ? { ...item, ...response.data } : item)),
      );
      toast.success('Wydarzenie zatwierdzone. Organizator moze je teraz opublikowac.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nie udalo sie zatwierdzic wydarzenia');
    }
  };

  const reject = async (event: Event) => {
    const reason = window.prompt('Podaj powod odeslania wydarzenia do poprawy:');
    if (!reason?.trim()) return;
    try {
      const response = await rejectEvent(event.id, reason.trim());
      setEvents((prev) =>
        prev.map((item) => (item.id === event.id ? { ...item, ...response.data } : item)),
      );
      toast.success('Wydarzenie odeslane do poprawy.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nie udalo sie odeslac wydarzenia');
    }
  };

  if (pendingEvents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-primary/50" />
            <p className="text-lg font-medium">Brak wydarzen do sprawdzenia</p>
            <p className="text-sm">Organizatorzy musza najpierw oddac szkic do sprawdzenia.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Wydarzenia do sprawdzenia ({pendingEvents.length})</h2>
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
                    Zatwierdz
                  </Button>
                  <Button variant="destructive" onClick={() => reject(event)} className="gap-2">
                    <XCircle className="h-4 w-4" />
                    Odeslij
                  </Button>
                  <Button variant="outline" size="default" asChild className="gap-2">
                    <a href={`/events/${event.slug}/preview`}>
                      <Eye className="h-4 w-4" />
                      Podglad
                    </a>
                  </Button>
                  <Button variant="outline" size="default" asChild className="gap-2">
                    <a href={`/moderator/events/${event.id}`}>
                      <FileText className="h-4 w-4" />
                      Zarzadzaj
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
