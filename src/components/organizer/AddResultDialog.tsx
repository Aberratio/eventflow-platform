import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Registration } from '@/types';

interface AddResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registrations: Registration[];
  onAddResult: (result: {
    bibNumber: string;
    time: string;
    netTime?: string;
    status: 'finished' | 'dnf' | 'dns' | 'dsq';
    userName?: string;
    category?: string;
  }) => void;
}

export const AddResultDialog = ({
  open,
  onOpenChange,
  registrations,
  onAddResult,
}: AddResultDialogProps) => {
  const [bibNumber, setBibNumber] = useState('');
  const [time, setTime] = useState('');
  const [netTime, setNetTime] = useState('');
  const [status, setStatus] = useState<'finished' | 'dnf' | 'dns' | 'dsq'>('finished');

  const handleSubmit = () => {
    if (!bibNumber) {
      toast.error('Błąd', { description: 'Podaj numer startowy' });
      return;
    }

    if (status === 'finished' && !time) {
      toast.error('Błąd', { description: 'Podaj czas dla ukończonego biegu' });
      return;
    }

    // Validate time format
    if (time && !/^\d{1,2}:\d{2}:\d{2}$/.test(time)) {
      toast.error('Błąd', { description: 'Nieprawidłowy format czasu (użyj HH:MM:SS)' });
      return;
    }

    if (netTime && !/^\d{1,2}:\d{2}:\d{2}$/.test(netTime)) {
      toast.error('Błąd', { description: 'Nieprawidłowy format czasu netto (użyj HH:MM:SS)' });
      return;
    }

    // Find registration to get user details
    const registration = registrations.find((r) => r.bibNumber === bibNumber);

    onAddResult({
      bibNumber,
      time: status === 'finished' || status === 'dnf' ? time : '-',
      netTime: status === 'finished' && netTime ? netTime : undefined,
      status,
      userName: registration?.userName,
      category: registration?.category,
    });

    // Reset form
    setBibNumber('');
    setTime('');
    setNetTime('');
    setStatus('finished');
    onOpenChange(false);

    toast.success('Wynik dodany', { description: `Dodano wynik dla numeru ${bibNumber}` });
  };

  // Filter registrations for autocomplete suggestions
  const matchingRegistrations = registrations.filter(
    (r) => r.bibNumber?.includes(bibNumber) && r.status === 'confirmed',
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dodaj wynik</DialogTitle>
          <DialogDescription>Wprowadź dane uczestnika i jego wynik</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Bib Number */}
          <div className="space-y-2">
            <Label>Numer startowy</Label>
            <Input
              placeholder="np. 101"
              value={bibNumber}
              onChange={(e) => setBibNumber(e.target.value)}
            />
            {bibNumber && matchingRegistrations.length > 0 && matchingRegistrations.length <= 5 && (
              <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                {matchingRegistrations.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="block w-full rounded px-2 py-1 text-left transition-colors hover:bg-muted"
                    onClick={() => setBibNumber(r.bibNumber || '')}
                  >
                    <span className="font-mono font-medium">{r.bibNumber}</span>
                    <span className="ml-2">{r.userName}</span>
                    <span className="ml-2 text-muted-foreground">({r.category})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v: 'finished' | 'dnf' | 'dns' | 'dsq') => setStatus(v)}
            >
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

          {/* Time (finished, or DNF with a partial time to the point of dropping out) */}
          {(status === 'finished' || status === 'dnf') && (
            <div className="space-y-2">
              <Label>Czas brutto (HH:MM:SS){status === 'dnf' && ' - opcjonalnie'}</Label>
              <Input
                placeholder="01:23:45"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">Format: godziny:minuty:sekundy</p>
            </div>
          )}

          {/* Net time (optional - not every timing setup has a start mat) */}
          {status === 'finished' && (
            <div className="space-y-2">
              <Label>Czas netto (HH:MM:SS) - opcjonalnie</Label>
              <Input
                placeholder="01:23:45"
                value={netTime}
                onChange={(e) => setNetTime(e.target.value)}
                className="font-mono"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button onClick={handleSubmit}>Dodaj wynik</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
