import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
import { ApiRequestError } from '@/api/errors';
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
import { Timer, Lock, Mail, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(1, 'Hasło jest wymagane'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const DEFAULT_LOCKOUT_SECONDS = 60;

/** R-10: seconds to wait, from the 429 `error.details.retryAfterSeconds` (mirrors Retry-After). */
function lockoutSeconds(error: ApiRequestError): number {
  const value = (error.details as { retryAfterSeconds?: unknown } | undefined)?.retryAfterSeconds;
  return typeof value === 'number' && value > 0 ? Math.ceil(value) : DEFAULT_LOCKOUT_SECONDS;
}

function lockoutMessage(seconds: number): string {
  return `Zbyt wiele nieudanych prób logowania. Spróbuj ponownie za ${Math.max(1, Math.ceil(seconds / 60))} min.`;
}

const LoginPage = () => {
  const { loginWithCredentials, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const lockedUntil = useRef(0);

  const isLocked = secondsLeft > 0;
  useEffect(() => {
    if (!isLocked) return;
    const timer = setInterval(() => {
      const left = Math.ceil((lockedUntil.current - Date.now()) / 1000);
      setSecondsLeft(left > 0 ? left : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [isLocked]);

  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo;

  useEffect(() => {
    if (isAuthenticated && user) {
      if (returnTo) {
        navigate(returnTo);
        return;
      }
      const redirectPath = {
        participant: '/participant',
        organizer: '/organizer',
        moderator: '/moderator',
        admin: '/admin',
        superadmin: '/admin',
      }[user.role];
      navigate(redirectPath);
    }
  }, [isAuthenticated, user, navigate, returnTo]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
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
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 429) {
        const seconds = lockoutSeconds(error);
        lockedUntil.current = Date.now() + seconds * 1000;
        setSecondsLeft(seconds);
      } else if (error instanceof ApiRequestError && error.code === 'account_blocked') {
        toast({ title: 'Konto zablokowane', description: error.message, variant: 'destructive' });
      } else {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageShell
      icon={<Timer className="h-8 w-8 text-primary" />}
      title="Zaloguj się"
      subtitle="Wejdź na platformę ZmierzymyCzas"
    >
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
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="twoj@email.com"
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                    </div>
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
                      <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                        Zapomniałeś hasła?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <FormControl>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isLocked && (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {lockoutMessage(secondsLeft)}
                </p>
              )}
              <Button type="submit" className="w-full" size="lg" disabled={isLoading || isLocked}>
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
    </AuthPageShell>
  );
};

export default LoginPage;
