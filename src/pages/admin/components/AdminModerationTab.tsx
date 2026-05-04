import { disciplineLabels, mockEvents, updateEventStatus } from '@/api';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Event } from '@/types';
import { CheckCircle, FileText, Archive, EyeOff, Eye } from 'lucide-react';
import { toast } from 'sonner';

const statusLabels: Record<Event['status'], string> = {
  draft: 'Szkic',
  active: 'Aktywne',
  past: 'Przeszłe',
  archived: 'Zarchiwizowane',
  deleted: 'Usunięte',
};

export const AdminModerationTab = () => {
  const [events, setEvents] = useState(mockEvents);

  const draftEvents = events.filter((event) => event.status === 'draft');
  const activeEvents = events.filter((event) => event.status === 'active');

  const changeStatus = async (event: Event, status: Event['status']) => {
    try {
      await updateEventStatus(event.id, status);
      setEvents((prev) => prev.map((item) => (item.id === event.id ? { ...item, status } : item)));
      toast.success(`Status wydarzenia zmieniony na: ${statusLabels[status]}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nie udało się zmienić statusu');
    }
  };

  const renderEvents = (items: Event[]) => {
    if (items.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-primary/50" />
            <h3 className="mb-2 text-lg font-medium">Brak wydarzeń w tej sekcji</h3>
            <p className="text-muted-foreground">Nowa logika nie wymaga kolejki akceptacji.</p>
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
              <a href={event.status === 'draft' ? `/events/${event.slug}/preview` : `/events/${event.slug}`}>
                <Eye className="mr-2 h-4 w-4" />
                Podgląd
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`/admin/events/${event.id}`}>
                <FileText className="mr-2 h-4 w-4" />
                Zarządzaj
              </a>
            </Button>
            {event.status === 'draft' && (
              <Button size="sm" onClick={() => changeStatus(event, 'active')}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Ustaw aktywne
              </Button>
            )}
            {event.status === 'active' && (
              <Button variant="outline" size="sm" onClick={() => changeStatus(event, 'archived')}>
                <Archive className="mr-2 h-4 w-4" />
                Archiwizuj
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Statusy wydarzeń</h2>
        <p className="text-muted-foreground">
          Wydarzenia nie przechodzą już przez akceptację. Admin i moderator mogą ręcznie ustawiać
          statusy oraz limity organizatorów.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-muted p-3 text-muted-foreground">
                <EyeOff className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{draftEvents.length}</div>
                <div className="text-sm text-muted-foreground">Szkiców</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <Eye className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{activeEvents.length}</div>
                <div className="text-sm text-muted-foreground">Aktywnych</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="drafts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="drafts">Szkice ({draftEvents.length})</TabsTrigger>
          <TabsTrigger value="active">Aktywne ({activeEvents.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="drafts" className="space-y-4">
          {renderEvents(draftEvents)}
        </TabsContent>
        <TabsContent value="active" className="space-y-4">
          {renderEvents(activeEvents)}
        </TabsContent>
      </Tabs>
    </div>
  );
};
