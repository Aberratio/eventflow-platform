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
import { toast } from 'sonner';

type ResultStatus = 'finished' | 'dnf' | 'dns' | 'dsq';

export interface EditableResult {
  id: string;
  bibNumber: string;
  userName?: string;
  time: string;
  status: ResultStatus;
  netTime?: string | null;
  position?: number | null;
  categoryPosition?: number | null;
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
const PLACE_PATTERN = /^[1-9]\d*$/;

const placeText = (place?: number | null) => (place ? String(place) : '');

function toSeconds(time: string): number {
  const [h, m, s] = time.split(':').map(Number);
  return h * 3600 + m * 60 + s;
}

/** Correct a result's gross/net time, status and places, with the reason that lands in the correction trail. */
export const EditResultDialog = ({
  open,
  onOpenChange,
  result,
  isOfficial,
  onSaved,
}: EditResultDialogProps) => {
  const [time, setTime] = useState(result.time);
  const [netTime, setNetTime] = useState(result.netTime ?? '');
  const [position, setPosition] = useState(placeText(result.position));
  const [categoryPosition, setCategoryPosition] = useState(placeText(result.categoryPosition));
  const [status, setStatus] = useState<ResultStatus>(result.status);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTime(result.time);
      setNetTime(result.netTime ?? '');
      setPosition(placeText(result.position));
      setCategoryPosition(placeText(result.categoryPosition));
      setStatus(result.status);
      setReason('');
      setError(null);
    }
  }, [open, result]);

  const usesTime = status === 'finished' || status === 'dnf';
  const usesPlaces = status === 'finished';

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
    if (usesTime && netTime && !TIME_PATTERN.test(netTime)) {
      setError('Nieprawidłowy format czasu netto (użyj HH:MM:SS).');
      return;
    }
    if (usesPlaces && position && !PLACE_PATTERN.test(position)) {
      setError('Miejsce musi być dodatnią liczbą całkowitą.');
      return;
    }
    if (usesPlaces && categoryPosition && !PLACE_PATTERN.test(categoryPosition)) {
      setError('Miejsce w kategorii musi być dodatnią liczbą całkowitą.');
      return;
    }
    setError(null);

    const payload: Parameters<typeof updateResult>[1] = { status };
    if (usesTime && TIME_PATTERN.test(time)) {
      payload.time = time;
      payload.timeInSeconds = toSeconds(time);
    }
    // Net time and places are sent only when changed; an emptied field sends null.
    if (usesTime && netTime !== (result.netTime ?? '')) {
      payload.netTime = netTime || null;
      payload.netTimeInSeconds = netTime ? toSeconds(netTime) : null;
    }
    if (usesPlaces && position !== placeText(result.position)) {
      payload.position = position ? Number(position) : null;
    }
    if (usesPlaces && categoryPosition !== placeText(result.categoryPosition)) {
      payload.categoryPosition = categoryPosition ? Number(categoryPosition) : null;
    }
    if (trimmedReason) payload.reason = trimmedReason;

    setSaving(true);
    try {
      await updateResult(result.id, payload);
      toast.success('Wynik skorygowany', {
        description: `Zapisano korektę dla numeru ${result.bibNumber}`,
      });
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error('Nie udało się zapisać korekty', {
        description: e instanceof Error ? e.message : 'Spróbuj ponownie.',
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

          {usesTime && (
            <div className="space-y-2">
              <Label htmlFor="edit-result-net-time">Czas netto</Label>
              <Input
                id="edit-result-net-time"
                placeholder="HH:MM:SS"
                value={netTime}
                onChange={(e) => setNetTime(e.target.value)}
                className="font-mono"
              />
            </div>
          )}

          {usesPlaces && (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-result-position">Miejsce (open)</Label>
                <Input
                  id="edit-result-position"
                  inputMode="numeric"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-result-category-position">Miejsce w kategorii</Label>
                <Input
                  id="edit-result-category-position"
                  inputMode="numeric"
                  value={categoryPosition}
                  onChange={(e) => setCategoryPosition(e.target.value)}
                />
              </div>
            </>
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
