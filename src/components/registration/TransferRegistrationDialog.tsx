import { useEffect, useState } from 'react';
import { checkCompetitorDuplicates, transferRegistration } from '@/api';
import { ApiRequestError } from '@/api/errors';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import {
  buildTransferPayload,
  canSubmitTransfer,
  describeTransferOutcome,
  type TransferPersonForm,
} from '@/lib/registrationTransfer';
import type { Event, Registration } from '@/types';

interface TransferRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration: Registration;
  event: Event;
  /** Called with the Zapis after a successful transfer, so the caller can refresh its list. */
  onTransferred?: (registration: Registration) => void;
}

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string | null;
}

type Mode = 'existing' | 'new';

const EMPTY_PERSON: TransferPersonForm = {
  firstName: '',
  lastName: '',
  birthDate: '',
  gender: '',
  email: '',
};

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

/**
 * R-02 (zakres P2): „Przenieś zapis”. The organizer moves a Zapis to another person: either finds an
 * existing Zawodnik (exact name + date of birth, the same lookup as the duplicate warning) or enters a
 * new person's data. A second step spells out what happens — the start code is rotated, the form answers
 * are dropped, no money is settled between the two people — and only then sends it.
 */
export const TransferRegistrationDialog = ({
  open,
  onOpenChange,
  registration,
  event,
  onTransferred,
}: TransferRegistrationDialogProps) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>('existing');
  const [person, setPerson] = useState<TransferPersonForm>(EMPTY_PERSON);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [chosen, setChosen] = useState<Candidate | null>(null);
  const [searching, setSearching] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setMode('existing');
      setPerson(EMPTY_PERSON);
      setCandidates(null);
      setChosen(null);
      setConfirming(false);
      setError(null);
    }
  }, [open]);

  const set = (patch: Partial<TransferPersonForm>) => {
    setPerson((prev) => ({ ...prev, ...patch }));
    setCandidates(null);
    setChosen(null);
  };

  const existingId = mode === 'existing' ? (chosen?.id ?? null) : null;
  const ready = mode === 'existing' ? !!chosen : canSubmitTransfer(null, person);
  const targetName =
    mode === 'existing' && chosen
      ? `${chosen.firstName} ${chosen.lastName}`
      : `${person.firstName.trim()} ${person.lastName.trim()}`.trim();

  const handleSearch = async () => {
    setSearching(true);
    try {
      const res = await checkCompetitorDuplicates(
        person.firstName.trim(),
        person.lastName.trim(),
        person.birthDate || undefined,
      );
      setCandidates(res.data as unknown as Candidate[]);
      setChosen(null);
    } catch (error) {
      toast({
        title: 'Nie udało się wyszukać zawodnika',
        description:
          error instanceof ApiRequestError ? error.message : 'Spróbuj ponownie za chwilę.',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = async () => {
    setPending(true);
    setError(null);
    try {
      const res = await transferRegistration(
        registration.id,
        buildTransferPayload(existingId, person),
      );
      toast({
        title: 'Zapis przeniesiony',
        description: `${targetName}. ${describeTransferOutcome(res.data)}`,
      });
      onTransferred?.(res.data);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : 'Nie udało się przenieść zapisu. Spróbuj ponownie za chwilę.',
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (pending ? undefined : onOpenChange(next))}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Przenieś zapis</DialogTitle>
          <DialogDescription>
            {event.name} — {registration.distanceName}, obecnie{' '}
            {registration.userName || 'bez nazwy'}
          </DialogDescription>
        </DialogHeader>

        {!confirming ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transfer-mode">Kto przejmuje zapis</Label>
              <select
                id="transfer-mode"
                className={selectClass}
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value as Mode);
                  setCandidates(null);
                  setChosen(null);
                }}
              >
                <option value="existing">Istniejący zawodnik (wyszukaj)</option>
                <option value="new">Nowa osoba (wpisz dane)</option>
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="transfer-first-name">Imię</Label>
                <Input
                  id="transfer-first-name"
                  value={person.firstName}
                  onChange={(e) => set({ firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer-last-name">Nazwisko</Label>
                <Input
                  id="transfer-last-name"
                  value={person.lastName}
                  onChange={(e) => set({ lastName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer-birth-date">Data urodzenia</Label>
                <Input
                  id="transfer-birth-date"
                  type="date"
                  value={person.birthDate}
                  onChange={(e) => set({ birthDate: e.target.value })}
                />
              </div>
              {mode === 'new' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="transfer-gender">Płeć</Label>
                    <select
                      id="transfer-gender"
                      className={selectClass}
                      value={person.gender}
                      onChange={(e) => set({ gender: e.target.value as 'M' | 'K' | '' })}
                    >
                      <option value="">Wybierz</option>
                      <option value="K">Kobieta</option>
                      <option value="M">Mężczyzna</option>
                    </select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="transfer-email">E-mail (opcjonalnie)</Label>
                    <Input
                      id="transfer-email"
                      type="email"
                      value={person.email}
                      onChange={(e) => set({ email: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>

            {mode === 'existing' && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Wpisz imię, nazwisko i datę urodzenia dokładnie tak, jak w profilu zawodnika.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSearch}
                  disabled={
                    searching || person.firstName.trim() === '' || person.lastName.trim() === ''
                  }
                >
                  {searching ? 'Szukam…' : 'Szukaj zawodnika'}
                </Button>
                {candidates !== null && candidates.length === 0 && (
                  <p role="status" className="text-sm text-muted-foreground">
                    Nie znaleziono takiego zawodnika. Wybierz „Nowa osoba”, żeby wpisać jego dane.
                  </p>
                )}
                {candidates !== null && candidates.length > 0 && (
                  <div role="radiogroup" aria-label="Znalezieni zawodnicy" className="space-y-1">
                    {candidates.map((c) => (
                      <label
                        key={c.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm"
                      >
                        <input
                          type="radio"
                          name="transfer-candidate"
                          checked={chosen?.id === c.id}
                          onChange={() => setChosen(c)}
                        />
                        <span>
                          {c.firstName} {c.lastName}
                          {c.birthDate ? ` (ur. ${c.birthDate.slice(0, 10)})` : ''}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 rounded-md border p-3 text-sm" aria-live="polite">
            <p>
              Zapis zostanie przeniesiony z <strong>{registration.userName}</strong> na{' '}
              <strong>{targetName}</strong>.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                Kod startowy zostanie wygenerowany od nowa — dotychczasowy przestanie obowiązywać, a
                obie osoby dostaną wiadomość e-mail.
              </li>
              <li>
                Dystans, numer startowy i opłata zostają przy zapisie. Ubezpieczenie NNW jest
                imienne, więc zostanie przeliczone dla nowej osoby.
              </li>
              <li>Odpowiedzi z formularza zapisu zostaną usunięte — nowa osoba wypełni je sama.</li>
              <li>
                Nie ma rozliczenia między osobami: żadna płatność ani zwrot nie zostaną utworzone
                automatycznie. Ewentualną różnicę w opłacie rozlicz ręcznie.
              </li>
            </ul>
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter>
          {!confirming ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Wróć
              </Button>
              <Button onClick={() => setConfirming(true)} disabled={!ready}>
                Dalej
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setConfirming(false)} disabled={pending}>
                Wróć
              </Button>
              <Button onClick={handleConfirm} disabled={pending}>
                {pending ? 'Przenoszę…' : 'Przenieś zapis'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
