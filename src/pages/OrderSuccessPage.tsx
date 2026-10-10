import { Link } from 'react-router-dom';
import {
  CheckCircle,
  Package,
  CreditCard,
  ShoppingBag,
  PartyPopper,
  Mail,
  ArrowRight,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHero } from '@/components/ui/page-hero';
import { InfoBanner } from '@/components/ui/info-banner';
import { useCart } from '@/contexts/CartContext';
import { formatMoney } from '@/lib/format';

const OrderSuccessPage = () => {
  const { lastOrder } = useCart();

  if (!lastOrder) {
    return (
      <Layout>
        <div className="container py-12">
          <EmptyState
            icon={<ShoppingBag className="h-12 w-12 text-muted-foreground" />}
            title="Brak danych zamówienia"
            subtitle="Nie znaleźliśmy zamówienia do wyświetlenia."
            actionLabel="Przejdź do sklepu"
            actionHref="/shop"
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Success Hero */}
      <PageHero
        borderless={false}
        className="border-b"
        style={{
          background:
            'linear-gradient(to bottom right, hsl(var(--success) / 0.1), hsl(var(--primary) / 0.05), hsl(var(--warning) / 0.05))',
        }}
      >
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-success/15 ring-4 ring-success/10">
            <CheckCircle className="h-12 w-12 text-success" />
          </div>
          <div className="mb-2 flex items-center justify-center gap-2">
            <PartyPopper className="h-5 w-5 text-warning" />
            <h1 className="text-2xl font-bold">Zamówienie złożone!</h1>
            <PartyPopper className="h-5 w-5 text-warning" />
          </div>
          <p className="text-muted-foreground">
            Numer zamówienia:{' '}
            <Badge variant="secondary" className="ml-1 px-3 py-1 font-mono text-sm">
              {lastOrder.orderNumber}
            </Badge>
          </p>
        </div>
      </PageHero>

      <div className="container py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Order Details Card */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="border-b px-6 py-4" style={{ background: 'var(--gradient-page-hero)' }}>
              <h2 className="font-bold">Szczegóły zamówienia</h2>
            </div>

            <div className="space-y-4 p-6">
              <div className="space-y-3">
                {lastOrder.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between rounded-lg bg-muted/30 p-3 text-sm"
                  >
                    <div>
                      <span className="font-medium">{item.productName}</span>
                      {(item.size || item.color) && (
                        <div className="mt-1 flex gap-1.5">
                          {item.size && (
                            <Badge variant="secondary" className="text-xs font-normal">
                              {item.size}
                            </Badge>
                          )}
                          {item.color && (
                            <Badge variant="secondary" className="text-xs font-normal">
                              {item.color}
                            </Badge>
                          )}
                        </div>
                      )}
                      <span className="text-muted-foreground"> × {item.quantity}</span>
                    </div>
                    <span className="whitespace-nowrap font-semibold">
                      {formatMoney(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Produkty</span>
                  <span>{formatMoney(lastOrder.productTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Dostawa ({lastOrder.deliveryMethod.name})
                  </span>
                  <span className={lastOrder.deliveryPrice === 0 ? 'font-medium text-success' : ''}>
                    {lastOrder.deliveryPrice === 0
                      ? 'Gratis'
                      : formatMoney(lastOrder.deliveryPrice)}
                  </span>
                </div>
                {lastOrder.paymentSurcharge > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dopłata za płatność</span>
                    <span>{formatMoney(lastOrder.paymentSurcharge)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border border-primary/10 bg-primary/5 p-3">
                <span className="font-bold">Razem</span>
                <span className="text-xl font-bold text-primary">
                  {formatMoney(lastOrder.totalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery & Payment Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">Szacowana dostawa</h3>
                  <p className="text-sm text-muted-foreground">{lastOrder.estimatedDelivery}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                  <CreditCard className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">Metoda płatności</h3>
                  <p className="text-sm text-muted-foreground">{lastOrder.paymentMethod.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* E5.3: shipping address, only present for courier/paczkomat orders */}
          {lastOrder.shippingAddress && (
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-0.5 text-sm">
                  <h3 className="mb-1 font-semibold">Adres dostawy</h3>
                  <p>{lastOrder.shippingAddress.fullName}</p>
                  <p>{lastOrder.shippingAddress.street}</p>
                  <p>
                    {lastOrder.shippingAddress.postalCode} {lastOrder.shippingAddress.city}
                  </p>
                  {lastOrder.shippingAddress.phone && (
                    <p className="text-muted-foreground">Tel: {lastOrder.shippingAddress.phone}</p>
                  )}
                  {lastOrder.shippingAddress.paczkomatId && (
                    <p className="text-muted-foreground">
                      Paczkomat:{' '}
                      <span className="font-mono">{lastOrder.shippingAddress.paczkomatId}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PP.105: an organizer package is granted only after the payment is confirmed */}
          {lastOrder.includesOrganizerPackage && (
            <InfoBanner
              icon={
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                  <CreditCard className="h-5 w-5 text-warning" />
                </div>
              }
            >
              Pakiet organizatora aktywuje się po potwierdzeniu płatności. Do tego czasu nie
              otrzymasz roli Organizatora ani możliwości tworzenia wydarzeń. Po aktywacji zostaniesz
              wylogowany/a i wystarczy zalogować się ponownie.
            </InfoBanner>
          )}

          {/* Email Confirmation Notice */}
          <InfoBanner
            icon={
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
            }
          >
            Na podany adres email wysłaliśmy potwierdzenie zamówienia ze szczegółami i linkiem do
            śledzenia.
          </InfoBanner>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="flex-1">
              <Link to="/shop">
                Kontynuuj zakupy
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="flex-1">
              <Link to="/participant?tab=orders">Moje zamówienia</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderSuccessPage;
