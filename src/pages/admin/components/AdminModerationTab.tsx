import { approveEvent, disciplineLabels, mockEvents, rejectEvent } from '@/api';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Event } from '@/types';
import { CheckCircle, FileText, Eye, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const statusLabels: Record<Event['status'], string> = {
  draft: 'Szkic',
  awaiting_approval: 'Do sprawdzenia',
  approved: 'Zatwierdzone',
  active: 'Opublikowane',
  past: 'Przeszle',
  archived: 'Zarchiwizowane',
  deleted: 'Usuniete',
};

export const AdminModerationTab = () => {
  const [events, setEvents] = useState(mockEvents);

  const pendingEvents = events.filter((event) => event.status === 'awaiting_approval');
  const approvedEvents = events.filter((event) => event.status === 'approved');

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
      toast.error(error instanceof Error ? error.message : 'Nie udalo sie odrzucic wydarzenia');
    }
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
              <Badge variant="outline">{statusLabels[event.status]}</Badge>
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
            {event.status === 'awaiting_approval' && (
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
          Admin lub moderator zatwierdza wydarzenie oddane do sprawdzenia. Publikuje je dopiero
          organizator.
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Do sprawdzenia ({pendingEvents.length})</TabsTrigger>
          <TabsTrigger value="approved">Zatwierdzone ({approvedEvents.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="space-y-4">
          {renderEvents(pendingEvents, 'Brak wydarzen do sprawdzenia')}
        </TabsContent>
        <TabsContent value="approved" className="space-y-4">
          {renderEvents(approvedEvents, 'Brak zatwierdzonych wydarzen oczekujacych na publikacje')}
        </TabsContent>
      </Tabs>
    </div>
  );
};
