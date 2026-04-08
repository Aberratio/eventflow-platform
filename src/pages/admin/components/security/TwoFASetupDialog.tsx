import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { QrCode, Smartphone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type TwoFAMethod = 'app' | 'sms';

interface TwoFASetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSetupComplete: (method: TwoFAMethod) => void;
}

export const TwoFASetupDialog = ({ open, onOpenChange, onSetupComplete }: TwoFASetupDialogProps) => {
  const [method, setMethod] = useState<TwoFAMethod>('app');
  const [step, setStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleClose = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setStep(1);
      setVerificationCode('');
      setPhoneNumber('');
    }
  };

  const handleVerify = () => {
    if (verificationCode.length !== 6) {
      toast({ title: 'Błąd', description: 'Wprowadź 6-cyfrowy kod weryfikacyjny.', variant: 'destructive' });
      return;
    }
    onSetupComplete(method);
    handleClose(false);
    toast({
      title: '2FA włączone',
      description: `Uwierzytelnianie dwuskładnikowe zostało aktywowane (${method === 'app' ? 'aplikacja' : 'SMS'}).`,
    });
  };

  const methodOptions = [
    { id: 'app' as const, icon: QrCode, label: 'Aplikacja', description: 'Google Authenticator, Authy lub podobna' },
    { id: 'sms' as const, icon: Smartphone, label: 'SMS', description: 'Kody wysyłane na numer telefonu' },
  ];

  const renderOTPInput = () => (
    <InputOTP maxLength={6} value={verificationCode} onChange={setVerificationCode}>
      <InputOTPGroup>
        {[0, 1, 2, 3, 4, 5].map(i => <InputOTPSlot key={i} index={i} />)}
      </InputOTPGroup>
    </InputOTP>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Konfiguracja 2FA</DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Wybierz metodę uwierzytelniania dwuskładnikowego.'
              : method === 'app'
                ? 'Zeskanuj kod QR lub wprowadź klucz ręcznie.'
                : 'Wprowadź numer telefonu do otrzymywania kodów SMS.'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-4">
            {methodOptions.map(({ id, icon: Icon, label, description }) => (
              <div
                key={id}
                className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                  method === id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => setMethod(id)}
              >
                <Icon className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 2 && method === 'app' && (
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                <div className="text-center">
                  <QrCode className="h-16 w-16 mx-auto text-muted-foreground" />
                  <p className="text-xs text-muted-foreground mt-2">Mock QR Code</p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Lub wprowadź ręcznie:</p>
              <code className="bg-muted px-3 py-1.5 rounded text-sm font-mono">ABCD-EFGH-IJKL-MNOP</code>
            </div>
            <div className="space-y-2">
              <Label>Kod weryfikacyjny z aplikacji</Label>
              {renderOTPInput()}
            </div>
          </div>
        )}

        {step === 2 && method === 'sms' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone-2fa">Numer telefonu</Label>
              <Input
                id="phone-2fa"
                type="tel"
                placeholder="+48 123 456 789"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => toast({ title: 'Kod wysłany', description: 'Kod weryfikacyjny został wysłany na podany numer.' })}
              disabled={!phoneNumber}
            >
              Wyślij kod SMS
            </Button>
            <div className="space-y-2">
              <Label>Kod weryfikacyjny z SMS</Label>
              {renderOTPInput()}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={() => handleClose(false)}>Anuluj</Button>
              <Button onClick={() => setStep(2)}>Dalej</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>Wstecz</Button>
              <Button onClick={handleVerify} disabled={verificationCode.length !== 6}>Weryfikuj i włącz</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
