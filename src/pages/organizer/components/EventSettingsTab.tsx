import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useToast } from '@/hooks/use-toast';
import { deleteEvent, publishEvent, submitEvent, updateEvent, updateEventStatus } from '@/api';
import type { Event } from '@/types';
import { appLogger } from '@/lib/logger';
import {
  AlertTriangle,
  Archive,
  Copy,
  Edit,
  Eye,
  Lock,
  RefreshCw,
  Send,
  Trash2,
} from 'lucide-react';
import { PrivacyChangeConfirmDialog } from './PrivacyChangeConfirmDialog';

interface EventSettingsTabProps {
  event: Event;
}

const statusLabels: Record<Event['status'], string> = {
  draft: 'Szkic',
  awaiting_approval: 'Do sprawdzenia',
  approved: 'Zatwierdzone',
  active: 'Opublikowane',
  past: 'Przeszle',
  archived: 'Zarchiwizowane',
  deleted: 'Usuniete',
};

export const EventSettingsTab = ({ event }: EventSettingsTabProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [isPrivate, setIsPrivate] = useState(event.isPrivate || false);
  const [accessCode, setAccessCode] = useState(event.accessCode || '');
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  const [pendingIsPrivate, setPendingIsPrivate] = useState<boolean | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPrivacySaving, setIsPrivacySaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const eventEndDate = (event.endDate || event.date).slice(0, 10);
  const hasEnded = eventEndDate < today;
  const hasRegistrations = event.distances.some((distance) => distance.registeredCount > 0);
  const canDeleteUpcoming =
    !['past', 'archived', 'deleted'].includes(event.status) &&
    event.date.slice(0, 10) >= today &&
    !hasRegistrations;
  const canArchive = event.status !== 'archived' && (event.status === 'past' || hasEnded);
  const canSubmitReview = event.status === 'draft';
  const canPublish = event.status === 'approved';

  const generateAccessCode = () => Math.random().toString(36).substring(2, 14);

  useEffect(() => {
    setIsPrivate(event.isPrivate || false);
    setAccessCode(event.accessCode || '');
  }, [event.accessCode, event.isPrivate]);

  const invalidateEventQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['event', event.id] }),
      queryClient.invalidateQueries({ queryKey: ['organizer-events', event.organizerId] }),
      queryClient.invalidateQueries({ queryKey: ['events'] }),
    ]);
  };

  const requestPrivacyChange = (checked: boolean) => {
    if (checked === isPrivate) return;
    setPendingIsPrivate(checked);
    setPrivacyDialogOpen(true);
  };

  const handlePrivacyChange = async () => {
    if (pendingIsPrivate === null) return;

    const nextAccessCode =
      pendingIsPrivate && !accessCode ? generateAccessCode() : accessCode || undefined;

    try {
      setIsPrivacySaving(true);
      const response = await updateEvent(event.id, {
        isPrivate: pendingIsPrivate,
        accessCode: nextAccessCode,
      });
      if (!response.success) {
        throw new Error(response.message || 'Nie udalo sie zmienic prywatnosci wydarzenia.');
      }
      setIsPrivate(pendingIsPrivate);
      setAccessCode(response.data.accessCode || nextAccessCode || '');
      appLogger.event(
        'event_privacy_change',
        pendingIsPrivate
          ? `Ustawiono wydarzenie "${event.name}" jako prywatne`
          : `Ustawiono wydarzenie "${event.name}" jako publiczne`,
        {
          targetType: 'event',
          targetId: event.id,
          targetName: event.name,
          metadata: { isPrivate: pendingIsPrivate },
        },
      );
      await invalidateEventQueries();
      toast({
        title: pendingIsPrivate ? 'Wydarzenie prywatne' : 'Wydarzenie publiczne',
        description: pendingIsPrivate
          ? 'Wydarzenie nie bedzie widoczne publicznie.'
          : 'Wydarzenie bedzie widoczne dla wszystkich.',
      });
      setPrivacyDialogOpen(false);
      setPendingIsPrivate(null);
    } catch (error) {
      toast({
        title: 'Nie udalo sie zmienic prywatnosci',
        description: error instanceof Error ? error.message : 'Sprobuj ponownie.',
        variant: 'destructive',
      });
    } finally {
      setIsPrivacySaving(false);
    }
  };

  const handleSubmitReview = async () => {
    try {
      setIsSubmittingReview(true);
      const response = await submitEvent(event.id);
      if (!response.success) {
        throw new Error(response.message || 'Nie udalo sie oddac wydarzenia do sprawdzenia.');
      }
      await invalidateEventQueries();
      toast({
        title: 'Wydarzenie oddane do sprawdzenia',
        description: 'Admin lub moderator musi je zatwierdzic przed publikacja.',
      });
    } catch (error) {
      toast({
        title: 'Nie udalo sie oddac wydarzenia do sprawdzenia',
        description: error instanceof Error ? error.message : 'Sprobuj ponownie.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      const response = await publishEvent(event.id);
      if (!response.success) {
        throw new Error(response.message || 'Nie udalo sie opublikowac wydarzenia.');
      }
      await invalidateEventQueries();
      toast({
        title: 'Wydarzenie opublikowane',
        description: 'Od teraz jest publicznie widoczne dla uczestnikow.',
      });
    } catch (error) {
      toast({
        title: 'Nie udalo sie opublikowac wydarzenia',
        description: error instanceof Error ? error.message : 'Wydarzenie musi byc zatwierdzone.',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleArchive = async () => {
    try {
      setIsArchiving(true);
      const response = await updateEventStatus(event.id, 'archived');
      if (!response.success) {
        throw new Error(response.message || 'Nie udalo sie zarchiwizowac wydarzenia.');
      }
      appLogger.event('status_change', `Zarchiwizowano wydarzenie "${event.name}"`, {
        targetType: 'event',
        targetId: event.id,
        targetName: event.name,
        metadata: { oldStatus: event.status, newStatus: 'archived' },
      });
      await invalidateEventQueries();
      toast({ title: 'Wydarzenie zarchiwizowane' });
      setArchiveDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Nie udalo sie zarchiwizowac wydarzenia',
        description:
          error instanceof Error
            ? error.message
            : 'Archiwizowac mozna tylko wydarzenia, ktore juz sie zakonczyly.',
        variant: 'destructive',
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await deleteEvent(event.id);
      if (!response.success) {
        throw new Error(response.message || 'Nie udalo sie usunac wydarzenia.');
      }
      appLogger.event('event_delete', `Oznaczono wydarzenie "${event.name}" jako usuniete`, {
        targetType: 'event',
        targetId: event.id,
        targetName: event.name,
      });
      await Promise.all([
        invalidateEventQueries(),
        queryClient.invalidateQueries({ queryKey: ['organizer-event-limit', event.organizerId] }),
      ]);
      toast({
        title: 'Wydarzenie usuniete',
        description: 'Wydarzenie zniknie z panelu organizatora i list publicznych.',
        variant: 'destructive',
      });
      setDeleteDialogOpen(false);
      navigate('/organizer');
    } catch (error) {
      toast({
        title: 'Nie udalo sie usunac wydarzenia',
        description:
          error instanceof Error
            ? error.message
            : 'Usunac mozna tylko nadchodzace wydarzenie bez zapisow.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: Event['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success">Opublikowane</Badge>;
      case 'draft':
        return <Badge variant="secondary">Szkic</Badge>;
      case 'awaiting_approval':
        return <Badge variant="outline">Do sprawdzenia</Badge>;
      case 'approved':
        return <Badge className="bg-primary/10 text-primary">Zatwierdzone</Badge>;
      case 'archived':
        return <Badge variant="outline">Zarchiwizowane</Badge>;
      case 'deleted':
        return <Badge variant="destructive">Usuniete</Badge>;
      default:
        return <Badge variant="outline">{statusLabels[status]}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edycja wydarzenia</CardTitle>
          <CardDescription>Zmien szczegoly wydarzenia, dystanse i kategorie</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate(`/organizer/events/${event.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" /> Edytuj wydarzenie
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status wydarzenia</CardTitle>
          <CardDescription>Aktualny status: {getStatusBadge(event.status)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Organizator nie zmienia statusow recznie. Po zatwierdzeniu przez admina lub moderatora
            moze opublikowac wydarzenie dla uczestnikow.
          </p>
          <div className="flex flex-wrap gap-2">
            {canSubmitReview && (
              <Button onClick={handleSubmitReview} disabled={isSubmittingReview}>
                <Send className="mr-2 h-4 w-4" />
                {isSubmittingReview ? 'Wysylanie...' : 'Oddaj do sprawdzenia'}
              </Button>
            )}
            {canPublish && (
              <Button onClick={handlePublish} disabled={isPublishing}>
                <Eye className="mr-2 h-4 w-4" />
                {isPublishing ? 'Publikowanie...' : 'Opublikuj'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {canArchive && (
        <Card>
          <CardHeader>
            <CardTitle>Archiwum</CardTitle>
            <CardDescription>
              Przeszle wydarzenie mozesz przeniesc do archiwum organizatora.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setArchiveDialogOpen(true)}>
              <Archive className="mr-2 h-4 w-4" /> Przenies do archiwum
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Prywatnosc
          </CardTitle>
          <CardDescription>
            Prywatne wydarzenie nie jest widoczne publicznie. Uczestnicy moga dolaczyc tylko przez
            specjalny link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="privacy-toggle" className="cursor-pointer">
              Wydarzenie prywatne
            </Label>
            <Switch
              id="privacy-toggle"
              checked={isPrivate}
              onCheckedChange={requestPrivacyChange}
              disabled={isPrivacySaving}
            />
          </div>
          {isPrivate && (
            <div className="space-y-3 border-t pt-2">
              <div className="space-y-2">
                <Label>Kod dostepu</Label>
                <div className="flex gap-2">
                  <Input value={accessCode} readOnly className="font-mono" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setAccessCode(generateAccessCode())}
                    title="Wygeneruj nowy kod"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Link do wydarzenia</Label>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/events/${event.slug}?access=${accessCode}`}
                    readOnly
                    className="text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const url = `${window.location.origin}/events/${event.slug}?access=${accessCode}`;
                      navigator.clipboard.writeText(url);
                      toast({ title: 'Skopiowano', description: 'Link skopiowany do schowka.' });
                    }}
                    title="Kopiuj link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {canDeleteUpcoming && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Usuniecie nadchodzacego wydarzenia
            </CardTitle>
            <CardDescription>
              Wydarzenie bez zapisow moze zostac usuniete przed terminem. Przeszle wydarzenia
              przenos do archiwum.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Usun wydarzenie
            </Button>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zarchiwizowac wydarzenie?</AlertDialogTitle>
            <AlertDialogDescription>
              Wydarzenie zostanie przeniesione do archiwum organizatora.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={isArchiving}>
              {isArchiving ? 'Archiwizowanie...' : 'Archiwizuj'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunac to wydarzenie?</AlertDialogTitle>
            <AlertDialogDescription>
              Wydarzenie zostanie oznaczone jako usuniete i zniknie z panelu organizatora oraz list
              publicznych.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Usuwanie...' : 'Usun wydarzenie'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {pendingIsPrivate !== null && (
        <PrivacyChangeConfirmDialog
          open={privacyDialogOpen}
          nextIsPrivate={pendingIsPrivate}
          isConfirming={isPrivacySaving}
          onOpenChange={(open) => {
            setPrivacyDialogOpen(open);
            if (!open && !isPrivacySaving) {
              setPendingIsPrivate(null);
            }
          }}
          onConfirm={handlePrivacyChange}
        />
      )}
    </div>
  );
};
