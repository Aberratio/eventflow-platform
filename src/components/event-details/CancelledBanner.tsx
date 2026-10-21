import { CircleX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Event } from '@/types';

interface CancelledBannerProps {
  event: Event;
}

/**
 * Shown to ALL roles (guest included) when a published event has been
 * cancelled. Formal, terminal state — distinct styling from the
 * moderator-only ModerationReviewBar.
 */
export const CancelledBanner = ({ event }: CancelledBannerProps) => (
  <div className="container pt-4">
    <Alert variant="destructive">
      <CircleX className="h-4 w-4" />
      <AlertTitle>Wydarzenie odwołane</AlertTitle>
      <AlertDescription>
        Organizator odwołał to wydarzenie{event.date ? ` (planowane na ${event.date})` : ''}. Zapisy
        i płatności nie są już przetwarzane — sprawdź status zwrotu w swoim koncie uczestnika.
      </AlertDescription>
    </Alert>
  </div>
);
