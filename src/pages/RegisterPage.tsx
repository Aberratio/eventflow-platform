import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { User, Briefcase, UserPlus, Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';

const registerSchema = z.object({
  firstName: z.string().min(2, 'Imię musi mieć minimum 2 znaki'),
  lastName: z.string().min(2, 'Nazwisko musi mieć minimum 2 znaki'),
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(8, 'Hasło musi mieć minimum 8 znaków'),
  confirmPassword: z.string(),
  role: z.enum(['participant', 'organizer']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasła muszą być identyczne',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const EXISTING_EMAILS = ['jan@example.com', 'anna@example.com'];

const RegisterPage = () => {
  const { login } = useAuth();
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
      role: 'participant',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (EXISTING_EMAILS.includes(data.email)) {
      toast({ title: 'Błąd rejestracji', description: 'Użytkownik o tym adresie email już istnieje.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    toast({ title: 'Konto zostało utworzone!', description: 'Na podany adres email wysłaliśmy link aktywacyjny.' });
    login(data.role);
    const redirectPath = data.role === 'organizer' ? '/organizer' : '/participant';
    navigate(redirectPath);
    setIsLoading(false);
  };

  const selectedRole = form.watch('role');

  return (
    <Layout>
      <div className="bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container py-12 md:py-20">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Utwórz konto</h1>
              <p className="text-muted-foreground">Dołącz do platformy ZmierzymyCzas</p>
            </div>

            <Card className="shadow-lg border-border/50">
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
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input type="email" placeholder="jan@example.com" className="pl-10" {...field} />
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
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Min. 8 znaków"
                                className="pl-10 pr-10"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input type="password" placeholder="Powtórz hasło" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Typ konta</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-2 gap-4"
                            >
                              <div>
                                <RadioGroupItem value="participant" id="participant" className="peer sr-only" />
                                <Label
                                  htmlFor="participant"
                                  className={`flex flex-col items-center justify-between rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                                    selectedRole === 'participant'
                                      ? 'border-primary bg-primary/5 shadow-sm'
                                      : 'border-muted bg-card hover:bg-accent/5'
                                  }`}
                                >
                                  <User className="mb-2 h-6 w-6" />
                                  <span className="text-sm font-medium">Zawodnik</span>
                                  <span className="text-xs text-muted-foreground mt-1">Startuj w zawodach</span>
                                </Label>
                              </div>
                              <div>
                                <RadioGroupItem value="organizer" id="organizer" className="peer sr-only" />
                                <Label
                                  htmlFor="organizer"
                                  className={`flex flex-col items-center justify-between rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                                    selectedRole === 'organizer'
                                      ? 'border-primary bg-primary/5 shadow-sm'
                                      : 'border-muted bg-card hover:bg-accent/5'
                                  }`}
                                >
                                  <Briefcase className="mb-2 h-6 w-6" />
                                  <span className="text-sm font-medium">Organizator</span>
                                  <span className="text-xs text-muted-foreground mt-1">Twórz wydarzenia</span>
                                </Label>
                              </div>
                            </RadioGroup>
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
                  <Link to="/login" className="text-primary font-medium hover:underline">
                    Zaloguj się
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;
