import { disciplineLabels, getEvents } from '@/api';
import { QUERY_KEYS } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Calendar, MapPin, Settings, Eye, Plus } from 'lucide-react';
import type { Event } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const statusLabels: Record<Event['publicationStatus'], string> = {
  draft: 'Wersja robocza',
  submitted: 'Do sprawdzenia',
  rejected: 'Odrzucone',
  published: 'Aktywne',
  finished: 'Zakończone',
  cancelled: 'Odwołane',
  archived: 'Zarchiwizowane',
  deleted: 'Usunięte',
};

const statusColors: Record<Event['publicationStatus'], string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-warning/10 text-warning border-warning/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  published: 'bg-primary/10 text-primary border-primary/20',
  finished: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
  archived: 'bg-secondary text-secondary-foreground',
  deleted: 'bg-destructive/10 text-destructive border-destructive/20',
};

export const AdminEventsTab = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');
  const canSeeDeleted = user?.role === 'superadmin';
  const { data: eventsResponse, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.events, 'admin-events', canSeeDeleted],
    queryFn: () =>
      getEvents({
        includeUnpublished: true,
        includePrivate: true,
        includeDeleted: canSeeDeleted,
        pageSize: 100,
      }),
  });
  const events = eventsResponse?.data ?? [];

  const filteredEvents = events.filter((event) => {
    if (event.publicationStatus === 'deleted' && !canSeeDeleted) return false;
    const matchesSearch =
      event.name.toLowerCase().includes(search.toLowerCase()) ||
      event.city.toLowerCase().includes(search.toLowerCase()) ||
      event.organizerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.publicationStatus === statusFilter;
    const matchesDiscipline = disciplineFilter === 'all' || event.discipline === disciplineFilter;
    return matchesSearch && matchesStatus && matchesDiscipline;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Szukaj po nazwie, mieście lub organizatorze..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie statusy</SelectItem>
            <SelectItem value="draft">Wersja robocza</SelectItem>
            <SelectItem value="submitted">Do sprawdzenia</SelectItem>
            <SelectItem value="rejected">Odrzucone</SelectItem>
            <SelectItem value="published">Aktywne</SelectItem>
            <SelectItem value="finished">Zakończone</SelectItem>
            <SelectItem value="cancelled">Odwołane</SelectItem>
            <SelectItem value="archived">Zarchiwizowane</SelectItem>
            {canSeeDeleted && <SelectItem value="deleted">Usunięte</SelectItem>}
          </SelectContent>
        </Select>
        <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Dyscyplina" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            <SelectItem value="running">Bieganie</SelectItem>
            <SelectItem value="cycling">Kolarstwo</SelectItem>
            <SelectItem value="triathlon">Triathlon</SelectItem>
            <SelectItem value="multisport">Multisport</SelectItem>
          </SelectContent>
        </Select>
        <Button asChild>
          <Link to="/admin/events/new">
            <Plus className="mr-2 h-4 w-4" />
            Nowe wydarzenie
          </Link>
        </Button>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Ladowanie wydarzen...</div>}

      <div className="overflow-x-auto rounded-lg border border-border/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nazwa</TableHead>
              <TableHead>Dyscyplina</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Lokalizacja</TableHead>
              <TableHead>Organizator</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{disciplineLabels[event.discipline]}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {event.date}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {event.city}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {event.organizerName}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[event.publicationStatus]}>
                    {statusLabels[event.publicationStatus]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link
                        to={
                          event.publicationStatus === 'draft' ||
                          event.publicationStatus === 'submitted' ||
                          event.publicationStatus === 'rejected'
                            ? `/events/${event.slug}/preview`
                            : `/events/${event.slug}`
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/admin/events/${event.id}`}>
                        <Settings className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Znaleziono {filteredEvents.length} wydarzeń
      </div>
    </div>
  );
};
