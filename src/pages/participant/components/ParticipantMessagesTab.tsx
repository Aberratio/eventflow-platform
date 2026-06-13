import { getEvents } from '@/api';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Message } from '@/types';
import { Mail, MailOpen, Calendar, ChevronDown, ChevronUp, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface ParticipantMessagesTabProps {
  messages: Message[];
  onMarkAsRead?: (messageId: string) => void;
}

const ParticipantMessagesTab = ({ messages, onMarkAsRead }: ParticipantMessagesTabProps) => {
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const { data: eventsResponse } = useQuery({
    queryKey: ['events', 'participant-messages'],
    queryFn: () => getEvents({ includeUnpublished: true, includePrivate: true, pageSize: 1000 }),
  });
  const events = eventsResponse?.data ?? [];

  // Group messages by event
  const groupedMessages = messages.reduce(
    (acc, message) => {
      const eventId = message.eventId || 'general';
      if (!acc[eventId]) {
        acc[eventId] = [];
      }
      acc[eventId].push(message);
      return acc;
    },
    {} as Record<string, Message[]>,
  );

  // Sort messages within groups by date (newest first)
  Object.values(groupedMessages).forEach((group) => {
    group.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  });

  const toggleExpand = (messageId: string, read: boolean) => {
    setExpandedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
        if (!read && onMarkAsRead) {
          onMarkAsRead(messageId);
        }
      }
      return next;
    });
  };

  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Inbox className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="mb-2 font-semibold">Brak wiadomości</h3>
          <p className="text-muted-foreground">Tu pojawią się wiadomości od organizatorów</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedMessages).map(([eventId, eventMessages]) => {
        const event = eventId !== 'general' ? events.find((e) => e.id === eventId) : null;
        const unreadCount = eventMessages.filter((m) => !m.read).length;

        return (
          <div key={eventId}>
            {/* Event Header */}
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {event ? event.name : 'Ogólne'}
              </h3>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount} nowe
                </Badge>
              )}
            </div>

            {/* Messages */}
            <div className="space-y-2">
              {eventMessages.map((message) => {
                const isExpanded = expandedMessages.has(message.id);

                return (
                  <Card
                    key={message.id}
                    className={`transition-colors ${!message.read ? 'border-primary/50 bg-primary/5' : ''}`}
                  >
                    <CardContent className="p-0">
                      <button
                        className="w-full p-4 text-left"
                        onClick={() => toggleExpand(message.id, message.read)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div
                            className={`shrink-0 rounded-full p-2 ${!message.read ? 'bg-primary/10' : 'bg-muted'}`}
                          >
                            {message.read ? (
                              <MailOpen className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Mail className="h-4 w-4 text-primary" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4
                                  className={`truncate font-medium ${!message.read ? 'text-foreground' : 'text-muted-foreground'}`}
                                >
                                  {message.subject}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  Od: {message.fromName}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(message.sentAt), 'd MMM', { locale: pl })}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && (
                              <div className="mt-3 border-t pt-3">
                                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(message.sentAt), "d MMMM yyyy 'o' HH:mm", {
                                    locale: pl,
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ParticipantMessagesTab;
