import { useQuery } from '@tanstack/react-query';
import { Calendar, Building2, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getPlatformStats } from '@/api';
import type { PlatformStats } from '@/types';

/** Same six-value vocabulary as AdminEventsTab's own statusLabels — 'approved'
 * is a real ENUM value on the server (E1.1) but the application never rests
 * in it (approve() lands directly in 'published'), so it falls back to the
 * raw status string rather than needing its own label. */
const statusLabels: Partial<Record<string, string>> = {
  draft: 'Wersja robocza',
  submitted: 'Do sprawdzenia',
  rejected: 'Odrzucone',
  published: 'Aktywne',
  finished: 'Zakończone',
  cancelled: 'Odwołane',
};

/**
 * E8.3 (spec 21 Answer §6): the minimal, explicitly-closed platform-admin
 * cross-section — "liczba Wydarzeń wg statusu publikacyjnego, liczba
 * Organizatorów, liczba aktywnych pakietów". Nothing beyond these three
 * numbers; the spec is explicit that no more is required here.
 *
 * Reads from GET /admin/platform-stats (admin-only, not moderator) rather
 * than the paginated getEvents()/getUsers() calls AdminOverviewTab already
 * uses for its own approximate "Wydarzeń"/"Organizatorów" tiles — those are
 * capped at pageSize and drift once the platform has more than ~100 rows;
 * this card is the exact, aggregated source of truth for the same two
 * numbers plus the new package-credit figure.
 */
export const PlatformStatsCard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => getPlatformStats(),
    select: (r) => r.data,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">Ładowanie...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5 text-primary" />
          Zestawienia platformy
        </CardTitle>
        <CardDescription>
          Wydarzenia wg statusu publikacyjnego, Organizatorzy, aktywne pakiety
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <StatTile icon={Building2} label="Organizatorów" value={data.organizerCount} />
          <StatTile icon={Package} label="Aktywnych pakietów" value={data.activePackageCredits} />
        </div>

        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Wydarzenia wg statusu publikacyjnego
          </h3>
          <EventStatusList data={data} />
        </div>
      </CardContent>
    </Card>
  );
};

const StatTile = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) => (
  <div className="flex items-center gap-4 rounded-lg border p-4">
    <div className="rounded-full bg-primary/10 p-3 text-primary">
      <Icon className="h-6 w-6" aria-hidden="true" />
    </div>
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  </div>
);

const EventStatusList = ({ data }: { data: PlatformStats }) => {
  const items = data.eventsByStatus;
  const max = Math.max(1, ...items.map((i) => i.count));

  return (
    <>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.status} className="flex items-center gap-3 text-sm">
            <span className="w-36 shrink-0 truncate text-muted-foreground">
              {statusLabels[item.status] ?? item.status}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/40">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right font-medium">{item.count}</span>
          </div>
        ))}
      </div>
      {/* Accessible text alternative to the bars above — same data,
          screen-reader only (WCAG 2.1 AA: no information conveyed purely
          through an unlabeled visual bar). */}
      <table className="sr-only">
        <caption>Liczba Wydarzeń wg statusu publikacyjnego</caption>
        <thead>
          <tr>
            <th scope="col">Status</th>
            <th scope="col">Liczba Wydarzeń</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.status}>
              <td>{statusLabels[item.status] ?? item.status}</td>
              <td>{item.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};
