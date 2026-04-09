import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PaymentMethod } from '@/types';
import { CreditCard, Banknote, Smartphone, Building, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentMethodsEditorProps {
  paymentMethods: PaymentMethod[];
  onChange: (methods: PaymentMethod[]) => void;
}

const methodIcons: Record<string, React.ElementType> = {
  pm1: Building, // Przelew bankowy
  pm2: Smartphone, // BLIK
  pm3: CreditCard, // Karta płatnicza
  pm4: Wallet, // PayU
  pm5: Banknote, // Płatność na miejscu
};

const defaultMethods: PaymentMethod[] = [
  { id: 'pm1', name: 'Przelew bankowy', enabled: true },
  { id: 'pm2', name: 'BLIK', enabled: true },
  { id: 'pm3', name: 'Karta płatnicza', enabled: true },
  { id: 'pm4', name: 'PayU', enabled: false },
  { id: 'pm5', name: 'Płatność na miejscu (gotówka)', enabled: false },
];

export const PaymentMethodsEditor = ({ paymentMethods, onChange }: PaymentMethodsEditorProps) => {
  // Use default methods if none provided
  const methods = paymentMethods.length > 0 ? paymentMethods : defaultMethods;

  const toggleMethod = (methodId: string) => {
    const updatedMethods = methods.map((method) =>
      method.id === methodId ? { ...method, enabled: !method.enabled } : method,
    );
    onChange(updatedMethods);

    const method = methods.find((m) => m.id === methodId);
    if (method) {
      toast.success(
        `Metoda "${method.name}" została ${!method.enabled ? 'włączona' : 'wyłączona'}`,
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Metody płatności</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {methods.map((method) => {
            const Icon = methodIcons[method.id] || CreditCard;
            return (
              <div
                key={method.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Label htmlFor={method.id} className="cursor-pointer font-medium">
                    {method.name}
                  </Label>
                </div>
                <Switch
                  id={method.id}
                  checked={method.enabled}
                  onCheckedChange={() => toggleMethod(method.id)}
                />
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Wybierz metody płatności dostępne dla uczestników podczas rejestracji.
        </p>
      </CardContent>
    </Card>
  );
};
