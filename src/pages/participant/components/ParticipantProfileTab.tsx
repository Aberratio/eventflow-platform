import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const ParticipantProfileTab = () => {
  const { user } = useAuth();
  const [participantData, setParticipantData] = useState({
    birthYear: user?.birthYear || '',
    gender: user?.gender || '',
    club: user?.club || '',
  });

  if (!user) return null;

  const publicProfileUrl = `${window.location.origin}/athlete/${user.id}`;

  const copyProfileLink = () => {
    navigator.clipboard.writeText(publicProfileUrl);
    toast({
      title: 'Skopiowano link',
      description: 'Link do profilu został skopiowany do schowka.',
    });
  };

  // Generate year options (1940 - current year - 10)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1940 - 9 }, (_, i) => currentYear - 10 - i);

  return (
    <div className="max-w-2xl">
      <ProfileForm user={user}>
        {/* Participant-specific fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dane zawodnika</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthYear">Rok urodzenia</Label>
                <Select
                  value={participantData.birthYear?.toString()}
                  onValueChange={(value) => setParticipantData({ ...participantData, birthYear: value })}
                >
                  <SelectTrigger id="birthYear">
                    <SelectValue placeholder="Wybierz rok" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Potrzebny do przypisania kategorii wiekowej
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Płeć</Label>
                <Select
                  value={participantData.gender}
                  onValueChange={(value) => setParticipantData({ ...participantData, gender: value })}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Wybierz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Mężczyzna</SelectItem>
                    <SelectItem value="K">Kobieta</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Potrzebna do klasyfikacji
                </p>
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
          </CardContent>
        </Card>

        {/* Public Profile Link */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profil publiczny</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Twój publiczny profil zawodnika jest dostępny pod poniższym linkiem. 
              Możesz go udostępnić innym, aby mogli zobaczyć Twoje wyniki i statystyki.
            </p>
            <div className="flex gap-2">
              <Input
                value={publicProfileUrl}
                readOnly
                className="text-sm"
              />
              <Button type="button" variant="outline" onClick={copyProfileLink}>
                <Link className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </ProfileForm>
    </div>
  );
};

export default ParticipantProfileTab;
