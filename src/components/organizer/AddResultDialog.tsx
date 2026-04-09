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
import { useToast } from '@/hooks/use-toast';
import { Registration } from '@/types';

interface AddResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registrations: Registration[];
  onAddResult: (result: {
    bibNumber: string;
    time: string;
    status: 'finished' | 'dnf' | 'dsq';
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
  const { toast } = useToast();
  const [bibNumber, setBibNumber] = useState('');
  const [time, setTime] = useState('');
  const [status, setStatus] = useState<'finished' | 'dnf' | 'dsq'>('finished');

  const handleSubmit = () => {
    if (!bibNumber) {
      toast({
        title: 'Błąd',
        description: 'Podaj numer startowy',
        variant: 'destructive',
      });
      return;
    }

    if (status === 'finished' && !time) {
      toast({
        title: 'Błąd',
        description: 'Podaj czas dla ukończonego biegu',
        variant: 'destructive',
      });
      return;
    }

    // Validate time format
    if (time && !/^\d{1,2}:\d{2}:\d{2}$/.test(time)) {
      toast({
        title: 'Błąd',
        description: 'Nieprawidłowy format czasu (użyj HH:MM:SS)',
        variant: 'destructive',
      });
      return;
    }

    // Find registration to get user details
    const registration = registrations.find((r) => r.bibNumber === bibNumber);

    onAddResult({
      bibNumber,
      time: status === 'finished' ? time : '-',
      status,
      userName: registration?.userName,
      category: registration?.category,
    });

    // Reset form
    setBibNumber('');
    setTime('');
    setStatus('finished');
    onOpenChange(false);

    toast({
      title: 'Wynik dodany',
      description: `Dodano wynik dla numeru ${bibNumber}`,
    });
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
            <Select value={status} onValueChange={(v: 'finished' | 'dnf' | 'dsq') => setStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="finished">Ukończył</SelectItem>
                <SelectItem value="dnf">DNF (nie ukończył)</SelectItem>
                <SelectItem value="dsq">DSQ (dyskwalifikacja)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time (only for finished) */}
          {status === 'finished' && (
            <div className="space-y-2">
              <Label>Czas (HH:MM:SS)</Label>
              <Input
                placeholder="01:23:45"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">Format: godziny:minuty:sekundy</p>
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
