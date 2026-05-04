import { mockEvents, disciplineLabels } from '@/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Event } from '@/types';
import { Star, Search, GripVertical, Calendar, MapPin, Save } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

export const AdminFeaturedEventsTab = () => {
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [search, setSearch] = useState('');

  const publishedEvents = events.filter(
    (e) => !e.isPrivate && (e.status === 'active' || e.status === 'past' || e.status === 'archived'),
  );
  const featuredEvents = events.filter((e) => e.featured);

  const filteredEvents = publishedEvents.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.city.toLowerCase().includes(search.toLowerCase()) ||
      e.organizerName.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleFeatured = (eventId: string) => {
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, featured: !e.featured } : e)));
  };

  const handleSave = () => {
    toast.success('Polecane wydarzenia zostały zapisane');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Polecane wydarzenia</h2>
        <p className="text-muted-foreground">
          Wybierz wydarzenia sponsorowane wyświetlane na stronie głównej
        </p>
      </div>

      {/* Currently featured */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5 text-warning" />
            Aktualnie polecane ({featuredEvents.length})
          </CardTitle>
          <CardDescription>
            Te wydarzenia są wyświetlane w sekcji "Polecane" na stronie głównej
          </CardDescription>
        </CardHeader>
        <CardContent>
          {featuredEvents.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Brak polecanych wydarzeń. Wybierz wydarzenia z listy poniżej.
            </p>
          ) : (
            <div className="space-y-2">
              {featuredEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-warning/20 bg-warning/5 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-medium">{event.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(event.date), 'd MMM yyyy', { locale: pl })} • {event.city}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFeatured(event.id)}
                    className="shrink-0 text-destructive hover:text-destructive"
                  >
                    Usuń
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Wszystkie wydarzenia</CardTitle>
          <CardDescription>
            Zaznacz wydarzenia, które mają być polecane na stronie głównej
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Szukaj po nazwie, mieście lub organizatorze..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Polecane</TableHead>
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Dyscyplina</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Miasto</TableHead>
                  <TableHead>Organizator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id} className={event.featured ? 'bg-warning/5' : ''}>
                    <TableCell>
                      <Switch
                        checked={event.featured}
                        onCheckedChange={() => toggleFeatured(event.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {event.featured && (
                          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                        )}
                        {event.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{disciplineLabels[event.discipline]}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(event.date), 'd MMM yyyy', { locale: pl })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{event.city}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {event.organizerName}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Zapisz zmiany
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
