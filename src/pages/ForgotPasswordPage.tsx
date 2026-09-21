import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { ArrowLeft, Mail, CheckCircle, KeyRound } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSuccess(true);
    toast({
      title: 'Link wysłany',
      description: `Na adres ${data.email} wysłaliśmy link do resetowania hasła.`,
    });
    setIsLoading(false);
  };

  return (
    <AuthPageShell
      icon={
        isSuccess ? (
          <CheckCircle className="h-8 w-8 text-success" />
        ) : (
          <KeyRound className="h-8 w-8 text-primary" />
        )
      }
      title={isSuccess ? 'Sprawdź skrzynkę' : 'Resetuj hasło'}
      subtitle={
        isSuccess
          ? 'Wysłaliśmy link do resetowania hasła. Sprawdź też folder spam.'
          : 'Podaj email powiązany z kontem, a wyślemy link do zresetowania hasła.'
      }
      maxWidth="max-w-md"
      accent={isSuccess ? 'success' : 'primary'}
    >
      <Card className="border-border/50 shadow-lg">
        <CardContent className="pt-6">
          {isSuccess ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-success/20 bg-success/5 p-4 text-center">
                <Mail className="mx-auto mb-2 h-6 w-6 text-success" />
                <p className="text-sm text-muted-foreground">
                  Email z instrukcjami został wysłany na adres{' '}
                  <strong>{form.getValues('email')}</strong>
                </p>
              </div>
              <Button asChild className="w-full" size="lg">
                <Link to="/login">Powrót do logowania</Link>
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setIsSuccess(false)}>
                Wyślij ponownie
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adres email</FormLabel>
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
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? 'Wysyłanie...' : 'Wyślij link resetujący'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        {!isSuccess && (
          <CardFooter className="border-t pt-6">
            <Link
              to="/login"
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Powrót do logowania
            </Link>
          </CardFooter>
        )}
      </Card>
    </AuthPageShell>
  );
};

export default ForgotPasswordPage;
