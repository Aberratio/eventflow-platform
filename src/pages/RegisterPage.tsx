import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { appLogger } from '@/lib/logger';
import { register } from '@/api';
import { ApiRequestError } from '@/api/errors';
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
import { UserPlus, Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'Imię musi mieć minimum 2 znaki'),
    lastName: z.string().min(2, 'Nazwisko musi mieć minimum 2 znaki'),
    email: z.string().email('Nieprawidłowy adres email'),
    password: z.string().min(8, 'Hasło musi mieć minimum 8 znaków'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Hasła muszą być identyczne',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterPage = () => {
  const { loginWithCredentials } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      // PP.101: self-registration always creates a participant; the server ignores any role in the body.
      await register({
        name: `${data.firstName.trim()} ${data.lastName.trim()}`,
        email: data.email,
        password: data.password,
      });
    } catch (error) {
      // The adapter turns the server's Polish message (409 email taken, 422 invalid data) into the error text.
      const message =
        error instanceof ApiRequestError
          ? error.message
          : 'Nie udało się utworzyć konta. Spróbuj ponownie.';
      if (error instanceof ApiRequestError) {
        if (error.code === 'email_taken' || error.code === 'invalid_email') {
          form.setError('email', { message });
        } else if (error.code === 'password_too_short' || error.code === 'password_too_long') {
          form.setError('password', { message });
        }
      }
      toast({
        title: 'Nie udało się utworzyć konta',
        description: message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // No name or e-mail in the log: the account exists, nothing else is worth keeping here.
    appLogger.auth('register', 'Zarejestrowano nowe konto', { metadata: { role: 'participant' } });
    toast({
      title: 'Konto zostało utworzone!',
      description:
        'Link do potwierdzenia adresu e-mail jest wysyłany na podany adres. Jeśli nie dotrze, możesz poprosić o ponowne wysłanie w swoim profilu.',
    });

    try {
      const loggedIn = await loginWithCredentials(data.email, data.password);
      navigate(loggedIn ? '/participant' : '/login');
    } catch {
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageShell
      icon={<UserPlus className="h-8 w-8 text-primary" />}
      title="Utwórz konto"
      subtitle="Dołącz do platformy ZmierzymyCzas"
    >
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Dane rejestracyjne</CardTitle>
          <CardDescription>Wypełnij formularz, aby utworzyć nowe konto</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imię</FormLabel>
                      <FormControl>
                        <Input placeholder="Jan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nazwisko</FormLabel>
                      <FormControl>
                        <Input placeholder="Kowalski" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                          placeholder="jan@example.com"
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
                    <FormLabel>Hasło</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min. 8 znaków"
                          className="pl-10 pr-10"
                          {...field}
                        />
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Potwierdź hasło</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Powtórz hasło"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? 'Tworzenie konta...' : 'Zarejestruj się'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t pt-6">
          <p className="text-sm text-muted-foreground">
            Masz już konto?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Zaloguj się
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthPageShell>
  );
};

export default RegisterPage;
