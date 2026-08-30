import { getEvents, updateEvent } from '@/api';
import { QUERY_KEYS } from '@/constants';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DiscountCodesEditor } from '@/pages/admin/components/DiscountCodesEditor';
import { DiscountCode } from '@/types';
import { Tag } from 'lucide-react';
import { toast } from 'sonner';

export const ModeratorDiscountCodesTab = () => {
  const { data: eventsResponse } = useQuery({
    queryKey: [...QUERY_KEYS.events, 'moderator-discount-codes'],
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

  const handleDiscountCodesChange = (codes: DiscountCode[]) => {
    if (!selectedEvent) return;
    setDiscountCodes(codes);
    updateEvent(selectedEvent.id, { discountCodes: codes })
      .then(() => toast.success('Kody rabatowe zapisane'))
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : 'Nie udało się zapisać kodów'),
      );
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
