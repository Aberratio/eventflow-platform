import { Card, CardContent } from '@/components/ui/card';
import { Event, Registration } from '@/types';
import { AlertCircle } from 'lucide-react';

interface BankPaymentSummaryProps {
  event: Event;
  registrations: Registration[];
}

export const BankPaymentSummary = ({ event }: BankPaymentSummaryProps) => {
  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <div className="font-medium text-warning">Płatności przelewem bankowym</div>
            <div className="mt-4 space-y-1 text-sm text-muted-foreground">
              <div>
                Konto: <span className="font-mono">{event.paymentConfig?.bankAccountNumber}</span>
              </div>
              <div>Właściciel: {event.paymentConfig?.bankAccountHolder}</div>
              {event.paymentConfig?.bankTransferAddress && (
                <div>{event.paymentConfig.bankTransferAddress}</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
