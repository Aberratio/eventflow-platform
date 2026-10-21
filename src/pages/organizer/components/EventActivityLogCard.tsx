import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getEventActivityLogs } from '@/api';

interface EventActivityLogCardProps {
  eventId: string;
}

/**
 * Minimal owner-facing view of "activity on my event", fed by the new
 * GET /events/{id}/activity-logs endpoint. Server enforces that only the event's
 * organizer (or staff) can read it — this component doesn't add authorization,
 * it just renders what the server is willing to return.
 */
export const EventActivityLogCard = ({ eventId }: EventActivityLogCardProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['event-activity-logs', eventId],
    queryFn: () => getEventActivityLogs(eventId),
    select: (r) => r.data ?? [],
  });

  const logs = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          Aktywność na wydarzeniu
        </CardTitle>
        <CardDescription>Historia zmian wprowadzonych na tym wydarzeniu</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground">Ładowanie...</p>}

        {!isLoading && logs.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Brak zarejestrowanej aktywności dla tego wydarzenia.
          </p>
        )}

        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3 transition-colors hover:bg-muted/40"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{log.description}</span>
                {log.targetName && (
                  <Badge variant="secondary" className="text-xs">
                    {log.targetName}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(log.timestamp), 'dd.MM.yyyy, HH:mm', { locale: pl })}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
