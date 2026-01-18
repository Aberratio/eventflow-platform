import { Badge } from '@/components/ui/badge';
import { Registration, Event } from '@/types';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import { Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ListRow } from './ListRow';

interface RegistrationListRowProps {
  registration: Registration;
  event: Event;
}

export const RegistrationListRow = ({ registration, event }: RegistrationListRowProps) => {
  const subtitle = `${format(new Date(event.date), 'd MMMM yyyy', { locale: pl })} • ${event.city}`;

  const badge = (
    <Badge 
      variant={registration.status === 'confirmed' ? 'default' : 'secondary'} 
      className="text-xs"
    >
      {registration.status === 'confirmed' ? 'Potwierdzony' : 'Oczekuje'}
    </Badge>
  );

  const meta = (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Badge variant="outline" className="text-xs">{registration.distanceName}</Badge>
      {registration.bibNumber && (
        <span className="flex items-center gap-1">
          <Ticket className="h-3.5 w-3.5" />
          <span className="font-mono font-medium text-foreground">#{registration.bibNumber}</span>
        </span>
      )}
    </div>
  );

  return (
    <ListRow
      icon={<DisciplineIcon discipline={event.discipline} />}
      title={event.name}
      subtitle={subtitle}
      badge={badge}
      meta={meta}
      href={`/events/${event.slug}`}
    />
  );
};
