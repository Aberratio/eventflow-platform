import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { ChangePasswordCard } from '@/components/profile/ChangePasswordCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateInput } from '@/components/ui/date-time-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SosContact } from '@/types';

const ParticipantProfileTab = () => {
  const { user, updateCurrentUser } = useAuth();

  const [participantData, setParticipantData] = useState({
    birthDate: user?.birthDate || '',
    birthYear: user?.birthYear?.toString() || '',
    gender: user?.gender || '',
    club: user?.club || '',
  });

  const [sosContacts, setSosContacts] = useState<SosContact[]>(user?.sosContacts ?? []);
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const publicProfileUrl = `${window.location.origin}/athlete/${user.id}`;

  const copyProfileLink = () => {
    navigator.clipboard.writeText(publicProfileUrl);
    toast({
      title: 'Skopiowano link',
      description: 'Link do profilu został skopiowany do schowka.',
    });
  };

  const addSosContact = () => {
    setSosContacts([...sosContacts, { name: '', phone: '', relation: '' }]);
  };

  const removeSosContact = (index: number) => {
    setSosContacts(sosContacts.filter((_, i) => i !== index));
  };

  const updateSosContact = (index: number, field: keyof SosContact, value: string) => {
    const updated = sosContacts.map((c, i) => (i === index ? { ...c, [field]: value } : c));
    setSosContacts(updated);
  };

  const handleSaveParticipant = async () => {
    setSaving(true);
    try {
      const birthYearFromDate = participantData.birthDate
        ? new Date(participantData.birthDate).getFullYear()
        : participantData.birthYear
          ? parseInt(participantData.birthYear)
          : undefined;

      const validContacts = sosContacts.filter((c) => c.name.trim() && c.phone.trim());

      await updateCurrentUser({
        birthDate: participantData.birthDate || undefined,
        birthYear: birthYearFromDate,
        gender: (participantData.gender as 'M' | 'K') || undefined,
        club: participantData.club || undefined,
        sosContacts: validContacts.length ? validContacts : undefined,
      });

      toast({ title: 'Zapisano dane zawodnika' });
    } catch {
      toast({ title: 'Błąd zapisu', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <ProfileForm user={user}>
        {/* Dane zawodnika */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dane zawodnika</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data urodzenia</Label>
                <DateInput
                  id="birthDate"
                  value={participantData.birthDate}
                  onValueChange={(val) => {
                    const year = val ? new Date(val).getFullYear().toString() : '';
                    setParticipantData({ ...participantData, birthDate: val, birthYear: year });
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Potrzebna do przypisania kategorii wiekowej
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Płeć</Label>
                <Select
                  value={participantData.gender}
                  onValueChange={(value) =>
                    setParticipantData({ ...participantData, gender: value })
                  }
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Wybierz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Mężczyzna</SelectItem>
                    <SelectItem value="K">Kobieta</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Potrzebna do klasyfikacji</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="club">Klub sportowy (opcjonalne)</Label>
              <Input
                id="club"
                value={participantData.club}
                onChange={(e) => setParticipantData({ ...participantData, club: e.target.value })}
                placeholder="np. KB Gliwice"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={handleSaveParticipant}
                disabled={saving}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Zapisz dane zawodnika
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Kontakty SOS */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Kontakty alarmowe (SOS)</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSosContact}
                disabled={sosContacts.length >= 3}
              >
                <Plus className="mr-1 h-4 w-4" />
                Dodaj
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {sosContacts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Dodaj osobę kontaktową na wypadek sytuacji awaryjnej podczas zawodów.
              </p>
            )}
            {sosContacts.map((contact, index) => (
              <div key={index} className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Kontakt {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeSosContact(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor={`sos-name-${index}`}>Imię i nazwisko</Label>
                    <Input
                      id={`sos-name-${index}`}
                      value={contact.name}
                      onChange={(e) => updateSosContact(index, 'name', e.target.value)}
                      placeholder="Anna Kowalska"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`sos-phone-${index}`}>Telefon</Label>
                    <Input
                      id={`sos-phone-${index}`}
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => updateSosContact(index, 'phone', e.target.value)}
                      placeholder="+48 123 456 789"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`sos-relation-${index}`}>Relacja (opcjonalne)</Label>
                  <Input
                    id={`sos-relation-${index}`}
                    value={contact.relation || ''}
                    onChange={(e) => updateSosContact(index, 'relation', e.target.value)}
                    placeholder="np. Mama, Mąż, Przyjaciel"
                  />
                </div>
              </div>
            ))}
            {sosContacts.length > 0 && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSaveParticipant}
                  disabled={saving}
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Zapisz kontakty SOS
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profil publiczny */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profil publiczny</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Twój publiczny profil zawodnika jest dostępny pod poniższym linkiem. Możesz go
              udostępnić innym, aby mogli zobaczyć Twoje wyniki i statystyki.
            </p>
            <div className="flex gap-2">
              <Input value={publicProfileUrl} readOnly className="text-sm" />
              <Button type="button" variant="outline" onClick={copyProfileLink}>
                <Link className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </ProfileForm>

      <div className="mt-6">
        <ChangePasswordCard />
      </div>
    </div>
  );
};

export default ParticipantProfileTab;
