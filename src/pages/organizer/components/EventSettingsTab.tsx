import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useToast } from '@/hooks/use-toast';
import { deleteEvent, updateEventStatus } from '@/api';
import type { Event } from '@/types';
import { appLogger } from '@/lib/logger';
import {
  Edit,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Lock,
  Copy,
  RefreshCw,
  Archive,
} from 'lucide-react';

interface EventSettingsTabProps {
  event: Event;
}

type EditableEventStatus = 'draft' | 'active' | 'past' | 'archived';

const statusLabels: Record<Event['status'], string> = {
  draft: 'Szkic',
  active: 'Aktywne',
  past: 'Przeszłe',
  archived: 'Zarchiwizowane',
  deleted: 'Usunięte',
};

const statusDescriptions: Record<EditableEventStatus, string> = {
  draft: 'Widoczne tylko w panelu organizatora.',
  active: 'Widoczne publicznie dla uczestników.',
  past: 'Wydarzenie po terminie, nadal widoczne publicznie.',
  archived: 'Ukryte z głównego panelu organizatora, widoczne publicznie.',
};

export const EventSettingsTab = ({ event }: EventSettingsTabProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<EditableEventStatus>('draft');
  const [isPrivate, setIsPrivate] = useState(event.isPrivate || false);
  const [accessCode, setAccessCode] = useState(event.accessCode || '');
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const generateAccessCode = () => Math.random().toString(36).substring(2, 14);

  const handleEdit = () => {
    navigate(`/organizer/events/${event.id}/edit`);
  };

  const handleStatusChange = (status: EditableEventStatus) => {
    setNewStatus(status);
    setStatusDialogOpen(true);
  };

  const invalidateEventQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['event', event.id] }),
      queryClient.invalidateQueries({ queryKey: ['organizer-events', event.organizerId] }),
      queryClient.invalidateQueries({ queryKey: ['events'] }),
    ]);
  };

  const confirmStatusChange = async () => {
    try {
      setIsSavingStatus(true);
      await updateEventStatus(event.id, newStatus);
      appLogger.event('status_change', `Zmieniono status wydarzenia "${event.name}" na ${statusLabels[newStatus]}`, {
        targetType: 'event',
        targetId: event.id,
        targetName: event.name,
        metadata: { oldStatus: event.status, newStatus },
      });
      await invalidateEventQueries();
      toast({
        title: 'Status zmieniony',
        description: `Wydarzenie jest teraz: ${statusLabels[newStatus]}`,
      });
      setStatusDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Nie udało się zmienić statusu',
        description: error instanceof Error ? error.message : 'Spróbuj ponownie później.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteEvent(event.id);
      appLogger.event('event_delete', `Oznaczono wydarzenie "${event.name}" jako usunięte`, {
        targetType: 'event',
        targetId: event.id,
        targetName: event.name,
      });
      await Promise.all([
        invalidateEventQueries(),
        queryClient.invalidateQueries({ queryKey: ['organizer-event-limit', event.organizerId] }),
      ]);
      toast({
        title: 'Wydarzenie usunięte',
        description: 'Wydarzenie oznaczono jako usunięte. Rekord pozostaje w bazie danych.',
        variant: 'destructive',
      });
      setDeleteDialogOpen(false);
      navigate('/organizer');
    } catch (error) {
      toast({
        title: 'Nie udało się usunąć wydarzenia',
        description:
          error instanceof Error
            ? error.message
            : 'Organizator nie może usuwać wydarzeń, które już się odbyły.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: Event['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success">Aktywne</Badge>;
      case 'draft':
        return <Badge variant="secondary">Szkic</Badge>;
      case 'past':
        return <Badge variant="outline">Przeszłe</Badge>;
      case 'archived':
        return <Badge variant="outline">Zarchiwizowane</Badge>;
      case 'deleted':
        return <Badge variant="destructive">Usunięte</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const statusCards: Array<{
    status: EditableEventStatus;
    title: string;
    icon: typeof Eye;
    iconClassName: string;
  }> = [
    { status: 'draft', title: 'Szkic', icon: EyeOff, iconClassName: 'text-muted-foreground' },
    { status: 'active', title: 'Aktywne', icon: Eye, iconClassName: 'text-success' },
    { status: 'past', title: 'Przeszłe', icon: CheckCircle, iconClassName: 'text-muted-foreground' },
    { status: 'archived', title: 'Archiwum', icon: Archive, iconClassName: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edycja wydarzenia</CardTitle>
          <CardDescription>Zmień szczegóły wydarzenia, dystanse i kategorie</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleEdit}>
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statusCards.map(({ status, title, icon: Icon, iconClassName }) => (
              <Card
                key={status}
                className={`cursor-pointer transition-colors hover:border-primary ${
                  event.status === status ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => handleStatusChange(status)}
              >
                <CardContent className="pt-6 text-center">
                  <Icon className={`mx-auto mb-2 h-8 w-8 ${iconClassName}`} />
                  <h4 className="font-medium">{title}</h4>
                  <p className="text-sm text-muted-foreground">{statusDescriptions[status]}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {event.status === 'active' && (
        <Card>
          <CardHeader>
            <CardTitle>Oznacz jako przeszłe</CardTitle>
            <CardDescription>
              Po wprowadzeniu wszystkich wyników możesz oznaczyć wydarzenie jako przeszłe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => handleStatusChange('past')}>
              <CheckCircle className="mr-2 h-4 w-4" /> Oznacz jako przeszłe
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Prywatność
          </CardTitle>
          <CardDescription>
            Prywatne wydarzenie nie jest widoczne publicznie. Uczestnicy mogą dołączyć tylko przez
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
              onCheckedChange={(checked) => {
                setIsPrivate(checked);
                if (checked && !accessCode) {
                  setAccessCode(generateAccessCode());
                }
                toast({
                  title: checked ? 'Wydarzenie prywatne' : 'Wydarzenie publiczne',
                  description: checked
                    ? 'Wydarzenie nie będzie widoczne publicznie.'
                    : 'Wydarzenie będzie widoczne dla wszystkich.',
                });
              }}
            />
          </div>
          {isPrivate && (
            <div className="space-y-3 border-t pt-2">
              <div className="space-y-2">
                <Label>Kod dostępu</Label>
                <div className="flex gap-2">
                  <Input value={accessCode} readOnly className="font-mono" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newCode = generateAccessCode();
                      setAccessCode(newCode);
                      toast({
                        title: 'Nowy kod',
                        description: 'Wygenerowano nowy kod dostępu. Stary kod przestaje działać.',
                      });
                    }}
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

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Strefa usuwania
          </CardTitle>
          <CardDescription>
            Usunięcie oznacza status `deleted`. Rekord pozostaje w bazie danych i nie liczy się do limitu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Usuń wydarzenie
          </Button>
        </CardContent>
      </Card>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zmień status wydarzenia</DialogTitle>
            <DialogDescription>
              Czy na pewno chcesz zmienić status wydarzenia na {statusLabels[newStatus]}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={confirmStatusChange} disabled={isSavingStatus}>
              {isSavingStatus ? 'Zapisywanie...' : 'Zmień status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć to wydarzenie?</AlertDialogTitle>
            <AlertDialogDescription>
              Wydarzenie zostanie oznaczone jako usunięte i zniknie z panelu organizatora oraz list
              publicznych. Dane pozostaną w bazie do wglądu administracji.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Usuwanie...' : 'Usuń wydarzenie'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
