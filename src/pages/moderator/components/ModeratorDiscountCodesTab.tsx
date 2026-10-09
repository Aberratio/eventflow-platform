import { getEvents } from '@/api';
import { adoptSavedDiscountCodes } from '@/api/eventChildren';
import type { PaginatedResponse } from '@/api/types';
import { useEventChildSaver } from '@/hooks/useEventChildSaver';
import { QUERY_KEYS } from '@/constants';
import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DiscountCodesEditor } from '@/pages/admin/components/DiscountCodesEditor';
import type { DiscountCode, Event } from '@/types';
import { Tag } from 'lucide-react';
import { toast } from 'sonner';

const LIST_QUERY_KEY = [...QUERY_KEYS.events, 'moderator-discount-codes'] as const;

export const ModeratorDiscountCodesTab = () => {
  const queryClient = useQueryClient();
  const { data: eventsResponse } = useQuery({
    queryKey: LIST_QUERY_KEY,
    queryFn: () => getEvents({ includeUnpublished: true, includePrivate: true, pageSize: 100 }),
  });
  const publishedEvents = (eventsResponse?.data ?? []).filter(
    (e) => e.publicationStatus === 'published' || e.publicationStatus === 'finished',
  );
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const selectedEvent = publishedEvents.find((e) => e.id === selectedEventId);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    const event = publishedEvents.find((e) => e.id === eventId);
    setDiscountCodes(event?.discountCodes || []);
  };

  const selectedEventIdRef = useRef('');
  selectedEventIdRef.current = selectedEventId;

  const saver = useEventChildSaver<DiscountCode>(selectedEventId || undefined, 'discountCodes', {
    onSaved: (saved: Event, idMap) => {
      // Adopt the server ids and counters, unless the moderator already switched events.
      if (selectedEventIdRef.current === saved.id) {
        setDiscountCodes((local) => adoptSavedDiscountCodes(local, saved.discountCodes, idMap));
      }
      // Seed the list cache so switching events and back does not restore stale temporary ids.
      queryClient.setQueryData<PaginatedResponse<Event>>(LIST_QUERY_KEY, (cached) =>
        cached
          ? { ...cached, data: cached.data.map((e) => (e.id === saved.id ? saved : e)) }
          : cached,
      );
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events });
      void queryClient.invalidateQueries({ queryKey: ['event', saved.id] });
      toast.success('Kody rabatowe zapisane');
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Nie udało się zapisać kodów'),
  });

  const handleDiscountCodesChange = (codes: DiscountCode[]) => {
    if (!selectedEvent) return;
    setDiscountCodes(codes);
    void saver.save(codes);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Kody rabatowe wydarzeń
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select value={selectedEventId} onValueChange={handleEventChange}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz wydarzenie..." />
              </SelectTrigger>
              <SelectContent>
                {publishedEvents.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name} — {event.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedEvent && (
        <DiscountCodesEditor
          discountCodes={discountCodes}
          distances={selectedEvent.distances}
          onChange={handleDiscountCodesChange}
        />
      )}
    </div>
  );
};
