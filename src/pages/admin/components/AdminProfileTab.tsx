import { useAuth } from '@/contexts/AuthContext';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Key, Clock } from 'lucide-react';

const AdminProfileTab = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-2xl">
      <ProfileForm user={user}>
        {/* Role Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Uprawnienia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Rola w systemie</p>
                <p className="text-sm text-muted-foreground">
                  Pełny dostęp do wszystkich funkcji platformy
                </p>
              </div>
              <Badge variant="destructive">Administrator</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Bezpieczeństwo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Hasło</p>
                <p className="text-sm text-muted-foreground">
                  Ostatnia zmiana: 30 dni temu
                </p>
              </div>
              <Button variant="outline" disabled>
                Zmień hasło
              </Button>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Ostatnie logowanie: dzisiaj, 10:30</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </ProfileForm>
    </div>
  );
};

export default AdminProfileTab;
