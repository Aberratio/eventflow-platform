import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Event, Distance } from '@/types';
import { Clock, Link as LinkIcon, FileText, Send } from 'lucide-react';

interface VirtualResultsSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  registeredDistanceId?: string;
}

export const VirtualResultsSubmissionDialog = ({
  open,
  onOpenChange,
  event,
  registeredDistanceId,
}: VirtualResultsSubmissionDialogProps) => {
  const { toast } = useToast();

  const [selectedDistanceId, setSelectedDistanceId] = useState(registeredDistanceId || '');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedDistance = event.distances.find((d) => d.id === selectedDistanceId);

  const validateTime = () => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;

    if (h === 0 && m === 0 && s === 0) {
      return false;
    }
    if (m > 59 || s > 59) {
      return false;
    }
    return true;
  };

  const formatTime = () => {
    const h = (parseInt(hours) || 0).toString().padStart(2, '0');
    const m = (parseInt(minutes) || 0).toString().padStart(2, '0');
    const s = (parseInt(seconds) || 0).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const calculateTimeInSeconds = () => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;
    return h * 3600 + m * 60 + s;
  };

  const handleSubmit = async () => {
    if (!selectedDistanceId) {
      toast({
        title: 'Błąd',
        description: 'Wybierz dystans',
        variant: 'destructive',
      });
      return;
    }

    if (!validateTime()) {
      toast({
        title: 'Błąd',
        description: 'Wprowadź poprawny czas (minuty i sekundy max 59)',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: 'Wynik zgłoszony',
      description: `Twój czas ${formatTime()} został przesłany do weryfikacji przez organizatora.`,
    });

    setIsSubmitting(false);
    onOpenChange(false);

    // Reset form
    setHours('');
    setMinutes('');
    setSeconds('');
    setProofUrl('');
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Zgłoś wynik
          </DialogTitle>
          <DialogDescription>{event.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Distance selector */}
          <div className="space-y-2">
            <Label>Dystans *</Label>
            <Select value={selectedDistanceId} onValueChange={setSelectedDistanceId}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz dystans" />
              </SelectTrigger>
              <SelectContent>
                {event.distances.map((distance) => (
                  <SelectItem key={distance.id} value={distance.id}>
                    {distance.name}{distance.length != null ? ` (${distance.length} ${distance.unit})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time input */}
          <div className="space-y-2">
            <Label>Twój czas *</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  min="0"
                  max="99"
                  placeholder="GG"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="text-center"
                />
                <p className="mt-1 text-center text-xs text-muted-foreground">Godziny</p>
              </div>
              <span className="text-xl font-bold">:</span>
              <div className="flex-1">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="MM"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="text-center"
                />
                <p className="mt-1 text-center text-xs text-muted-foreground">Minuty</p>
              </div>
              <span className="text-xl font-bold">:</span>
              <div className="flex-1">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="SS"
                  value={seconds}
                  onChange={(e) => setSeconds(e.target.value)}
                  className="text-center"
                />
                <p className="mt-1 text-center text-xs text-muted-foreground">Sekundy</p>
              </div>
            </div>
          </div>

          {/* Proof URL */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Link do dowodu (opcjonalne)
            </Label>
            <Input
              placeholder="https://strava.com/activities/..."
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Link do Strava, Garmin Connect, zdjęcia zegarka itp.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notatka (opcjonalne)
            </Label>
            <Textarea
              placeholder="Np. Bieg w parku miejskim w Krakowie..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Submit button */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Wysyłanie...' : 'Zgłoś wynik'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
