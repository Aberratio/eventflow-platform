import { Badge } from '@/components/ui/badge';
import { EventSeries } from '@/types';
import { seriesTypeIcons } from '@/data/mockData';
import { Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ListRow } from './ListRow';

interface SeriesListRowProps {
  series: EventSeries;
  eventsCount: number;
  totalParticipants: number;
}

const statusLabels: Record<string, string> = {
  active: 'Aktywna',
  completed: 'Zakończona',
  upcoming: 'Nadchodząca',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  completed: 'secondary',
  upcoming: 'outline',
};

export const SeriesListRow = ({ 
  series, 
  eventsCount, 
  totalParticipants 
}: SeriesListRowProps) => {
  const dateRange = series.startDate && series.endDate 
    ? `${format(new Date(series.startDate), 'MMM yyyy', { locale: pl })} - ${format(new Date(series.endDate), 'MMM yyyy', { locale: pl })}`
    : null;

  const subtitle = [dateRange, `${eventsCount} wydarzeń`].filter(Boolean).join(' • ');

  const badge = (
    <Badge variant={statusVariants[series.status]} className="text-xs">
      {statusLabels[series.status]}
    </Badge>
  );

  const meta = totalParticipants > 0 ? (
    <span className="flex items-center gap-1 text-sm text-muted-foreground">
      <Users className="h-3.5 w-3.5" />
      {totalParticipants.toLocaleString()}
    </span>
  ) : null;

  return (
    <ListRow
      icon={seriesTypeIcons[series.type]}
      title={series.name}
      subtitle={subtitle}
      badge={badge}
      meta={meta}
      href={`/series/${series.slug}`}
    />
  );
};
