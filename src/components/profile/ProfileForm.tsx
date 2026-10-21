import { useRef, useState } from 'react';
import { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Camera, Loader2, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { resendEmailVerification, uploadAvatar } from '@/api';

interface ProfileFormProps {
  user: User;
  children?: React.ReactNode;
}

export const ProfileForm = ({ user, children }: ProfileFormProps) => {
  const { updateCurrentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    address: {
      street: user.address?.street || '',
      city: user.address?.city || '',
      postalCode: user.address?.postalCode || '',
      country: user.address?.country || '',
    },
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleResendVerification = async () => {
    setResending(true);
    try {
      await resendEmailVerification();
      toast.success('Wysłaliśmy link weryfikacyjny.');
    } catch (error) {
      toast.error('Nie udało się wysłać linku', {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setResending(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previousPreview = avatarPreview;
    setAvatarPreview(URL.createObjectURL(file));
    setUploadingAvatar(true);

    try {
      const response = await uploadAvatar(file);
      if (response.data?.url) {
        setAvatarPreview(response.data.url);
        toast.success('Zdjęcie profilowe zaktualizowane');
      }
    } catch (error) {
      setAvatarPreview(previousPreview);
      toast.error('Błąd uploadu zdjęcia', {
        description: error instanceof Error ? error.message : 'Nie udało się wgrać zdjęcia.',
      });
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const address = Object.values(formData.address).some(Boolean) ? formData.address : undefined;
      // E-mail is never sent from here — the server rejects a self
      // e-mail change (email_change_not_allowed). The input stays read-only.
      const updated = await updateCurrentUser({
        name: formData.name,
        phone: formData.phone || undefined,
        address,
      });
      if (updated) {
        toast.success('Zapisano zmiany', { description: 'Twoje dane zostały zaktualizowane.' });
      }
    } catch {
      toast.error('Błąd zapisu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 text-lg">
                <AvatarImage src={avatarPreview || undefined} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                aria-label="Zmień zdjęcie profilowe"
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">JPG, PNG lub WebP, maks. 5 MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dane podstawowe */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dane podstawowe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Imię i nazwisko</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Jan Kowalski"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="email">Email</Label>
              {user.emailVerified === false && <Badge variant="outline">niezweryfikowany</Badge>}
            </div>
            <Input
              id="email"
              type="email"
              value={formData.email}
              readOnly
              aria-describedby="email-hint"
              placeholder="jan@example.com"
            />
            <p id="email-hint" className="text-xs text-muted-foreground">
              Aby zmienić adres e-mail, użyj sekcji „Zmień adres e-mail”.
            </p>
            {user.emailVerified === false && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResendVerification}
                disabled={resending}
              >
                {resending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Wyślij link weryfikacyjny
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefon (opcjonalne)</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+48 123 456 789"
            />
          </div>
        </CardContent>
      </Card>

      {/* Adres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Adres (opcjonalne)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street">Ulica i numer</Label>
            <Input
              id="street"
              value={formData.address.street}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, street: e.target.value },
                })
              }
              placeholder="ul. Przykładowa 1/2"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Kod pocztowy</Label>
              <Input
                id="postalCode"
                value={formData.address.postalCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, postalCode: e.target.value },
                  })
                }
                placeholder="00-000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Miasto</Label>
              <Input
                id="city"
                value={formData.address.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value },
                  })
                }
                placeholder="Warszawa"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Kraj</Label>
            <Input
              id="country"
              value={formData.address.country}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, country: e.target.value },
                })
              }
              placeholder="Polska"
            />
          </div>
        </CardContent>
      </Card>

      {/* Dodatkowe pola z rodzica */}
      {children}

      <Button type="submit" disabled={saving} className="w-full sm:w-auto">
        {saving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Zapisz zmiany
      </Button>
    </form>
  );
};
