import { useEffect, useState } from 'react';
import { updateResult } from '@/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type ResultStatus = 'finished' | 'dnf' | 'dns' | 'dsq';

export interface EditableResult {
  id: string;
  bibNumber: string;
  userName?: string;
  time: string;
  status: ResultStatus;
}

interface EditResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: EditableResult;
  /** The classification is already official - a correction then needs a stated reason. */
  isOfficial: boolean;
  onSaved: () => void;
}

const TIME_PATTERN = /^\d{1,2}:\d{2}:\d{2}$/;

function toSeconds(time: string): number {
  const [h, m, s] = time.split(':').map(Number);
  return h * 3600 + m * 60 + s;
}

/** G-03: correct a result's time/status, with the reason that lands in the correction trail. */
export const EditResultDialog = ({
  open,
  onOpenChange,
  result,
  isOfficial,
  onSaved,
}: EditResultDialogProps) => {
  const { toast } = useToast();
  const [time, setTime] = useState(result.time);
  const [status, setStatus] = useState<ResultStatus>(result.status);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTime(result.time);
      setStatus(result.status);
      setReason('');
      setError(null);
    }
  }, [open, result]);

  const usesTime = status === 'finished' || status === 'dnf';

  const handleSubmit = async () => {
    const trimmedReason = reason.trim();
    if (isOfficial && !trimmedReason) {
      setError('Podaj powód korekty - wyniki są już oficjalne.');
      return;
    }
    if (usesTime && time && time !== '-' && !TIME_PATTERN.test(time)) {
      setError('Nieprawidłowy format czasu (użyj HH:MM:SS).');
      return;
    }
    if (status === 'finished' && !TIME_PATTERN.test(time)) {
      setError('Podaj czas ukończenia (HH:MM:SS).');
      return;
    }
    setError(null);

    const payload: Parameters<typeof updateResult>[1] = { status };
    if (usesTime && TIME_PATTERN.test(time)) {
      payload.time = time;
      payload.timeInSeconds = toSeconds(time);
    }
    if (trimmedReason) payload.reason = trimmedReason;

    setSaving(true);
    try {
      await updateResult(result.id, payload);
      toast({
        title: 'Wynik skorygowany',
        description: `Zapisano korektę dla numeru ${result.bibNumber}`,
      });
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast({
        title: 'Nie udało się zapisać korekty',
        description: e instanceof Error ? e.message : 'Spróbuj ponownie.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Koryguj wynik</DialogTitle>
          <DialogDescription>
            {result.userName ? `${result.userName} - ` : ''}numer {result.bibNumber}. Każda korekta
            zostaje w historii.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v: ResultStatus) => setStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="finished">Ukończył</SelectItem>
                <SelectItem value="dnf">DNF (nie ukończył)</SelectItem>
                <SelectItem value="dns">DNS (nie wystartował)</SelectItem>
                <SelectItem value="dsq">DSQ (dyskwalifikacja)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {usesTime && (
            <div className="space-y-2">
              <Label htmlFor="edit-result-time">Czas</Label>
              <Input
                id="edit-result-time"
                placeholder="HH:MM:SS"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="font-mono"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-result-reason">
              Powód korekty{isOfficial ? '' : ' (opcjonalnie)'}
            </Label>
            <Textarea
              id="edit-result-reason"
              value={reason}
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
              placeholder="np. błędny odczyt maty"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            Zapisz korektę
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
