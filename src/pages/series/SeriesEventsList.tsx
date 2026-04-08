import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin } from 'lucide-react';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import type { Event } from '@/types';

interface SeriesEventsListProps {
  events: Event[];
}

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
        <p className="text-muted-foreground text-center py-8">
          Brak wydarzeń w tej serii
        </p>
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <DisciplineIcon discipline={event.discipline} size="lg" />
                  <div>
                    <h3 className="font-semibold">{event.name}</h3>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(event.date).toLocaleDateString('pl-PL')}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {event.distances.map(d => (
                        <Badge key={d.id} variant="outline" className="text-xs">
                          {d.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Badge
                  variant={event.status === 'published' ? 'default' : event.status === 'completed' ? 'secondary' : 'outline'}
                >
                  {event.status === 'published' ? 'Otwarta rejestracja' : event.status === 'completed' ? 'Zakończone' : 'Wersja robocza'}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);
