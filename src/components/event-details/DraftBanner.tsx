import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, Pencil } from 'lucide-react';
import { Event, User } from '@/types';
import { getEditUrl } from './index';

interface DraftBannerProps {
  event: Event;
  user: User | null;
  onApprove?: () => void;
  onReject?: () => void;
}

export const DraftBanner = ({ event, user }: DraftBannerProps) => {
  const messages: Partial<Record<Event['publicationStatus'], string>> = {
    draft: 'Podgląd - wydarzenie nie jest widoczne publicznie',
    submitted: 'Podgląd - wydarzenie oczekuje na sprawdzenie przez moderatora',
    rejected: 'Podgląd - wydarzenie zostało odrzucone przez moderatora',
    deleted: 'Podgląd - wydarzenie jest oznaczone jako usunięte',
  };

  const message = messages[event.publicationStatus];
  if (!message) return null;

  return (
    <div className="bg-warning text-warning-foreground">
      <div className="container flex flex-wrap items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Eye className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
        {event.publicationStatus !== 'deleted' && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 border-warning-foreground/30 bg-background/20 text-xs hover:bg-background/40"
            asChild
          >
            <Link to={getEditUrl(event, user)}>
              <Pencil className="mr-1 h-3 w-3" />
              Edytuj
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};
