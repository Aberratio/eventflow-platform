import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Event, User } from '@/types';
import { getEditUrl } from './index';

interface DraftBannerProps {
  event: Event;
  user: User | null;
  onApprove?: () => void;
  onReject?: () => void;
}

export const DraftBanner = ({ event, user, onApprove, onReject }: DraftBannerProps) => {
  const isAdminOrMod =
    user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'moderator';

  const messages: Record<string, string> = {
    draft: 'Podgląd — wydarzenie nie jest widoczne publicznie',
    awaiting_approval: 'Podgląd — wydarzenie oczekuje na akceptację',
    approved: 'Podgląd — wydarzenie zatwierdzone, oczekuje na publikację',
    rejected: 'Podgląd — wydarzenie zostało odrzucone',
  };

  const message = messages[event.status];
  if (!message) return null;

  return (
    <div className="bg-warning text-warning-foreground">
      <div className="container flex flex-wrap items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Eye className="h-4 w-4 shrink-0" />
          <span>{message}</span>
          {event.status === 'rejected' && event.rejectionReason && (
            <span className="font-normal">— {event.rejectionReason}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAdminOrMod && event.status === 'awaiting_approval' && (
            <>
              {onApprove && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 border-warning-foreground/30 bg-background/20 text-xs hover:bg-background/40"
                  onClick={onApprove}
                >
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  Zatwierdź
                </Button>
              )}
              {onReject && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 border-warning-foreground/30 bg-background/20 text-xs hover:bg-background/40"
                  onClick={onReject}
                >
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Odrzuć
                </Button>
              )}
            </>
          )}
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
        </div>
      </div>
    </div>
  );
};
