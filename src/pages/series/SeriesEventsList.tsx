import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin } from 'lucide-react';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import type { Event } from '@/types';

interface SeriesEventsListProps {
  events: Event[];
}

const statusLabels: Record<Event['publicationStatus'], string> = {
  draft: 'Wersja robocza',
  submitted: 'Do sprawdzenia',
  rejected: 'Odrzucone',
  published: 'Otwarta rejestracja',
  finished: 'Zakończone',
  cancelled: 'Odwołane',
};

export const SeriesEventsList: React.FC<SeriesEventsListProps> = ({ events }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        Wydarzenia w serii ({events.length})
      </CardTitle>
    </CardHeader>
    <CardContent>
      {events.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">Brak wydarzeń w tej serii</p>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.slug}`}
              className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <DisciplineIcon discipline={event.discipline} size="lg" />
                  <div>
                    <h3 className="font-semibold">{event.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(event.date).toLocaleDateString('pl-PL')}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {event.distances.map((d) => (
                        <Badge key={d.id} variant="outline" className="text-xs">
                          {d.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Badge
                  variant={
                    event.publicationStatus === 'published'
                      ? 'default'
                      : event.publicationStatus === 'finished'
                        ? 'secondary'
                        : 'outline'
                  }
                >
                  {statusLabels[event.publicationStatus]}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);
