import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Registration, Event, PaymentDetails, MerchandisePaymentStatus } from '@/types';
import { Check, X, Mail, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface PaymentDetailsPanelProps {
  registration: Registration;
  event: Event;
  onPaymentUpdate: (registrationId: string, updatedDetails: PaymentDetails) => void;
  onClose: () => void;
}

export const PaymentDetailsPanel = ({ 
  registration, 
  event, 
  onPaymentUpdate,
  onClose 
}: PaymentDetailsPanelProps) => {
  const { toast } = useToast();
  const [details, setDetails] = useState<PaymentDetails>(
    registration.paymentDetails || {
      startFeePaid: false,
      startFeeAmount: registration.pricePaid || 0,
      insurancePaid: false,
      insuranceAmount: registration.insurancePaid,
      merchandisePayments: registration.merchandiseOrders?.map(mo => ({
        merchandiseId: mo.merchandiseId,
        merchandiseName: mo.merchandiseName,
        paid: false,
        amount: mo.price,
      })) || [],
    }
  );

  const toggleStartFee = () => {
    const newPaid = !details.startFeePaid;
    setDetails(prev => ({
      ...prev,
      startFeePaid: newPaid,
      startFeePaidAt: newPaid ? new Date().toISOString() : undefined,
    }));
  };

  const toggleInsurance = () => {
    const newPaid = !details.insurancePaid;
    setDetails(prev => ({
      ...prev,
      insurancePaid: newPaid,
      insurancePaidAt: newPaid ? new Date().toISOString() : undefined,
    }));
  };

  const toggleMerchandise = (merchandiseId: string) => {
    setDetails(prev => ({
      ...prev,
      merchandisePayments: prev.merchandisePayments.map(mp => 
        mp.merchandiseId === merchandiseId
          ? { ...mp, paid: !mp.paid, paidAt: !mp.paid ? new Date().toISOString() : undefined }
          : mp
      ),
    }));
  };

  const markAllPaid = () => {
    const now = new Date().toISOString();
    setDetails({
      ...details,
      startFeePaid: true,
      startFeePaidAt: details.startFeePaidAt || now,
      insurancePaid: details.insuranceAmount ? true : details.insurancePaid,
      insurancePaidAt: details.insuranceAmount ? (details.insurancePaidAt || now) : undefined,
      merchandisePayments: details.merchandisePayments.map(mp => ({
        ...mp,
        paid: true,
        paidAt: mp.paidAt || now,
      })),
    });
  };

  const handleSave = () => {
    onPaymentUpdate(registration.id, details);
    toast({
      title: 'Zapisano zmiany',
      description: 'Status płatności został zaktualizowany.',
    });
    onClose();
  };

  const handleSendReminder = () => {
    toast({
      title: 'Przypomnienie wysłane',
      description: `Wysłano przypomnienie o płatności do ${registration.userEmail}`,
    });
  };

  // Calculate totals
  const totalAmount = details.startFeeAmount + 
    (details.insuranceAmount || 0) + 
    details.merchandisePayments.reduce((sum, mp) => sum + mp.amount, 0);
  
  const paidAmount = (details.startFeePaid ? details.startFeeAmount : 0) +
    (details.insurancePaid && details.insuranceAmount ? details.insuranceAmount : 0) +
    details.merchandisePayments.filter(mp => mp.paid).reduce((sum, mp) => sum + mp.amount, 0);
  
  const unpaidAmount = totalAmount - paidAmount;
  const isFullyPaid = unpaidAmount === 0;

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Szczegóły płatności - {registration.userName}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {registration.distanceName} • Zapis: {format(new Date(registration.registeredAt), 'd MMM yyyy', { locale: pl })}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bank account info */}
        {event.paymentConfig?.type === 'organizer_bank' && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <div className="font-medium mb-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-warning" />
              Dane do przelewu:
            </div>
            <div className="font-mono text-xs">
              {event.paymentConfig.bankAccountNumber}
            </div>
            <div className="text-muted-foreground text-xs">
              {event.paymentConfig.bankAccountHolder}
            </div>
          </div>
        )}

        {/* Payment items */}
        <div className="space-y-3">
          {/* Start fee */}
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-3">
              <Checkbox 
                checked={details.startFeePaid}
                onCheckedChange={toggleStartFee}
              />
              <div>
                <div className="font-medium">Opłata startowa ({registration.distanceName})</div>
                {details.startFeePaidAt && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(details.startFeePaidAt), 'd MMM yyyy, HH:mm', { locale: pl })}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{details.startFeeAmount} zł</span>
              {details.startFeePaid ? (
                <Badge className="bg-primary/10 text-primary">
                  <Check className="h-3 w-3 mr-1" />
                  Opłacone
                </Badge>
              ) : (
                <Badge variant="outline" className="text-warning">
                  Nieopłacone
                </Badge>
              )}
            </div>
          </div>

          {/* Insurance */}
          {details.insuranceAmount && details.insuranceAmount > 0 && (
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={details.insurancePaid}
                  onCheckedChange={toggleInsurance}
                />
                <div>
                  <div className="font-medium">Ubezpieczenie NNW</div>
                  {details.insurancePaidAt && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(details.insurancePaidAt), 'd MMM yyyy, HH:mm', { locale: pl })}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{details.insuranceAmount} zł</span>
                {details.insurancePaid ? (
                  <Badge className="bg-primary/10 text-primary">
                    <Check className="h-3 w-3 mr-1" />
                    Opłacone
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-warning">
                    Nieopłacone
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Merchandise */}
          {details.merchandisePayments.map(mp => (
            <div key={mp.merchandiseId} className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={mp.paid}
                  onCheckedChange={() => toggleMerchandise(mp.merchandiseId)}
                />
                <div>
                  <div className="font-medium">{mp.merchandiseName}</div>
                  {mp.paidAt && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(mp.paidAt), 'd MMM yyyy, HH:mm', { locale: pl })}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{mp.amount} zł</span>
                {mp.paid ? (
                  <Badge className="bg-primary/10 text-primary">
                    <Check className="h-3 w-3 mr-1" />
                    Opłacone
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-warning">
                    Nieopłacone
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Summary */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Razem do zapłaty:</span>
            <span className="font-medium">{totalAmount} zł</span>
          </div>
          <div className="flex justify-between text-primary">
            <span>Opłacono:</span>
            <span className="font-medium">{paidAmount} zł</span>
          </div>
          {unpaidAmount > 0 && (
            <div className="flex justify-between text-warning">
              <span>Pozostało:</span>
              <span className="font-medium">{unpaidAmount} zł</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          {!isFullyPaid && (
            <>
              <Button variant="outline" size="sm" onClick={markAllPaid}>
                <Check className="h-4 w-4 mr-1" />
                Oznacz wszystko jako opłacone
              </Button>
              <Button variant="outline" size="sm" onClick={handleSendReminder}>
                <Mail className="h-4 w-4 mr-1" />
                Wyślij przypomnienie
              </Button>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button onClick={handleSave}>
            Zapisz zmiany
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
