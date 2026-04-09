import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Event, Registration } from '@/types';
import { CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface BankPaymentSummaryProps {
  event: Event;
  registrations: Registration[];
}

export const BankPaymentSummary = ({ event, registrations }: BankPaymentSummaryProps) => {
  // Calculate payment statistics
  const stats = registrations.reduce(
    (acc, reg) => {
      if (reg.status === 'removed') return acc;

      const details = reg.paymentDetails;

      // Start fee
      const startFee = details?.startFeeAmount || reg.pricePaid || 0;
      acc.totalStartFees += startFee;
      if (details?.startFeePaid) {
        acc.paidStartFees += startFee;
        acc.paidStartFeesCount++;
      } else {
        acc.unpaidStartFeesCount++;
      }

      // Insurance
      if (details?.insuranceAmount) {
        acc.totalInsurance += details.insuranceAmount;
        if (details.insurancePaid) {
          acc.paidInsurance += details.insuranceAmount;
        }
      }

      // Merchandise
      if (details?.merchandisePayments) {
        details.merchandisePayments.forEach((mp) => {
          acc.totalMerchandise += mp.amount;
          if (mp.paid) {
            acc.paidMerchandise += mp.amount;
          }
        });
      }

      return acc;
    },
    {
      totalStartFees: 0,
      paidStartFees: 0,
      paidStartFeesCount: 0,
      unpaidStartFeesCount: 0,
      totalInsurance: 0,
      paidInsurance: 0,
      totalMerchandise: 0,
      paidMerchandise: 0,
    },
  );

  const totalCollected = stats.paidStartFees + stats.paidInsurance + stats.paidMerchandise;
  const totalExpected = stats.totalStartFees + stats.totalInsurance + stats.totalMerchandise;
  const totalRemaining = totalExpected - totalCollected;

  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardContent className="pt-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          {/* Info */}
          <div className="flex flex-1 items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div>
              <div className="font-medium text-warning-foreground">
                Płatności przelewem bankowym
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Konto: <span className="font-mono">{event.paymentConfig?.bankAccountNumber}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Właściciel: {event.paymentConfig?.bankAccountHolder}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Opłaconych: {stats.paidStartFeesCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <span>Oczekujących: {stats.unpaidStartFeesCount}</span>
            </div>
          </div>

          {/* Totals */}
          <div className="flex flex-wrap gap-3">
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 px-3 py-1.5 text-primary"
            >
              <CreditCard className="mr-1 h-3 w-3" />
              Zebrano: {totalCollected.toLocaleString('pl-PL')} zł
            </Badge>
            {totalRemaining > 0 && (
              <Badge
                variant="outline"
                className="border-warning/30 bg-warning/10 px-3 py-1.5 text-warning"
              >
                Pozostało: {totalRemaining.toLocaleString('pl-PL')} zł
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
