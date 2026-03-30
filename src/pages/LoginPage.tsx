import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { User, Briefcase, Shield, UserCheck } from 'lucide-react';
import { UserRole } from '@/types';
import { useEffect } from 'react';

const LoginPage = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = {
        participant: '/participant',
        organizer: '/organizer',
        moderator: '/moderator',
        admin: '/admin',
      }[user.role];
      navigate(redirectPath);
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = (role: UserRole) => {
    login(role);
    const redirectPath = {
      participant: '/participant',
      organizer: '/organizer',
      moderator: '/moderator',
      admin: '/admin',
    }[role];
    navigate(redirectPath);
  };

  const roles = [
    {
      role: 'participant' as UserRole,
      icon: User,
      title: 'Uczestnik',
      description: 'Przeglądaj zawody, rejestruj się na wydarzenia, śledź swoje wyniki.',
      color: 'bg-accent text-accent-foreground',
    },
    {
      role: 'organizer' as UserRole,
      icon: Briefcase,
      title: 'Organizator',
      description: 'Twórz i zarządzaj wydarzeniami, dodawaj wyniki uczestników.',
      color: 'bg-primary text-primary-foreground',
    },
    {
      role: 'moderator' as UserRole,
      icon: UserCheck,
      title: 'Moderator',
      description: 'Moderuj wydarzenia, przeglądaj użytkowników i zarządzaj zamówieniami.',
      color: 'bg-warning text-warning-foreground',
    },
    {
      role: 'admin' as UserRole,
      icon: Shield,
      title: 'Super Admin',
      description: 'Pełny dostęp do platformy i wszystkich ustawień systemowych.',
      color: 'bg-destructive text-destructive-foreground',
    },
  ];

  return (
    <Layout>
      <div className="container py-12 md:py-24">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Zaloguj się do ZmierzymyCzas</h1>
          <p className="text-lg text-muted-foreground">
            To jest wersja demonstracyjna. Wybierz rolę, jako która chcesz się zalogować.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {roles.map(({ role, icon: Icon, title, description, color }) => (
            <Card key={role} className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="text-center pb-2">
                <div className={`w-16 h-16 rounded-full ${color} flex items-center justify-center mx-auto mb-4`}>
                  <Icon className="h-8 w-8" />
                </div>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="mb-6 min-h-[60px]">
                  {description}
                </CardDescription>
                <Button 
                  onClick={() => handleLogin(role)} 
                  className="w-full"
                  variant={role === 'organizer' ? 'default' : 'outline'}
                >
                  Zaloguj jako {title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
            <Link to="/register" className="text-primary hover:underline font-medium">
              Zarejestruj się
            </Link>
            <span className="hidden sm:inline text-muted-foreground">|</span>
            <Link to="/forgot-password" className="text-muted-foreground hover:text-primary">
              Zapomniałeś hasła?
            </Link>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>💡 Tip: Dane logowania są zapisywane w localStorage przeglądarki.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
