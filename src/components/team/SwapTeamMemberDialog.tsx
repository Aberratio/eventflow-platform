import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCare, swapTeamMember, type SwapTeamMemberPayload } from '@/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import type { Registration } from '@/types';

const NEW_PERSON = '__new__';

interface SwapTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  registrationId: string;
  /** Name of the person being swapped out, shown in the description. */
  memberName: string;
  /**
   * Captain flow: also offer the Zawodnicy the caller may register (own profile + Opieka). The
   * organizer flow leaves it off — the organizer enters the new person's data.
   */
  offerCareCompetitors?: boolean;
  onSwapped?: (registration: Registration) => void;
}

/**
 * G-04 (spec 23 §2): swap the person on a relay member's Zapis. The price, the bib number and the
 * status stay with the Zapis; the start code is rotated by the server. Used by the captain (team
 * roster) and by the organizer (participants list).
 */
const SwapTeamMemberDialog = ({
  open,
  onOpenChange,
  teamId,
  registrationId,
  memberName,
  offerCareCompetitors = false,
  onSwapped,
}: SwapTeamMemberDialogProps) => {
  const queryClient = useQueryClient();
  const [choice, setChoice] = useState(NEW_PERSON);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'M' | 'K' | ''>('');
  const [email, setEmail] = useState('');

  const { data: care } = useQuery({
    queryKey: ['care'],
    queryFn: () => getCare(),
    enabled: open && offerCareCompetitors,
  });
  const known = care?.data
    ? [
        ...(care.data.myProfile
          ? [
              {
                competitorId: care.data.myProfile.id,
                label: `${care.data.myProfile.firstName} ${care.data.myProfile.lastName} (ja)`,
              },
            ]
          : []),
        ...care.data.myCompetitors.map((c) => ({
          competitorId: c.competitorId,
          label: `${c.firstName} ${c.lastName}`,
        })),
      ]
    : [];

  const usingNewPerson = choice === NEW_PERSON;
  const canSubmit = usingNewPerson ? firstName.trim() !== '' && lastName.trim() !== '' : true;

  const swap = useMutation({
    mutationFn: () => {
      const payload: SwapTeamMemberPayload = usingNewPerson
        ? {
            newPerson: {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              ...(birthDate ? { birthDate } : {}),
              ...(gender ? { gender } : {}),
              ...(email.trim() ? { email: email.trim() } : {}),
            },
          }
        : { competitorId: choice };
      return swapTeamMember(teamId, registrationId, payload);
    },
    onSuccess: (response) => {
      toast({
        title: 'Zawodnik wymieniony',
        description: 'Kod startowy został zmieniony; numer startowy i opłata zostają przy zapisie.',
      });
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      queryClient.invalidateQueries({ queryKey: ['event-registrations'] });
      onSwapped?.(response.data);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Nie udało się wymienić zawodnika',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Wymień zawodnika</DialogTitle>
          <DialogDescription>
            {memberName} zostanie zastąpiony(-a) nową osobą w składzie drużyny. Opłata i numer
            startowy zostają przy zapisie, a kod startowy zostanie wygenerowany od nowa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {known.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="swap-person">Kto wchodzi do składu</Label>
              <Select value={choice} onValueChange={setChoice}>
                <SelectTrigger id="swap-person">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NEW_PERSON}>Nowa osoba</SelectItem>
                  {known.map((k) => (
                    <SelectItem key={k.competitorId} value={k.competitorId}>
                      {k.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {usingNewPerson && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="swap-first-name">Imię</Label>
                <Input
                  id="swap-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={swap.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="swap-last-name">Nazwisko</Label>
                <Input
                  id="swap-last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={swap.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="swap-birth-date">Data urodzenia</Label>
                <Input
                  id="swap-birth-date"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  disabled={swap.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="swap-gender">Płeć</Label>
                <Select value={gender} onValueChange={(value) => setGender(value as 'M' | 'K')}>
                  <SelectTrigger id="swap-gender">
                    <SelectValue placeholder="Wybierz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="K">Kobieta</SelectItem>
                    <SelectItem value="M">Mężczyzna</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="swap-email">E-mail (opcjonalnie)</Label>
                <Input
                  id="swap-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={swap.isPending}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={swap.isPending}
          >
            Anuluj
          </Button>
          <Button
            type="button"
            onClick={() => swap.mutate()}
            disabled={!canSubmit || swap.isPending}
          >
            {swap.isPending ? 'Wymieniam…' : 'Wymień zawodnika'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SwapTeamMemberDialog;
