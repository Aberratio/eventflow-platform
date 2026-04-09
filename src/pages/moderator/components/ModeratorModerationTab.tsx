import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { mockEvents } from '@/api/mock/events.mock';
import { disciplineLabels } from '@/api/mock/labels';
import { Event } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  Eye,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

export const ModeratorModerationTab = () => {
  const [events, setEvents] = useState(mockEvents);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const pendingEvents = events.filter((e) => e.status === 'awaiting_approval');

  const handleApprove = (event: Event) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? { ...e, status: 'published' as const } : e)),
    );
    toast.success(`Wydarzenie "${event.name}" zostało zatwierdzone`);
  };

  const handleReject = () => {
    if (!selectedEvent || !rejectionReason.trim()) {
      toast.error('Podaj powód odrzucenia');
      return;
    }

    setEvents((prev) =>
      prev.map((e) =>
        e.id === selectedEvent.id ? { ...e, status: 'rejected' as const, rejectionReason } : e,
      ),
    );
    toast.success(`Wydarzenie "${selectedEvent.name}" zostało odrzucone`);
    setRejectDialogOpen(false);
    setSelectedEvent(null);
    setRejectionReason('');
  };

  const openRejectDialog = (event: Event) => {
    setSelectedEvent(event);
    setRejectDialogOpen(true);
  };

  if (pendingEvents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-primary/50" />
            <p className="text-lg font-medium">Brak wydarzeń do moderacji</p>
            <p className="text-sm">Wszystkie wydarzenia zostały przejrzane</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Wydarzenia oczekujące na akceptację ({pendingEvents.length})
        </h2>
      </div>

      <div className="grid gap-4">
        {pendingEvents.map((event) => (
          <Card key={event.id} className="border-warning/50">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">{event.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{event.organizerName}</p>
                </div>
                <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">
                  <Clock className="mr-1 h-3 w-3" />
                  Oczekuje
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(event.date), 'd MMMM yyyy', { locale: pl })}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {event.city}
                  </span>
                  <Badge variant="secondary">{disciplineLabels[event.discipline]}</Badge>
                </div>

                <p className="line-clamp-2 text-sm">{event.description}</p>

                <div className="text-sm">
                  <strong>Dystanse:</strong> {event.distances.map((d) => d.name).join(', ')}
                </div>

                {event.submittedAt && (
                  <p className="text-xs text-muted-foreground">
                    Zgłoszono:{' '}
                    {format(new Date(event.submittedAt), 'd MMM yyyy, HH:mm', { locale: pl })}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button onClick={() => handleApprove(event)} className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Zatwierdź
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => openRejectDialog(event)}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <XCircle className="h-4 w-4" />
                    Odrzuć
                  </Button>
                  <Button variant="outline" size="default" asChild className="gap-2">
                    <a href={`/events/${event.slug}`}>
                      <Eye className="h-4 w-4" />
                      Podgląd
                    </a>
                  </Button>
                  <Button variant="outline" size="default" asChild className="gap-2">
                    <a href={`/moderator/events/${event.id}`}>
                      <FileText className="h-4 w-4" />
                      Zarządzaj
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Odrzuć wydarzenie
            </DialogTitle>
            <DialogDescription>
              Podaj powód odrzucenia wydarzenia "{selectedEvent?.name}". Organizator otrzyma tę
              informację i będzie mógł poprawić zgłoszenie.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Textarea
              placeholder="Powód odrzucenia..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Anuluj
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>
              Odrzuć wydarzenie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
