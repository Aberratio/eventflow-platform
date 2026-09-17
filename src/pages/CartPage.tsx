import { createOrder, getDeliveryMethods, getShopPaymentMethods } from '@/api';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingBag,
  Truck,
  CreditCard,
  Smartphone,
  Building,
  Banknote,
  Package,
  ShieldCheck,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { addDays, format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHero, PageHeroTitle } from '@/components/ui/page-hero';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CartItemCard } from '@/components/cart/CartItemCard';
import { OrderSummary } from '@/components/cart/OrderSummary';
import { OrderDetails } from '@/types';

const paymentIcons: Record<string, React.ReactNode> = {
  card: <CreditCard className="h-4 w-4" />,
  blik: <Smartphone className="h-4 w-4" />,
  transfer: <Building className="h-4 w-4" />,
  cod: <Banknote className="h-4 w-4" />,
};

const CartPage = () => {
  const {
    items,
    updateItemQuantity,
    removeItemByVariant,
    clearCart,
    totalPrice,
    totalItems,
    setLastOrder,
  } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: deliveryMethodsResp } = useQuery({
    queryKey: ['delivery-methods'],
    queryFn: getDeliveryMethods,
    staleTime: 10 * 60 * 1000,
    select: (r) => r.data ?? [],
  });

  const { data: paymentMethodsResp } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: getShopPaymentMethods,
    staleTime: 10 * 60 * 1000,
    select: (r) => r.data ?? [],
  });

  const deliveryMethods = deliveryMethodsResp ?? [];
  const paymentMethods = paymentMethodsResp ?? [];

  const [selectedDelivery, setSelectedDelivery] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const deliveryMethod = deliveryMethods.find((d) => d.id === selectedDelivery);
  const paymentMethod = paymentMethods.find((p) => p.id === selectedPayment);

  // Services have no physical delivery
  const hasOnlyServices = false;

  const deliveryPrice = hasOnlyServices ? 0 : deliveryMethod?.price || 0;
  const paymentSurcharge = paymentMethod?.surcharge || 0;
  const effectiveDeliveryMethod =
    deliveryMethod ??
    (hasOnlyServices
      ? {
          id: 'digital',
          name: 'Aktywacja cyfrowa',
          price: 0,
          estimatedDays: 'do 24h',
        }
      : undefined);

  const canCheckout =
    items.length > 0 && (hasOnlyServices || !!selectedDelivery) && !!selectedPayment && !!user;

  const handleCheckout = async () => {
    if (!canCheckout || !effectiveDeliveryMethod || !paymentMethod || !user) return;

    setIsProcessing(true);
    try {
      const response = await createOrder({
        userId: user.id,
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: item.unitPrice,
        })),
        deliveryMethod: effectiveDeliveryMethod,
        paymentMethod,
      });

      const order = response.data;
      const deliveryDaysMatch = order.deliveryMethod.estimatedDays.match(/\d+/);
      const maxDeliveryDays = deliveryDaysMatch ? parseInt(deliveryDaysMatch[0]) + 1 : 3;
      const estimatedDeliveryDate = addDays(new Date(order.createdAt), maxDeliveryDays);

      const orderDetails: OrderDetails = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        items: order.items,
        deliveryMethod: order.deliveryMethod,
        paymentMethod: order.paymentMethod,
        productTotal: order.productTotal,
        deliveryPrice: order.deliveryPrice,
        paymentSurcharge: order.paymentSurcharge,
        totalPrice: order.totalPrice,
        estimatedDelivery: format(estimatedDeliveryDate, 'd MMMM yyyy', { locale: pl }),
        createdAt: order.createdAt,
      };

      setLastOrder(orderDetails);
      clearCart();
      navigate('/order-success');
    } catch (error) {
      toast({
        title: 'Nie udało się złożyć zamówienia',
        description: error instanceof Error ? error.message : 'Spróbuj ponownie za chwilę.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-12">
          <EmptyState
            icon={<ShoppingBag className="h-12 w-12 text-muted-foreground" />}
            title="Twój koszyk jest pusty"
            subtitle="Dodaj produkty, aby kontynuować zakupy"
            actionLabel="Przejdź do sklepu"
            actionHref="/shop"
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHero>
        <div className="mb-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10">
            <Link to="/shop">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kontynuuj zakupy
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <PageHeroTitle
            icon={<ShoppingBag className="h-5 w-5" />}
            title="Koszyk"
            subtitle={`${totalItems} ${totalItems === 1 ? 'produkt' : totalItems < 5 ? 'produkty' : 'produktów'} w koszyku`}
          />
          <Badge
            variant="secondary"
            className="border-0 bg-primary/10 px-4 py-2 text-base text-primary"
          >
            {totalPrice.toFixed(2)} zł
          </Badge>
        </div>
      </PageHero>

      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Cart Items */}
            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Produkty
              </h2>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <CartItemCard
                    key={`${item.productId}-${item.size}-${item.color}-${index}`}
                    item={item}
                    onUpdateQuantity={(quantity) =>
                      updateItemQuantity(item.productId, quantity, item.size, item.color)
                    }
                    onRemove={() => removeItemByVariant(item.productId, item.size, item.color)}
                  />
                ))}
              </div>
            </div>

            {/* Delivery Options */}
            {!hasOnlyServices ? (
              <div>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Dostawa
                </h2>
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-semibold">Wybierz metodę dostawy</span>
                  </div>

                  <RadioGroup value={selectedDelivery} onValueChange={setSelectedDelivery}>
                    <div className="space-y-2">
                      {deliveryMethods.map((method) => (
                        <div
                          key={method.id}
                          className={`flex cursor-pointer items-start space-x-3 rounded-lg border p-3 transition-all ${
                            selectedDelivery === method.id
                              ? 'border-primary/50 bg-primary/5 shadow-sm'
                              : 'border-transparent hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedDelivery(method.id)}
                        >
                          <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
                          <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 font-medium">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                  {method.name}
                                </div>
                                <div className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {method.estimatedDays}
                                </div>
                              </div>
                              <Badge
                                variant={method.price === 0 ? 'default' : 'secondary'}
                                className={
                                  method.price === 0 ? 'border-0 bg-success/20 text-success' : ''
                                }
                              >
                                {method.price === 0 ? 'Gratis' : `${method.price.toFixed(2)} zł`}
                              </Badge>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="mb-1 font-semibold">Usługa cyfrowa</h2>
                    <p className="text-sm text-muted-foreground">
                      Twoje zamówienie zawiera wyłącznie usługi cyfrowe. Nie jest wymagana dostawa
                      fizyczna — otrzymasz dostęp do zakupionych usług na swoje konto.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Options */}
            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Płatność
              </h2>
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
                    <CreditCard className="h-5 w-5 text-warning" />
                  </div>
                  <span className="font-semibold">Wybierz metodę płatności</span>
                </div>

                <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
                  <div className="space-y-2">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`flex cursor-pointer items-start space-x-3 rounded-lg border p-3 transition-all ${
                          selectedPayment === method.id
                            ? 'border-primary/50 bg-primary/5 shadow-sm'
                            : 'border-transparent hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedPayment(method.id)}
                      >
                        <RadioGroupItem
                          value={method.id}
                          id={`payment-${method.id}`}
                          className="mt-1"
                        />
                        <Label htmlFor={`payment-${method.id}`} className="flex-1 cursor-pointer">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 font-medium">
                              <span className="text-muted-foreground">
                                {paymentIcons[method.id]}
                              </span>
                              {method.name}
                            </div>
                            {method.surcharge && method.surcharge > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                +{method.surcharge.toFixed(2)} zł
                              </Badge>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: ShieldCheck, label: 'Bezpieczne płatności', color: 'text-success' },
                { icon: RotateCcw, label: '14 dni na zwrot', color: 'text-primary' },
                { icon: Truck, label: 'Szybka wysyłka', color: 'text-warning' },
              ].map(({ icon: Icon, label, color }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-2 rounded-lg bg-muted/30 p-3 text-center"
                >
                  <Icon className={`h-5 w-5 ${color}`} />
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <OrderSummary
                productTotal={totalPrice}
                itemCount={totalItems}
                deliveryPrice={deliveryPrice}
                paymentSurcharge={paymentSurcharge}
                onCheckout={handleCheckout}
                isProcessing={isProcessing}
                canCheckout={canCheckout}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;
