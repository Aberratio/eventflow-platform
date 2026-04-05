import { Link } from 'react-router-dom';
import { CheckCircle, Package, CreditCard, ShoppingBag, PartyPopper, Mail, ArrowRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';

const OrderSuccessPage = () => {
  const { lastOrder } = useCart();

  if (!lastOrder) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/10 to-warning/10 flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Brak danych zamówienia</h1>
            <p className="text-muted-foreground">
              Nie znaleźliśmy zamówienia do wyświetlenia.
            </p>
            <Button asChild size="lg">
              <Link to="/shop">Przejdź do sklepu</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Success Hero */}
      <div className="bg-gradient-to-br from-success/10 via-primary/5 to-warning/5 border-b">
        <div className="container py-10">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-success/15 flex items-center justify-center mb-5 ring-4 ring-success/10">
              <CheckCircle className="h-12 w-12 text-success" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <PartyPopper className="h-5 w-5 text-warning" />
              <h1 className="text-2xl font-bold">Zamówienie złożone!</h1>
              <PartyPopper className="h-5 w-5 text-warning" />
            </div>
            <p className="text-muted-foreground">
              Numer zamówienia: <Badge variant="secondary" className="ml-1 font-mono text-sm px-3 py-1">{lastOrder.orderNumber}</Badge>
            </p>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Order Details Card */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-warning/5 px-6 py-4 border-b">
              <h2 className="font-bold">Szczegóły zamówienia</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                {lastOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm p-3 rounded-lg bg-muted/30">
                    <div>
                      <span className="font-medium">{item.productName}</span>
                      {(item.size || item.color) && (
                        <div className="flex gap-1.5 mt-1">
                          {item.size && <Badge variant="secondary" className="text-xs font-normal">{item.size}</Badge>}
                          {item.color && <Badge variant="secondary" className="text-xs font-normal">{item.color}</Badge>}
                        </div>
                      )}
                      <span className="text-muted-foreground"> × {item.quantity}</span>
                    </div>
                    <span className="font-semibold whitespace-nowrap">{(item.price * item.quantity).toFixed(2)} zł</span>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Produkty</span>
                  <span>{lastOrder.productTotal.toFixed(2)} zł</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dostawa ({lastOrder.deliveryMethod.name})</span>
                  <span className={lastOrder.deliveryPrice === 0 ? 'text-success font-medium' : ''}>
                    {lastOrder.deliveryPrice === 0 ? 'Gratis' : `${lastOrder.deliveryPrice.toFixed(2)} zł`}
                  </span>
                </div>
                {lastOrder.paymentSurcharge > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dopłata za płatność</span>
                    <span>{lastOrder.paymentSurcharge.toFixed(2)} zł</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                <span className="font-bold">Razem</span>
                <span className="text-xl font-bold text-primary">{lastOrder.totalPrice.toFixed(2)} zł</span>
              </div>
            </div>
          </div>

          {/* Delivery & Payment Info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border shadow-sm p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Szacowana dostawa</h3>
                  <p className="text-sm text-muted-foreground">{lastOrder.estimatedDelivery}</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border shadow-sm p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                  <CreditCard className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Metoda płatności</h3>
                  <p className="text-sm text-muted-foreground">{lastOrder.paymentMethod.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Email Confirmation Notice */}
          <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl p-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Na podany adres email wysłaliśmy potwierdzenie zamówienia ze szczegółami i linkiem do śledzenia.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="flex-1">
              <Link to="/shop">
                Kontynuuj zakupy
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="flex-1">
              <Link to="/participant">Moje zamówienia</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderSuccessPage;
