import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Globe, Target, Trophy } from 'lucide-react';
import type { Series } from '@/types';
import { seriesTypeLabels } from '@/api/mock/labels';

const seriesTypeColors: Record<string, string> = {
  virtual: 'bg-info/10 text-info border-info/20',
  local: 'bg-success/10 text-success border-success/20',
  championship: 'bg-warning/10 text-warning border-warning/20',
  cup: 'bg-muted text-muted-foreground border-muted-foreground/20',
};

const seriesTypeIcons: Record<string, React.ReactNode> = {
  virtual: <Globe className="h-4 w-4" />,
  local: <MapPin className="h-4 w-4" />,
  championship: <Trophy className="h-4 w-4" />,
  cup: <Target className="h-4 w-4" />,
};

interface SeriesHeroProps {
  series: Series;
}

export const SeriesHero: React.FC<SeriesHeroProps> = ({ series }) => (
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-4">
      <Badge
        variant="outline"
        className={`${seriesTypeColors[series.type]} flex items-center gap-1`}
      >
        {seriesTypeIcons[series.type]}
        {seriesTypeLabels[series.type]}
      </Badge>
      <Badge variant={series.status === 'active' ? 'default' : 'secondary'}>
        {series.status === 'active' ? 'Aktywna' : series.status === 'completed' ? 'Zakończona' : 'Nadchodząca'}
      </Badge>
    </div>

    <h1 className="text-3xl md:text-4xl font-bold mb-4">{series.name}</h1>

    <div className="flex flex-wrap gap-4 text-muted-foreground mb-4">
      <span className="flex items-center gap-1">
        <Users className="h-4 w-4" />
        {series.organizerName}
      </span>
      {series.startDate && series.endDate && (
        <span className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {new Date(series.startDate).toLocaleDateString('pl-PL')} -{' '}
          {new Date(series.endDate).toLocaleDateString('pl-PL')}
        </span>
      )}
    </div>

    <p className="text-lg text-muted-foreground max-w-3xl">{series.description}</p>
  </div>
);
