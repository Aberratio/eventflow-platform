import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle, Calendar, MapPin, Building2, Copy, AlertTriangle, Mail, CreditCard, User } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { RegistrationData } from '@/components/registration/RegistrationForm';
import { PaymentConfig } from '@/types';

interface RegistrationSuccessState {
  registrationData: RegistrationData;
  eventId: string;
  eventName: string;
  eventSlug: string;
  eventDate: string;
  eventCity: string;
  paymentConfig?: PaymentConfig;
}

const RegistrationSuccessPage = () => {
  const { slug } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  
  const state = location.state as RegistrationSuccessState | null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Skopiowano',
        description: `${label} został skopiowany do schowka`,
      });
    });
  };

  const generateTransferTitle = () => {
    if (!state?.paymentConfig?.transferTitle) {
      return `${state?.eventName || 'Wydarzenie'} - ${user?.name || 'Uczestnik'}`;
    }
    
    return state.paymentConfig.transferTitle
      .replace('{eventName}', state.eventName)
      .replace('{participantName}', user?.name || 'Uczestnik')
      .replace('{distanceName}', state.registrationData.distanceName);
  };

  // No state - user accessed page directly
  if (!state) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
              <User className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Brak danych rejestracji</h1>
            <p className="text-muted-foreground">
              Nie znaleźliśmy danych rejestracji do wyświetlenia.
            </p>
            <Button asChild>
              <Link to="/events">Przejdź do wydarzeń</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const { registrationData, eventName, eventDate, eventCity, paymentConfig } = state;
  const isBankTransfer = paymentConfig?.type === 'organizer_bank';

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {isBankTransfer ? 'Rejestracja wstępna zakończona!' : 'Rejestracja zakończona!'}
            </h1>
            <p className="text-muted-foreground">
              Zapisałeś się na wydarzenie <span className="font-semibold text-foreground">{eventName}</span>
            </p>
            <div className="flex items-center justify-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(eventDate), 'd MMMM yyyy', { locale: pl })}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {eventCity}
              </span>
            </div>
            <p className="mt-2 text-sm">
              Dystans: <span className="font-medium">{registrationData.distanceName}</span>
              {' • '}
              Kategoria: <span className="font-medium">{registrationData.category}</span>
            </p>
          </div>

          {/* Order Details Card */}
          <Card className="mb-6">
            <CardContent className="pt-6 space-y-6">
              {/* Registration details */}
              <div>
                <h2 className="font-semibold mb-4">
                  {isBankTransfer ? 'Szczegóły zamówienia' : 'Szczegóły rejestracji'}
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Opłata startowa ({registrationData.distanceName})</span>
                    <span className="font-medium">{registrationData.price} zł</span>
                  </div>
                  
                  {registrationData.discountAmount && registrationData.discountAmount > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>Rabat ({registrationData.discountCode})</span>
                      <span className="font-medium">-{registrationData.discountAmount} zł</span>
                    </div>
                  )}
                  
                  {registrationData.insurancePrice && registrationData.insurancePrice > 0 && (
                    <div className="flex justify-between">
                      <span>Ubezpieczenie NNW</span>
                      <span className="font-medium">{registrationData.insurancePrice} zł</span>
                    </div>
                  )}
                  
                  {registrationData.merchandiseOrders.map((order, index) => (
                    <div key={index} className="flex justify-between">
                      <span>
                        {order.merchandiseName}
                        {(order.size || order.color) && (
                          <span className="text-muted-foreground">
                            {' '}({[order.size, order.color].filter(Boolean).join(', ')})
                          </span>
                        )}
                        {order.quantity > 1 && ` x${order.quantity}`}
                      </span>
                      <span className="font-medium">{order.price} zł</span>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between font-semibold text-lg">
                  <span>{isBankTransfer ? 'Do zapłaty' : 'Razem zapłacono'}</span>
                  <span>{registrationData.totalAmount} zł</span>
                </div>
                
                {!isBankTransfer && (
                  <div className="flex items-center gap-2 text-sm text-primary mt-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Płatność zrealizowana automatycznie</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bank Transfer Details (only for bank transfer) */}
          {isBankTransfer && paymentConfig && (
            <Card className="mb-6 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <Building2 className="h-5 w-5" />
                  <h2 className="font-semibold">Dane do przelewu bankowego</h2>
                </div>
                
                <div className="space-y-3 text-sm">
                  {/* Account number */}
                  <div className="flex justify-between items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-muted-foreground text-xs">Numer konta</p>
                      <p className="font-mono font-medium">{paymentConfig.bankAccountNumber}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(paymentConfig.bankAccountNumber || '', 'Numer konta')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Account holder */}
                  <div className="flex justify-between items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-muted-foreground text-xs">Odbiorca</p>
                      <p className="font-medium">{paymentConfig.bankAccountHolder}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(paymentConfig.bankAccountHolder || '', 'Odbiorca')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Transfer title */}
                  <div className="flex justify-between items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-muted-foreground text-xs">Tytuł przelewu</p>
                      <p className="font-medium">{generateTransferTitle()}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(generateTransferTitle(), 'Tytuł przelewu')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Amount */}
                  <div className="flex justify-between items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-muted-foreground text-xs">Kwota</p>
                      <p className="font-bold text-lg">{registrationData.totalAmount.toFixed(2)} PLN</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(`${registrationData.totalAmount.toFixed(2)}`, 'Kwota')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Important info */}
                <div className="pt-4 border-t border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-2 text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Ważne informacje</h4>
                      <ul className="text-xs space-y-1 list-disc list-inside">
                        <li>Wpłać dokładną kwotę na podane konto</li>
                        <li>Użyj podanego tytułu przelewu</li>
                        <li>Twoja rejestracja zostanie potwierdzona po zaksięgowaniu wpłaty</li>
                        <li>Status płatności możesz sprawdzić w panelu uczestnika</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Email Confirmation Notice */}
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-5 w-5 flex-shrink-0" />
                <p>
                  Na podany adres email wysłaliśmy potwierdzenie rejestracji
                  {isBankTransfer && ' z danymi do przelewu'}.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1">
              <Link to={`/events/${slug}`}>Zobacz wydarzenie</Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link to="/participant/registrations">Moje rejestracje</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RegistrationSuccessPage;
