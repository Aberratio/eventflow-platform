import { Trophy } from 'lucide-react';
import { ListRow } from './ListRow';

interface AthleteListRowProps {
  userId: string;
  name: string;
  racesCount: number;
  podiumCount: number;
}

export const AthleteListRow = ({ 
  userId, 
  name, 
  racesCount, 
  podiumCount 
}: AthleteListRowProps) => {
  const subtitle = `${racesCount} startów`;

  const meta = podiumCount > 0 ? (
    <span className="flex items-center gap-1 text-sm">
      <Trophy className="h-3.5 w-3.5 text-yellow-500" />
      <span className="text-muted-foreground">{podiumCount}</span>
    </span>
  ) : null;

  return (
    <ListRow
      title={name}
      subtitle={subtitle}
      meta={meta}
      href={`/athlete/${userId}`}
    />
  );
};
