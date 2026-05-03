import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AuthPageShell } from '@/components/ui/auth-page-shell';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Timer, Lock, Mail, Eye, EyeOff, User, Briefcase, UserCheck, Shield, Crown } from 'lucide-react';
import { MockCredentialCard, type MockCredential } from '@/components/auth/MockCredentialCard';

const loginSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(1, 'Hasło jest wymagane'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const MOCK_CREDENTIALS: MockCredential[] = [
  {
    role: 'participant',
    label: 'Uczestnik',
    email: 'jan@example.com',
    password: 'demo1234',
    icon: User,
    color: 'bg-accent/10 text-accent-foreground border-accent/30',
  },
  {
    role: 'organizer',
    label: 'Organizator',
    email: 'marek@timing.pl',
    password: 'demo1234',
    icon: Briefcase,
    color: 'bg-primary/10 text-primary border-primary/30',
  },
  {
    role: 'moderator',
    label: 'Moderator',
    email: 'monika@zmierzymyczas.pl',
    password: 'demo1234',
    icon: UserCheck,
    color: 'bg-warning/10 text-warning-foreground border-warning/30',
  },
  {
    role: 'admin',
    label: 'Administrator',
    email: 'admin@zmierzymyczas.pl',
    password: 'demo1234',
    icon: Shield,
    color: 'bg-destructive/10 text-destructive border-destructive/30',
  },
  {
    role: 'superadmin',
    label: 'Super Admin',
    email: 'superadmin@zmierzymyczas.pl',
    password: 'demo1234',
    icon: Crown,
    color: 'bg-destructive/10 text-destructive border-destructive/30',
  },
];

const LoginPage = () => {
  const { loginWithCredentials, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = {
        participant: '/participant',
        organizer: '/organizer',
        moderator: '/moderator',
        admin: '/admin',
        superadmin: '/admin',
      }[user.role];
      navigate(redirectPath);
    }
  }, [isAuthenticated, user, navigate]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const success = await loginWithCredentials(data.email, data.password);
    if (success) {
      toast({ title: 'Zalogowano pomyślnie', description: 'Witaj z powrotem!' });
    } else {
      toast({
        title: 'Błąd logowania',
        description: 'Nieprawidłowy email lub hasło.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleFillCredentials = (cred: MockCredential) => {
    form.setValue('email', cred.email);
    form.setValue('password', cred.password);
  };

  return (
    <AuthPageShell
      icon={<Timer className="h-8 w-8 text-primary" />}
      title="Zaloguj się"
      subtitle="Wejdź na platformę ZmierzymyCzas"
      maxWidth="max-w-5xl"
    >

            <div className="grid items-start gap-8 lg:grid-cols-2">
              {/* Login form */}
              <Card className="border-border/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Lock className="h-5 w-5 text-primary" />
                    Dane logowania
                  </CardTitle>
                  <CardDescription>Wprowadź email i hasło aby się zalogować</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                  type="email"
                                  placeholder="twoj@email.com"
                                  className="pl-10"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel>Hasło</FormLabel>
                              <Link
                                to="/forgot-password"
                                className="text-xs text-primary hover:underline"
                              >
                                Zapomniałeś hasła?
                              </Link>
                            </div>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder="••••••••"
                                  className="pl-10 pr-10"
                                  {...field}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                        {isLoading ? 'Logowanie...' : 'Zaloguj się'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 border-t pt-6">
                  <p className="text-sm text-muted-foreground">
                    Nie masz konta?{' '}
                    <Link to="/register" className="font-medium text-primary hover:underline">
                      Zarejestruj się
                    </Link>
                  </p>
                </CardFooter>
              </Card>

              {/* Mock credentials panel */}
              <div className="space-y-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Konta testowe (demo)
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid gap-3">
                  {MOCK_CREDENTIALS.map((cred) => (
                    <MockCredentialCard
                      key={cred.role}
                      credential={cred}
                      copiedField={copiedField}
                      onFill={handleFillCredentials}
                      onCopy={handleCopy}
                    />
                  ))}
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  💡 Kliknij kartę, aby automatycznie wypełnić formularz danymi testowymi.
                </p>
              </div>
            </div>
    </AuthPageShell>
  );
};

export default LoginPage;
