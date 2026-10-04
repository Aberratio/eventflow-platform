import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { ChangeEmailCard } from '@/components/profile/ChangeEmailCard';
import { ChangePasswordCard } from '@/components/profile/ChangePasswordCard';
import { toast } from 'sonner';
import { User, Mail, Phone, Lock, Save } from 'lucide-react';

export const ModeratorProfileTab = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const handleSave = () => {
    toast.success('Profil został zaktualizowany');
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Alert className="border-muted bg-muted/50">
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Możesz edytować podstawowe dane profilu i zmienić hasło.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Dane profilu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Imię i nazwisko</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" value={user?.email || ''} readOnly className="pl-10" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10"
                placeholder="+48 xxx xxx xxx"
              />
            </div>
          </div>

          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Zapisz zmiany
          </Button>
        </CardContent>
      </Card>

      <ChangeEmailCard />

      <ChangePasswordCard />
    </div>
  );
};
