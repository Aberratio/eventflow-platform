import { Link } from 'react-router-dom';
import { UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCoManagedEvents } from '@/hooks/useCoManagedEvents';

/**
 * R-01 (zakres P2, do potwierdzenia przez Zamawiającego): a participant who co-manages Events has
 * no organizer dashboard, so the participant panel links to the list of those Events.
 */
const CoManagedEventsNotice = () => {
  const { events } = useCoManagedEvents();
  if (events.length === 0) return null;

  return (
    <Card className="mb-5 border-primary/20 bg-primary/5">
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <UsersRound className="h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm font-medium">
            Współzarządzasz wydarzeniami: {events.length}. Znajdziesz je na liście wydarzeń do
            zarządzania.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/organizer/events">Zarządzaj wydarzeniami</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default CoManagedEventsNotice;
