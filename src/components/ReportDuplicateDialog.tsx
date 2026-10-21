import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { checkCompetitorDuplicates, reportCompetitorDuplicate } from '@/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Copy, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Props {
  competitorId: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
}

/**
 * R-08 (spec 22): opiekun / organizator zgłasza, że profil Zawodnika jest duplikatem innego.
 * Kandydaci pochodzą z GET /competitors/duplicates (to samo imię, nazwisko i data urodzenia);
 * zgłoszenie niczego nie scala - trafia do kolejki Moderatora/Admina.
 */
export const ReportDuplicateDialog = ({ competitorId, firstName, lastName, birthDate }: Props) => {
  const [open, setOpen] = useState(false);
  const [duplicateOfId, setDuplicateOfId] = useState('');
  const [note, setNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['competitors', 'duplicate-candidates', competitorId],
    queryFn: () => checkCompetitorDuplicates(firstName, lastName, birthDate),
    enabled: open,
  });
  const candidates = (data?.data ?? []).filter((c) => c.id !== competitorId);

  const mutation = useMutation({
    mutationFn: () => reportCompetitorDuplicate(competitorId, { duplicateOfId, note: note.trim() }),
    onSuccess: () => {
      toast({
        title: 'Zgłoszenie wysłane',
        description: 'Moderator zweryfikuje, czy profile są duplikatem.',
      });
      setOpen(false);
      setDuplicateOfId('');
      setNote('');
    },
    onError: () => toast({ title: 'Nie udało się wysłać zgłoszenia', variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Zgłoś duplikat profilu"
          aria-label={`Zgłoś duplikat profilu ${firstName} ${lastName}`}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Zgłoś duplikat: {firstName} {lastName}
          </DialogTitle>
          <DialogDescription>
            Wskaż drugi profil tej samej osoby. Zgłoszenie trafi do Moderatora, który zdecyduje o
            scaleniu.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nie znaleziono innych profili o tych samych danych.
          </p>
        ) : (
          <RadioGroup value={duplicateOfId} onValueChange={setDuplicateOfId}>
            {candidates.map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <RadioGroupItem value={c.id} id={`dup-${c.id}`} />
                <Label htmlFor={`dup-${c.id}`}>
                  {c.firstName} {c.lastName}
                  {c.birthDate ? ` (${c.birthDate})` : ''}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          placeholder="Uwagi dla Moderatora (opcjonalnie)"
        />
        <DialogFooter>
          <Button disabled={!duplicateOfId || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Wyślij zgłoszenie
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
