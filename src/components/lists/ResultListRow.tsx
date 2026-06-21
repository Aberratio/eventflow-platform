import { Badge } from '@/components/ui/badge';
import { Result, Event } from '@/types';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import { Clock, Medal, Download, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ListRow } from './ListRow';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface ResultListRowProps {
  result: Result;
  event?: Event;
  showEvent?: boolean;
  showDownload?: boolean;
  onDownloadCertificate?: () => void;
  isHighlighted?: boolean;
}

const getMedalIcon = (position: number) => {
  if (position <= 3) {
    return (
      <Medal
        className={`h-4 w-4 ${position === 1 ? 'text-warning' : position === 2 ? 'text-muted-foreground' : 'text-warning/70'}`}
      />
    );
  }
  return null;
};

export const ResultListRow = ({
  result,
  event,
  showEvent = true,
  showDownload = false,
  onDownloadCertificate,
  isHighlighted = false,
}: ResultListRowProps) => {
  const medal = getMedalIcon(result.categoryPosition);
  const finished = result.status === 'finished';

  const title = showEvent ? result.eventName : result.userName;

  const subtitle =
    showEvent && event
      ? `${format(new Date(event.date), 'd MMM yyyy', { locale: pl })} • ${result.distanceName}`
      : result.distanceName;

  const badge =
    finished ? (
      medal ? (
        <span className="flex items-center gap-1">
          {medal}
          <span className="text-xs font-medium">{result.categoryPosition}.</span>
        </span>
      ) : null
    ) : (
      <Badge variant="destructive" className="text-xs">
        {result.status === 'dnf' ? 'DNF' : 'DSQ'}
      </Badge>
    );

  const meta = (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1 font-mono text-sm font-bold sm:text-base">
        <Clock className="h-4 w-4 text-primary" />
        {result.time}
      </span>
      <span className="text-sm text-muted-foreground">
        OPEN: <strong>{finished ? result.position : '-'}</strong>
      </span>
      <span className="hidden text-sm text-muted-foreground sm:inline">
        {result.category}: <strong>{finished ? result.categoryPosition : '-'}</strong>
      </span>
    </div>
  );

  const action = showDownload ? (
    <div className="flex gap-1">
      {onDownloadCertificate && (
        <Button variant="ghost" size="icon" onClick={onDownloadCertificate}>
          <Download className="h-4 w-4" />
        </Button>
      )}
      <Button variant="ghost" size="icon" asChild>
        <Link to={`/results?event=${result.eventId}`}>
          <ExternalLink className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  ) : undefined;

  return (
    <ListRow
      icon={showEvent && event ? <DisciplineIcon discipline={event.discipline} /> : undefined}
      title={title}
      subtitle={subtitle}
      badge={badge}
      meta={meta}
      action={action}
      highlighted={isHighlighted}
    />
  );
};
