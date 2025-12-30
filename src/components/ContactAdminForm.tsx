import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { MessageSquare } from 'lucide-react';

const contactSchema = z.object({
  name: z.string().min(2, 'Imię musi mieć co najmniej 2 znaki').max(100),
  email: z.string().email('Nieprawidłowy adres email').max(255),
  subject: z.string().min(5, 'Temat musi mieć co najmniej 5 znaków').max(200),
  message: z.string().min(10, 'Wiadomość musi mieć co najmniej 10 znaków').max(2000),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactAdminFormProps {
  trigger?: React.ReactNode;
}

export const ContactAdminForm = ({ trigger }: ContactAdminFormProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    // Mock submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: 'Wiadomość wysłana',
      description: 'Dziękujemy za kontakt. Odpowiemy najszybciej jak to możliwe.',
    });
    
    form.reset();
    setOpen(false);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <MessageSquare className="h-4 w-4 mr-2" />
            Kontakt z administracją
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Kontakt z administracją</DialogTitle>
          <DialogDescription>
            Masz pytanie lub sugestię? Napisz do nas, a odpowiemy najszybciej jak to możliwe.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imię i nazwisko</FormLabel>
                  <FormControl>
                    <Input placeholder="Jan Kowalski" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="jan@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temat</FormLabel>
                  <FormControl>
                    <Input placeholder="Temat wiadomości" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wiadomość</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Treść wiadomości..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Anuluj
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Wysyłanie...' : 'Wyślij'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
