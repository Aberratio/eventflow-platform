import { OnlineSession } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Monitor, Clock } from 'lucide-react';

interface OnlineStaffCardProps {
  session: OnlineSession;
}

const getActivityStatus = (
  lastActiveAt: string,
): { status: 'online' | 'away' | 'idle'; label: string } => {
  const diff = Date.now() - new Date(lastActiveAt).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 2) {
    return { status: 'online', label: 'Aktywny teraz' };
  } else if (minutes < 10) {
    return { status: 'away', label: `Aktywny ${minutes} min temu` };
  } else {
    return { status: 'idle', label: `Nieaktywny od ${minutes} min` };
  }
};

export const OnlineStaffCard = ({ session }: OnlineStaffCardProps) => {
  const activity = getActivityStatus(session.lastActiveAt);

  const statusColors = {
    online: 'bg-success',
    away: 'bg-warning',
    idle: 'bg-muted-foreground/50',
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <div className="relative">
        <Avatar>
          <AvatarFallback className="bg-primary/10 text-primary">
            {session.userName
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
        <div
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${statusColors[activity.status]}`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">{session.userName}</span>
          <Badge variant={session.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
            {session.role === 'admin' ? 'Admin' : 'Moderator'}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {session.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {session.location}
            </span>
          )}
          {session.browser && (
            <span className="flex items-center gap-1">
              <Monitor className="h-3 w-3" />
              {session.browser}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {activity.label}
        </div>
      </div>
    </div>
  );
};
