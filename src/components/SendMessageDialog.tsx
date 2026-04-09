import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Registration, Distance } from '@/types';
import { Mail, Users, Filter, Send } from 'lucide-react';
import { InfoBanner } from '@/components/ui/info-banner';

interface SendMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registrations: Registration[];
  selectedIds: Set<string>;
  distances: Distance[];
}

type RecipientMode = 'selected' | 'all' | 'filtered';

export const SendMessageDialog = ({
  open,
  onOpenChange,
  registrations,
  selectedIds,
  distances,
}: SendMessageDialogProps) => {
  const { toast } = useToast();
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('selected');
  const [filterDistance, setFilterDistance] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const activeRegistrations = registrations.filter((r) => r.status !== 'removed');

  const getRecipientCount = () => {
    switch (recipientMode) {
      case 'selected':
        return selectedIds.size;
      case 'all':
        return activeRegistrations.length;
      case 'filtered':
        return activeRegistrations.filter((r) => {
          const matchesDistance = filterDistance === 'all' || r.distanceId === filterDistance;
          const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
          return matchesDistance && matchesStatus;
        }).length;
      default:
        return 0;
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      toast({
        title: 'Wypełnij wszystkie pola',
        description: 'Temat i treść wiadomości są wymagane.',
        variant: 'destructive',
      });
      return;
    }

    const recipientCount = getRecipientCount();
    if (recipientCount === 0) {
      toast({
        title: 'Brak odbiorców',
        description: 'Wybierz przynajmniej jednego odbiorcę.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);

    // Simulate sending
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: 'Wiadomość wysłana',
      description: `Wiadomość została wysłana do ${recipientCount} ${recipientCount === 1 ? 'uczestnika' : recipientCount < 5 ? 'uczestników' : 'uczestników'}.`,
    });

    setSending(false);
    setSubject('');
    setContent('');
    onOpenChange(false);
  };

  const handleClose = () => {
    setSubject('');
    setContent('');
    setRecipientMode('selected');
    setFilterDistance('all');
    setFilterStatus('all');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Wyślij wiadomość
          </DialogTitle>
          <DialogDescription>Wyślij wiadomość email do uczestników zawodów.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Recipient selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Odbiorcy</Label>
            <RadioGroup
              value={recipientMode}
              onValueChange={(value) => setRecipientMode(value as RecipientMode)}
              className="space-y-2"
            >
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                  recipientMode === 'selected'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                } ${selectedIds.size === 0 ? 'opacity-50' : ''}`}
              >
                <RadioGroupItem value="selected" disabled={selectedIds.size === 0} />
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Zaznaczeni uczestnicy ({selectedIds.size})</span>
              </label>

              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                  recipientMode === 'all'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value="all" />
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Wszyscy uczestnicy ({activeRegistrations.length})</span>
              </label>

              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                  recipientMode === 'filtered'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value="filtered" />
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span>Filtruj odbiorców</span>
              </label>
            </RadioGroup>

            {/* Filters */}
            {recipientMode === 'filtered' && (
              <div className="mt-3 grid grid-cols-1 gap-3 pl-3 sm:grid-cols-2 sm:pl-6">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Dystans</Label>
                  <Select value={filterDistance} onValueChange={setFilterDistance}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wszystkie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Wszystkie dystanse</SelectItem>
                      {distances.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wszystkie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Wszystkie statusy</SelectItem>
                      <SelectItem value="confirmed">Potwierdzony</SelectItem>
                      <SelectItem value="pending">Oczekujący</SelectItem>
                      <SelectItem value="cancelled">Anulowany</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  Pasujących odbiorców:{' '}
                  <span className="font-medium text-foreground">{getRecipientCount()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Temat *</Label>
            <Input
              id="subject"
              placeholder="Wpisz temat wiadomości"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Treść *</Label>
            <Textarea
              id="content"
              placeholder="Wpisz treść wiadomości..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px] resize-none"
            />
          </div>

          {/* Info */}
          <InfoBanner icon={<Mail className="h-4 w-4" />}>
            Wiadomość zostanie wysłana na adresy email odbiorców.
          </InfoBanner>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Anuluj
          </Button>
          <Button onClick={handleSend} disabled={sending || getRecipientCount() === 0}>
            {sending ? (
              <>Wysyłanie...</>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Wyślij wiadomość
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
