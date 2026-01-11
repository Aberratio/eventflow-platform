import { Link } from 'react-router-dom';
import { CheckCircle, Package, CreditCard, ShoppingBag } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';

const OrderSuccessPage = () => {
  const { lastOrder } = useCart();

  if (!lastOrder) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Brak danych zamówienia</h1>
            <p className="text-muted-foreground">
              Nie znaleźliśmy zamówienia do wyświetlenia.
            </p>
            <Button asChild>
              <Link to="/shop">Przejdź do sklepu</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Zamówienie złożone!</h1>
            <p className="text-muted-foreground">
              Numer zamówienia: <span className="font-mono font-semibold text-foreground">{lastOrder.orderNumber}</span>
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-card rounded-lg border p-6 space-y-6">
            {/* Ordered Items */}
            <div>
              <h2 className="font-semibold mb-4">Szczegóły zamówienia</h2>
              <div className="space-y-3">
                {lastOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div>
                      <span>{item.productName}</span>
                      {(item.size || item.color) && (
                        <span className="text-muted-foreground">
                          {' '}({[item.size, item.color].filter(Boolean).join(', ')})
                        </span>
                      )}
                      <span className="text-muted-foreground"> x{item.quantity}</span>
                    </div>
                    <span className="font-medium">{(item.price * item.quantity).toFixed(2)} zł</span>
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Produkty</span>
                  <span>{lastOrder.productTotal.toFixed(2)} zł</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dostawa ({lastOrder.deliveryMethod.name})</span>
                  <span>{lastOrder.deliveryPrice === 0 ? 'Gratis' : `${lastOrder.deliveryPrice.toFixed(2)} zł`}</span>
                </div>
                {lastOrder.paymentSurcharge > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dopłata za płatność</span>
                    <span>{lastOrder.paymentSurcharge.toFixed(2)} zł</span>
                  </div>
                )}
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between font-semibold text-lg">
                <span>Razem</span>
                <span>{lastOrder.totalPrice.toFixed(2)} zł</span>
              </div>
            </div>

            <Separator />

            {/* Delivery & Payment Info */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Szacowana dostawa</h3>
                  <p className="text-sm text-muted-foreground">{lastOrder.estimatedDelivery}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Metoda płatności</h3>
                  <p className="text-sm text-muted-foreground">{lastOrder.paymentMethod.name}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Email Confirmation Notice */}
            <p className="text-sm text-muted-foreground text-center">
              Na podany adres email wysłaliśmy potwierdzenie zamówienia ze szczegółami i linkiem do śledzenia.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1">
                <Link to="/shop">Kontynuuj zakupy</Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link to="/participant">Moje zamówienia</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderSuccessPage;
