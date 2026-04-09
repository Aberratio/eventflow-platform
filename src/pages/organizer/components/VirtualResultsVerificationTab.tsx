import { mockVirtualResultSubmissions } from '@/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Event, VirtualResultSubmission } from '@/types';
import {
  Check,
  X,
  ExternalLink,
  Clock,
  User,
  Calendar,
  Filter,
  CheckCheck,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface VirtualResultsVerificationTabProps {
  event: Event;
}

export const VirtualResultsVerificationTab = ({ event }: VirtualResultsVerificationTabProps) => {
  const { toast } = useToast();

  const [selectedDistance, setSelectedDistance] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Get submissions for this event
  const submissions = mockVirtualResultSubmissions.filter((s) => s.eventId === event.id);

  // Filter by distance and status
  const filteredSubmissions = submissions.filter((s) => {
    if (selectedDistance !== 'all' && s.distanceId !== selectedDistance) return false;
    if (selectedStatus !== 'all' && s.status !== selectedStatus) return false;
    return true;
  });

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const selectAll = () => {
    const pendingIds = filteredSubmissions.filter((s) => s.status === 'pending').map((s) => s.id);
    setSelectedIds((prev) => {
      const allSelected = pendingIds.every((id) => prev.includes(id));
      return allSelected
        ? prev.filter((id) => !pendingIds.includes(id))
        : [...new Set([...prev, ...pendingIds])];
    });
  };

  const handleApprove = (id: string) => {
    toast({
      title: 'Wynik zatwierdzony',
      description: 'Wynik został zatwierdzony i dodany do klasyfikacji.',
    });
    // In real app: update submission status to 'approved'
  };

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return;
    toast({
      title: 'Wyniki zatwierdzone',
      description: `Zatwierdzono ${selectedIds.length} wyników.`,
    });
    setSelectedIds([]);
  };

  const openRejectDialog = (id: string) => {
    setRejectingId(id);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Błąd',
        description: 'Podaj powód odrzucenia.',
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: 'Wynik odrzucony',
      description: 'Uczestnik otrzyma powiadomienie z powodem odrzucenia.',
    });
    setRejectDialogOpen(false);
    setRejectingId(null);
    setRejectionReason('');
  };

  const handleBulkReject = () => {
    if (selectedIds.length === 0) return;
    setRejectingId('bulk');
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const getStatusBadge = (status: VirtualResultSubmission['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">
            Oczekuje
          </Badge>
        );
      case 'approved':
        return <Badge variant="default">Zatwierdzony</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Odrzucony</Badge>;
    }
  };

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Weryfikacja wyników wirtualnych
              {pendingCount > 0 && <Badge variant="secondary">{pendingCount} oczekuje</Badge>}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedDistance} onValueChange={setSelectedDistance}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Dystans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  {event.distances.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  <SelectItem value="pending">Oczekujące</SelectItem>
                  <SelectItem value="approved">Zatwierdzone</SelectItem>
                  <SelectItem value="rejected">Odrzucone</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedIds.length > 0 && (
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Zaznaczono: {selectedIds.length}
                </span>
                <Button size="sm" onClick={handleBulkApprove}>
                  <CheckCheck className="mr-1 h-4 w-4" />
                  Zatwierdź
                </Button>
                <Button size="sm" variant="destructive" onClick={handleBulkReject}>
                  <XCircle className="mr-1 h-4 w-4" />
                  Odrzuć
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submissions list */}
      {filteredSubmissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Brak zgłoszeń do wyświetlenia</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {selectedStatus === 'pending' &&
            filteredSubmissions.some((s) => s.status === 'pending') && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={filteredSubmissions
                    .filter((s) => s.status === 'pending')
                    .every((s) => selectedIds.includes(s.id))}
                  onCheckedChange={selectAll}
                />
                <span className="text-sm text-muted-foreground">Zaznacz wszystkie oczekujące</span>
              </div>
            )}

          {filteredSubmissions.map((submission) => (
            <Card
              key={submission.id}
              className={submission.status === 'pending' ? 'border-primary/30' : ''}
            >
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  {submission.status === 'pending' && (
                    <Checkbox
                      checked={selectedIds.includes(submission.id)}
                      onCheckedChange={() => toggleSelection(submission.id)}
                      className="mt-1"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1 font-medium">
                        <User className="h-4 w-4" />
                        {submission.userName}
                      </span>
                      <Badge variant="outline">{submission.distanceName}</Badge>
                      {getStatusBadge(submission.status)}
                    </div>

                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono font-medium text-foreground">
                          {submission.submittedTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Zgłoszono:{' '}
                        {format(new Date(submission.submittedAt), 'd MMM yyyy, HH:mm', {
                          locale: pl,
                        })}
                      </div>
                    </div>

                    {submission.proofUrl && (
                      <a
                        href={submission.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Zobacz dowód
                      </a>
                    )}

                    {submission.notes && (
                      <p className="mt-2 text-sm italic text-muted-foreground">
                        "{submission.notes}"
                      </p>
                    )}

                    {submission.status === 'rejected' && submission.rejectionReason && (
                      <p className="mt-2 text-sm text-destructive">
                        Powód odrzucenia: {submission.rejectionReason}
                      </p>
                    )}
                  </div>

                  {submission.status === 'pending' && (
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" onClick={() => handleApprove(submission.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openRejectDialog(submission.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rejection dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Odrzuć wynik</DialogTitle>
            <DialogDescription>
              {rejectingId === 'bulk'
                ? `Podaj powód odrzucenia dla ${selectedIds.length} wyników.`
                : 'Podaj powód odrzucenia. Uczestnik otrzyma powiadomienie.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Powód odrzucenia *</Label>
              <Textarea
                placeholder="np. Brak czytelnego dowodu czasu, nieprawidłowy format..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Anuluj
              </Button>
              <Button variant="destructive" onClick={handleReject}>
                Odrzuć
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
