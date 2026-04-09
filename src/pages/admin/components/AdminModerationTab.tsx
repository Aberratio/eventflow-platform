import { mockEvents, mockGoogleCalendarSettings, disciplineLabels } from '@/api';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Event, GoogleCalendarSettings } from '@/types';
import { addEventToGoogleCalendar } from '@/lib/googleCalendarUtils';
import { CheckCircle, XCircle, Clock, AlertTriangle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { ModerationEventCard } from './ModerationEventCard';
import { appLogger } from '@/lib/logger';

export const AdminModerationTab = () => {
  const [events, setEvents] = useState(mockEvents);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [calendarSettings] = useState<GoogleCalendarSettings>(mockGoogleCalendarSettings);

  const pendingEvents = events.filter((e) => e.status === 'awaiting_approval');
  const rejectedEvents = events.filter((e) => e.status === 'draft' && e.rejectionReason);

  const handleApprove = async () => {
    if (!selectedEvent) return;
    setEvents((prev) =>
      prev.map((e) =>
        e.id === selectedEvent.id
          ? { ...e, status: 'published' as const, rejectionReason: undefined }
          : e,
      ),
    );
    if (calendarSettings.enabled && calendarSettings.connected) {
      const result = await addEventToGoogleCalendar(selectedEvent, calendarSettings.calendarId);
      if (result.success) toast.success('Wydarzenie dodane do Google Calendar');
      else
        toast.error('Nie udało się dodać wydarzenia do kalendarza', { description: result.error });
    }
    appLogger.moderation('event_approve', `Zatwierdzono wydarzenie «${selectedEvent.name}»`, {
      targetType: 'event', targetId: selectedEvent.id, targetName: selectedEvent.name,
    });
    toast.success('Wydarzenie zostało zatwierdzone', {
      description: `"${selectedEvent.name}" jest teraz widoczne publicznie.`,
    });
    setApproveOpen(false);
    setDetailsOpen(false);
    setSelectedEvent(null);
  };

  const handleReject = () => {
    if (!selectedEvent || !rejectionReason.trim()) return;
    setEvents((prev) =>
      prev.map((e) =>
        e.id === selectedEvent.id
          ? { ...e, status: 'draft' as const, rejectionReason: rejectionReason.trim() }
          : e,
      ),
    );
    appLogger.moderation('event_reject', `Odrzucono wydarzenie «${selectedEvent.name}»: ${rejectionReason.trim()}`, {
      targetType: 'event', targetId: selectedEvent.id, targetName: selectedEvent.name,
      metadata: { reason: rejectionReason.trim() },
    });
    toast.error('Wydarzenie zostało odrzucone', {
      description: 'Organizator otrzyma powiadomienie z powodem odrzucenia.',
    });
    setRejectOpen(false);
    setDetailsOpen(false);
    setRejectionReason('');
    setSelectedEvent(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Moderacja wydarzeń</h2>
        <p className="text-muted-foreground">
          Przegląd i zatwierdzanie nowych wydarzeń zgłoszonych przez organizatorów
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-warning/10 p-3 text-warning">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{pendingEvents.length}</div>
                <div className="text-sm text-muted-foreground">Oczekujących na akceptację</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-destructive/10 p-3 text-destructive">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{rejectedEvents.length}</div>
                <div className="text-sm text-muted-foreground">Odrzuconych (do poprawy)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Oczekujące ({pendingEvents.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Odrzucone ({rejectedEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="mx-auto mb-4 h-12 w-12 text-primary/50" />
                <h3 className="mb-2 text-lg font-medium">Brak wydarzeń do moderacji</h3>
                <p className="text-muted-foreground">Wszystkie zgłoszenia zostały rozpatrzone</p>
              </CardContent>
            </Card>
          ) : (
            pendingEvents.map((event) => (
              <ModerationEventCard
                key={event.id}
                event={event}
                onViewDetails={(e) => {
                  setSelectedEvent(e);
                  setDetailsOpen(true);
                }}
                onApprove={(e) => {
                  setSelectedEvent(e);
                  setApproveOpen(true);
                }}
                onReject={(e) => {
                  setSelectedEvent(e);
                  setRejectOpen(true);
                }}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-medium">Brak odrzuconych wydarzeń</h3>
                <p className="text-muted-foreground">Nie ma wydarzeń oczekujących na poprawki</p>
              </CardContent>
            </Card>
          ) : (
            rejectedEvents.map((event) => (
              <ModerationEventCard
                key={event.id}
                event={event}
                showRejection
                onViewDetails={(e) => {
                  setSelectedEvent(e);
                  setDetailsOpen(true);
                }}
                onApprove={(e) => {
                  setSelectedEvent(e);
                  setApproveOpen(true);
                }}
                onReject={(e) => {
                  setSelectedEvent(e);
                  setRejectOpen(true);
                }}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Event Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEvent.name}</DialogTitle>
                <DialogDescription>Szczegóły wydarzenia zgłoszonego do moderacji</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <img
                  src={selectedEvent.imageUrl}
                  alt={selectedEvent.name}
                  className="h-48 w-full rounded-lg object-cover"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Dyscyplina</Label>
                    <p className="font-medium">{disciplineLabels[selectedEvent.discipline]}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Data</Label>
                    <p className="font-medium">{selectedEvent.date}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Lokalizacja</Label>
                    <p className="font-medium">
                      {selectedEvent.location}, {selectedEvent.city}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Termin rejestracji</Label>
                    <p className="font-medium">{selectedEvent.registrationDeadline}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Organizator</Label>
                  <p className="font-medium">{selectedEvent.organizerName}</p>
                  {selectedEvent.organizerContact && (
                    <p className="text-sm text-muted-foreground">
                      {selectedEvent.organizerContact.email}
                      {selectedEvent.organizerContact.phone &&
                        ` • ${selectedEvent.organizerContact.phone}`}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Opis</Label>
                  <p className="mt-1 text-sm">{selectedEvent.description}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Dystanse</Label>
                  <div className="mt-2 space-y-2">
                    {selectedEvent.distances.map((distance) => (
                      <div
                        key={distance.id}
                        className="flex items-center justify-between rounded bg-muted/50 p-2"
                      >
                        <span className="font-medium">{distance.name}</span>
                        <div className="text-sm text-muted-foreground">
                          {distance.price} zł • Limit: {distance.limit || '∞'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Zamknij
                </Button>
                {selectedEvent.status === 'awaiting_approval' && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setDetailsOpen(false);
                        setRejectOpen(true);
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Odrzuć
                    </Button>
                    <Button
                      onClick={() => {
                        setDetailsOpen(false);
                        setApproveOpen(true);
                      }}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Zatwierdź
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation */}
      <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zatwierdź wydarzenie</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz zatwierdzić wydarzenie "{selectedEvent?.name}"? Będzie ono
              widoczne publicznie dla wszystkich użytkowników.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>Zatwierdź</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectOpen}
        onOpenChange={(open) => {
          setRejectOpen(open);
          if (!open) setRejectionReason('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Odrzuć wydarzenie</DialogTitle>
            <DialogDescription>
              Podaj powód odrzucenia. Organizator otrzyma to wyjaśnienie i będzie mógł poprawić
              zgłoszenie.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-3">
              <p className="font-medium">{selectedEvent?.name}</p>
              <p className="text-sm text-muted-foreground">{selectedEvent?.organizerName}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Powód odrzucenia *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Np. Prosimy o uzupełnienie regulaminu zawodów..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <p className="text-muted-foreground">
                Organizator otrzyma powiadomienie z powodem odrzucenia i będzie mógł poprawić
                zgłoszenie.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
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
