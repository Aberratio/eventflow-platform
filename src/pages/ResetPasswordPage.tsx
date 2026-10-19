import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AuthPageShell } from '@/components/ui/auth-page-shell';
import { useToast } from '@/hooks/use-toast';
import { confirmPasswordReset } from '@/api';
import { apiErrorCode } from '@/api/errors';
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
import { KeyRound, CheckCircle, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Hasło musi mieć minimum 8 znaków'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
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
  const [linkInvalid, setLinkInvalid] = useState(false);

  const token = searchParams.get('token');

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async ({ password }: ResetPasswordFormData) => {
    if (!token) return;
    setIsLoading(true);
    try {
      await confirmPasswordReset({ token, newPassword: password });
      setIsSuccess(true);
      toast({ title: 'Hasło zmienione', description: 'Twoje hasło zostało pomyślnie zmienione.' });
    } catch (error) {
      const code = apiErrorCode(error);
      if (code === 'invalid_token') {
        setLinkInvalid(true);
      } else if (code === 'password_too_short' || code === 'password_too_long') {
        form.setError('password', { message: (error as Error).message });
      } else {
        toast({
          title: 'Błąd',
          description: 'Nie udało się zmienić hasła. Spróbuj ponownie.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if ((!token || linkInvalid) && !isSuccess) {
    return (
      <AuthPageShell
        icon={<AlertTriangle className="h-8 w-8 text-destructive" />}
        title="Nieprawidłowy link"
        subtitle="Link do resetowania hasła jest nieprawidłowy lub wygasł."
        maxWidth="max-w-md"
        accent="destructive"
      >
        <Card className="border-border/50 shadow-lg">
          <CardContent className="pt-6">
            <Button asChild className="w-full" size="lg">
              <Link to="/forgot-password">Wyślij nowy link</Link>
            </Button>
          </CardContent>
        </Card>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      icon={
        isSuccess ? (
          <CheckCircle className="h-8 w-8 text-success" />
        ) : (
          <KeyRound className="h-8 w-8 text-primary" />
        )
      }
      title={isSuccess ? 'Hasło zmienione!' : 'Ustaw nowe hasło'}
      subtitle={
        isSuccess
          ? 'Możesz się teraz zalogować nowym hasłem.'
          : 'Wprowadź nowe hasło dla swojego konta.'
      }
      maxWidth="max-w-md"
      accent={isSuccess ? 'success' : 'primary'}
    >
      <Card className="border-border/50 shadow-lg">
        <CardContent className="pt-6">
          {isSuccess ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-success/20 bg-success/5 p-4 text-center">
                <CheckCircle className="mx-auto mb-2 h-6 w-6 text-success" />
                <p className="text-sm text-muted-foreground">
                  Hasło zostało pomyślnie zaktualizowane
                </p>
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
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <FormControl>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Min. 8 znaków"
                            autoComplete="new-password"
                            className="pl-10 pr-10"
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Potwierdź nowe hasło</FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Powtórz hasło"
                            autoComplete="new-password"
                            className="pl-10"
                            {...field}
                          />
                        </FormControl>
                      </div>
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
    </AuthPageShell>
  );
};

export default ResetPasswordPage;
