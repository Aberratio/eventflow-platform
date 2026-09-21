import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const OrganizerProfileTab = () => {
  const { user, updateCurrentUser } = useAuth();
  const [organizerData, setOrganizerData] = useState({
    companyName: user?.companyName || '',
    nip: user?.nip || '',
    website: user?.website || '',
    description: user?.description || '',
  });
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleSaveOrganizer = async () => {
    setSaving(true);
    try {
      await updateCurrentUser({
        companyName: organizerData.companyName || undefined,
        nip: organizerData.nip || undefined,
        website: organizerData.website || undefined,
        description: organizerData.description || undefined,
      });
      toast({ title: 'Zapisano dane organizatora' });
    } catch {
      toast({ title: 'Błąd zapisu', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <ProfileForm user={user}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dane organizatora</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nazwa firmy / organizacji</Label>
              <Input
                id="companyName"
                value={organizerData.companyName}
                onChange={(e) =>
                  setOrganizerData({ ...organizerData, companyName: e.target.value })
                }
                placeholder="np. Sportowe Wydarzenia Sp. z o.o."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nip">NIP (opcjonalne)</Label>
                <Input
                  id="nip"
                  value={organizerData.nip}
                  onChange={(e) => setOrganizerData({ ...organizerData, nip: e.target.value })}
                  placeholder="np. 1234567890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Strona www (opcjonalne)</Label>
                <Input
                  id="website"
                  type="url"
                  value={organizerData.website}
                  onChange={(e) => setOrganizerData({ ...organizerData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Opis organizatora</Label>
              <Textarea
                id="description"
                value={organizerData.description}
                onChange={(e) =>
                  setOrganizerData({ ...organizerData, description: e.target.value })
                }
                placeholder="Krótki opis Twojej działalności organizatorskiej..."
                rows={4}
                maxLength={500}
              />
              <p className="text-right text-xs text-muted-foreground">
                {organizerData.description.length}/500 znaków
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={handleSaveOrganizer}
                disabled={saving}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Zapisz dane organizatora
              </Button>
            </div>
          </CardContent>
        </Card>
      </ProfileForm>
    </div>
  );
};

export default OrganizerProfileTab;
