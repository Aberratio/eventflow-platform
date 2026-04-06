import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Layout } from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { KeyRound, CheckCircle, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Hasło musi mieć minimum 8 znaków'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasła muszą być identyczne',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const token = searchParams.get('token');

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSuccess(true);
    toast({ title: 'Hasło zmienione', description: 'Twoje hasło zostało pomyślnie zmienione.' });
    setIsLoading(false);
  };

  if (!token && !isSuccess) {
    return (
      <Layout>
        <div className="bg-gradient-to-b from-destructive/5 via-background to-background">
          <div className="container py-12 md:py-24">
            <div className="max-w-md mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Nieprawidłowy link</h1>
              <p className="text-muted-foreground mb-6">Link do resetowania hasła jest nieprawidłowy lub wygasł.</p>
              <Card className="shadow-lg border-border/50">
                <CardContent className="pt-6">
                  <Button asChild className="w-full" size="lg">
                    <Link to="/forgot-password">Wyślij nowy link</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container py-12 md:py-24">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${isSuccess ? 'bg-success/10' : 'bg-primary/10'}`}>
                {isSuccess ? <CheckCircle className="h-8 w-8 text-success" /> : <KeyRound className="h-8 w-8 text-primary" />}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {isSuccess ? 'Hasło zmienione!' : 'Ustaw nowe hasło'}
              </h1>
              <p className="text-muted-foreground">
                {isSuccess ? 'Możesz się teraz zalogować nowym hasłem.' : 'Wprowadź nowe hasło dla swojego konta.'}
              </p>
            </div>

            <Card className="shadow-lg border-border/50">
              <CardContent className="pt-6">
                {isSuccess ? (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-success/5 border border-success/20 p-4 text-center">
                      <CheckCircle className="h-6 w-6 text-success mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Hasło zostało pomyślnie zaktualizowane</p>
                    </div>
                    <Button asChild className="w-full" size="lg">
                      <Link to="/login">Przejdź do logowania</Link>
                    </Button>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nowe hasło</FormLabel>
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
                            <FormLabel>Potwierdź nowe hasło</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input type="password" placeholder="Powtórz hasło" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                        {isLoading ? 'Zapisywanie...' : 'Zmień hasło'}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ResetPasswordPage;
