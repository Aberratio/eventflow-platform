import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { approveEvent, rejectEvent } from '@/api';
import { QUERY_KEYS } from '@/constants';
import { Button } from '@/components/ui/button';
import { CheckCircle, ShieldAlert, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Event } from '@/types';

interface ModerationReviewBarProps {
  event: Event;
}

const statusMessages: Partial<Record<Event['publicationStatus'], string>> = {
  draft:
    'Podgląd moderacyjny — wydarzenie jest szkicem i nie zostało jeszcze oddane do sprawdzenia.',
  submitted: 'Wydarzenie oczekuje na Twoją decyzję.',
  rejected: 'Wydarzenie zostało odrzucone i oczekuje na poprawki organizatora.',
};

/**
 * Yellow moderation-context bar shown to Moderator/Admin when
 * previewing a non-public-yet state (draft/submitted/rejected). Carries the
 * approve/reject actions when the event is submitted, otherwise is purely
 * informational.
 */
export const ModerationReviewBar = ({ event }: ModerationReviewBarProps) => {
  const queryClient = useQueryClient();
  const [rejectReasonPrompted, setRejectReasonPrompted] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['event-by-slug', event.slug] });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events });
  };

  const approveMutation = useMutation({
    mutationFn: () => approveEvent(event.id),
    onSuccess: () => {
      invalidate();
      toast.success('Wydarzenie zatwierdzone i opublikowane.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Nie udało się zatwierdzić wydarzenia');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectEvent(event.id, reason),
    onSuccess: () => {
      invalidate();
      toast.success('Wydarzenie odesłane do poprawy.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Nie udało się odesłać wydarzenia');
    },
    onSettled: () => setRejectReasonPrompted(false),
  });

  const handleReject = () => {
    setRejectReasonPrompted(true);
    const reason = window.prompt('Podaj powod odeslania wydarzenia do poprawy:');
    if (!reason?.trim()) {
      setRejectReasonPrompted(false);
      return;
    }
    rejectMutation.mutate(reason.trim());
  };

  const message = statusMessages[event.publicationStatus] ?? 'Podgląd moderacyjny.';
  const isSubmitted = event.publicationStatus === 'submitted';

  return (
    <div className="bg-warning text-warning-foreground">
      <div className="container flex flex-wrap items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
        {isSubmitted && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-warning-foreground/30 bg-background/20 text-xs hover:bg-background/40"
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
            >
              <CheckCircle className="mr-1 h-3 w-3" />
              Zatwierdź
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-warning-foreground/30 bg-background/20 text-xs hover:bg-background/40"
              onClick={handleReject}
              disabled={rejectMutation.isPending || rejectReasonPrompted}
            >
              <XCircle className="mr-1 h-3 w-3" />
              Odeślij
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
