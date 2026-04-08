import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DiscountCodesEditor } from '@/pages/admin/components/DiscountCodesEditor';
import { mockEvents } from '@/api/mock/events.mock';
import { DiscountCode } from '@/types';
import { Tag } from 'lucide-react';

export const ModeratorDiscountCodesTab = () => {
  const publishedEvents = mockEvents.filter(e => e.status === 'published' || e.status === 'completed');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const selectedEvent = publishedEvents.find(e => e.id === selectedEventId);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    const event = publishedEvents.find(e => e.id === eventId);
    setDiscountCodes(event?.discountCodes || []);
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
                {publishedEvents.map(event => (
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
          onChange={setDiscountCodes}
        />
      )}
    </div>
  );
};
