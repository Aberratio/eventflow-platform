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
  FileText,
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
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CartItemCard } from '@/components/cart/CartItemCard';
import { formatMoney } from '@/lib/format';
import { OrderSummary } from '@/components/cart/OrderSummary';
import { OrderDetails, ShopOrderAddress, ShopOrderInvoice } from '@/types';

const paymentIcons: Record<string, React.ReactNode> = {
  card: <CreditCard className="h-4 w-4" />,
  blik: <Smartphone className="h-4 w-4" />,
  transfer: <Building className="h-4 w-4" />,
  cod: <Banknote className="h-4 w-4" />,
};

// Courier and paczkomat are the two delivery methods that ship to a
// physical address `pickup` (Biuro Zawodow) and
// any future digital/service-only checkout never need one — this list is
// the client-side mirror of OrderRepository::DELIVERY_METHODS_REQUIRING_ADDRESS
// on the server, which is the actual source of truth; this copy only drives
// UX (which fields to show, when to disable checkout early).
const DELIVERY_METHODS_REQUIRING_ADDRESS = ['courier', 'paczkomat'];
const POSTAL_CODE_PATTERN = /^\d{2}-\d{3}$/;

type AddressFormState = {
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  phone: string;
  paczkomatId: string;
};

const emptyAddress: AddressFormState = {
  fullName: '',
  street: '',
  city: '',
  postalCode: '',
  phone: '',
  paczkomatId: '',
};

// WCAG fix (SC 3.3.1 Error Identification / 3.3.3 Error Suggestion):
// the disabled-until-valid submit button gave no visible or accessible
// reason why checkout wouldn't proceed. These are the per-field error
// messages shown once a field has been touched (or submit was attempted),
// wired via aria-invalid/aria-describedby on the corresponding input.
type AddressFieldErrors = Partial<Record<keyof AddressFormState, string>>;

const getAddressFieldErrors = (
  address: AddressFormState,
  requiresPaczkomatId: boolean,
): AddressFieldErrors => {
  const errors: AddressFieldErrors = {};

  if (address.fullName.trim() === '') {
    errors.fullName = 'Podaj imię i nazwisko.';
  }
  if (address.street.trim() === '') {
    errors.street = 'Podaj ulicę i numer domu/mieszkania.';
  }
  if (address.city.trim() === '') {
    errors.city = 'Podaj miejscowość.';
  }
  const postalCode = address.postalCode.trim();
  if (postalCode === '') {
    errors.postalCode = 'Podaj kod pocztowy.';
  } else if (!POSTAL_CODE_PATTERN.test(postalCode)) {
    errors.postalCode = 'Nieprawidłowy format. Użyj formatu NN-NNN, np. 00-001.';
  }
  if (requiresPaczkomatId && address.paczkomatId.trim() === '') {
    errors.paczkomatId = 'Podaj numer paczkomatu.';
  }

  return errors;
};

// "Dane do faktury przy zamówieniu" ("dane
// adresowe, faktura z NIP") is part of the minimal
// required shop scope. This is data capture only, mirroring the shipping
// address block above: same fieldset/legend grouping, same per-field
// visible-error-after-blur pattern, same aria-invalid/aria-describedby
// wiring. Sending invoiceData at all is itself the "chcę fakturę" signal on
// the wire — when the toggle is off nothing here is required or sent.
type InvoiceFormState = {
  companyName: string;
  nip: string;
  street: string;
  city: string;
  postalCode: string;
};

const emptyInvoice: InvoiceFormState = {
  companyName: '',
  nip: '',
  street: '',
  city: '',
  postalCode: '',
};

// Mirrors the server's validateNip() format check (OrderRepository::validateNip,
// 10 digits, dashes/spaces allowed in the submitted form. The
// server additionally verifies the checksum; this client-side check only
// covers digit count/format, which is enough for early UX feedback.
const NIP_DIGITS_PATTERN = /^\d{10}$/;

type InvoiceFieldErrors = Partial<Record<keyof InvoiceFormState, string>>;

const getInvoiceFieldErrors = (invoice: InvoiceFormState): InvoiceFieldErrors => {
  const errors: InvoiceFieldErrors = {};

  if (invoice.companyName.trim() === '') {
    errors.companyName = 'Podaj nazwę firmy.';
  }
  const nipDigits = invoice.nip.replace(/[\s-]/g, '');
  if (nipDigits === '') {
    errors.nip = 'Podaj NIP.';
  } else if (!NIP_DIGITS_PATTERN.test(nipDigits)) {
    errors.nip = 'NIP musi mieć 10 cyfr.';
  }
  if (invoice.street.trim() === '') {
    errors.street = 'Podaj ulicę i numer domu/mieszkania.';
  }
  if (invoice.city.trim() === '') {
    errors.city = 'Podaj miejscowość.';
  }
  const postalCode = invoice.postalCode.trim();
  if (postalCode === '') {
    errors.postalCode = 'Podaj kod pocztowy.';
  } else if (!POSTAL_CODE_PATTERN.test(postalCode)) {
    errors.postalCode = 'Nieprawidłowy format. Użyj formatu NN-NNN, np. 00-001.';
  }

  return errors;
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
  const { user, refreshUser } = useAuth();
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
  const [address, setAddress] = useState<AddressFormState>(emptyAddress);
  const [isProcessing, setIsProcessing] = useState(false);
  const [touchedAddressFields, setTouchedAddressFields] = useState<
    Partial<Record<keyof AddressFormState, boolean>>
  >({});
  const [addressSubmitAttempted, setAddressSubmitAttempted] = useState(false);

  const [wantsInvoice, setWantsInvoice] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceFormState>(emptyInvoice);
  const [touchedInvoiceFields, setTouchedInvoiceFields] = useState<
    Partial<Record<keyof InvoiceFormState, boolean>>
  >({});
  const [invoiceSubmitAttempted, setInvoiceSubmitAttempted] = useState(false);

  const updateAddressField =
    (field: keyof AddressFormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setAddress((prev) => ({ ...prev, [field]: e.target.value }));

  const markAddressFieldTouched = (field: keyof AddressFormState) => () =>
    setTouchedAddressFields((prev) => ({ ...prev, [field]: true }));

  const updateInvoiceField =
    (field: keyof InvoiceFormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setInvoice((prev) => ({ ...prev, [field]: e.target.value }));

  const markInvoiceFieldTouched = (field: keyof InvoiceFormState) => () =>
    setTouchedInvoiceFields((prev) => ({ ...prev, [field]: true }));

  const deliveryMethod = deliveryMethods.find((d) => d.id === selectedDelivery);
  const paymentMethod = paymentMethods.find((p) => p.id === selectedPayment);

  // A cart made entirely of digital products — e.g.
  // the "pakiet organizatora" — has no physical delivery step at all, and
  // must not force a delivery-method choice or an address. Mirrors the
  // server's OrderRepository::isDigitalOnlyCart() (same "every item is a
  // service product" rule); this is UX only, the server re-derives it from
  // the authoritative catalog regardless of what the client sends.
  const hasOnlyServices = items.length > 0 && items.every((item) => !!item.isService);

  const requiresShippingAddress = DELIVERY_METHODS_REQUIRING_ADDRESS.includes(selectedDelivery);
  const requiresPaczkomatId = selectedDelivery === 'paczkomat';
  // Mirrors the server's validateShippingAddress() for UX only — the
  // server is the source of truth and re-validates regardless of this.
  const addressFieldErrors = requiresShippingAddress
    ? getAddressFieldErrors(address, requiresPaczkomatId)
    : {};
  const isAddressValid = !requiresShippingAddress || Object.keys(addressFieldErrors).length === 0;
  const shouldShowAddressFieldError = (field: keyof AddressFormState) =>
    (touchedAddressFields[field] || addressSubmitAttempted) && !!addressFieldErrors[field];

  // Mirrors the server's validateInvoiceData()/validateNip() for UX
  // only — the server is the source of truth and re-validates regardless.
  const invoiceFieldErrors = wantsInvoice ? getInvoiceFieldErrors(invoice) : {};
  const isInvoiceValid = !wantsInvoice || Object.keys(invoiceFieldErrors).length === 0;
  const shouldShowInvoiceFieldError = (field: keyof InvoiceFormState) =>
    (touchedInvoiceFields[field] || invoiceSubmitAttempted) && !!invoiceFieldErrors[field];

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
    items.length > 0 &&
    (hasOnlyServices || !!selectedDelivery) &&
    !!selectedPayment &&
    !!user &&
    isAddressValid &&
    isInvoiceValid;

  const handleCheckout = async () => {
    if (!canCheckout || !effectiveDeliveryMethod || !paymentMethod || !user) {
      setAddressSubmitAttempted(true);
      setInvoiceSubmitAttempted(true);
      return;
    }

    const shippingAddress: ShopOrderAddress | undefined = requiresShippingAddress
      ? {
          fullName: address.fullName.trim(),
          street: address.street.trim(),
          city: address.city.trim(),
          postalCode: address.postalCode.trim(),
          ...(address.phone.trim() ? { phone: address.phone.trim() } : {}),
          ...(requiresPaczkomatId ? { paczkomatId: address.paczkomatId.trim() } : {}),
        }
      : undefined;

    const invoiceData: ShopOrderInvoice | undefined = wantsInvoice
      ? {
          companyName: invoice.companyName.trim(),
          nip: invoice.nip.trim(),
          street: invoice.street.trim(),
          city: invoice.city.trim(),
          postalCode: invoice.postalCode.trim(),
        }
      : undefined;

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
        shippingAddress,
        invoiceData,
      });

      const order = response.data;
      // A digital-only order's deliveryMethod comes back as an empty
      // object/array (OrderRepository persists the column's own '{}' default
      // — there is no delivery method at all), not a DeliveryMethod with an
      // estimatedDays string — guard with optional chaining instead of
      // assuming the field is always populated.
      const deliveryDaysMatch = order.deliveryMethod?.estimatedDays?.match(/\d+/);
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
        shippingAddress: order.shippingAddress,
        includesOrganizerPackage: items.some((item) => item.serviceKind === 'organizer_package'),
      };

      setLastOrder(orderDetails);
      clearCart();
      // An organizer-package order is created `pending` and grants nothing; the
      // Organizer role, credits and event slot arrive only when staff mark the order paid
      // (the server then ends the buyer's session, so they log in again). The refresh stays:
      // it is cheap, harmless for every order, and picks up any change already made server-side.
      void refreshUser();
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
            {formatMoney(totalPrice)}
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
                  {/* Same WCAG 1.3.1 gap for a grouped-choice
                      UI: a plain <span>/<Label> above a set of radios isn't
                      programmatically associated with the group. fieldset/
                      legend fixes it for courier/paczkomat/pickup here. */}
                  <fieldset>
                    <legend className="mb-5 flex items-center gap-3 font-semibold">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Truck className="h-5 w-5 text-primary" />
                      </div>
                      Wybierz metodę dostawy
                    </legend>

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
                                  {method.price === 0 ? 'Gratis' : formatMoney(method.price)}
                                </Badge>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </fieldset>

                  {/* Shipping address, only for courier/paczkomat — a
                      pickup-at-office or digital-only order never shows this. */}
                  {requiresShippingAddress && (
                    <div className="mt-6 space-y-4 border-t pt-6">
                      <h3 className="text-sm font-semibold">Adres dostawy</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label htmlFor="shipping-full-name">Imię i nazwisko</Label>
                          <Input
                            id="shipping-full-name"
                            value={address.fullName}
                            onChange={updateAddressField('fullName')}
                            onBlur={markAddressFieldTouched('fullName')}
                            autoComplete="name"
                            required
                            aria-invalid={shouldShowAddressFieldError('fullName') || undefined}
                            aria-describedby={
                              shouldShowAddressFieldError('fullName')
                                ? 'shipping-full-name-error'
                                : undefined
                            }
                          />
                          {shouldShowAddressFieldError('fullName') && (
                            <p
                              id="shipping-full-name-error"
                              role="alert"
                              className="text-sm text-destructive"
                            >
                              {addressFieldErrors.fullName}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label htmlFor="shipping-street">Ulica i numer</Label>
                          <Input
                            id="shipping-street"
                            value={address.street}
                            onChange={updateAddressField('street')}
                            onBlur={markAddressFieldTouched('street')}
                            autoComplete="street-address"
                            required
                            aria-invalid={shouldShowAddressFieldError('street') || undefined}
                            aria-describedby={
                              shouldShowAddressFieldError('street')
                                ? 'shipping-street-error'
                                : undefined
                            }
                          />
                          {shouldShowAddressFieldError('street') && (
                            <p
                              id="shipping-street-error"
                              role="alert"
                              className="text-sm text-destructive"
                            >
                              {addressFieldErrors.street}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="shipping-postal-code">Kod pocztowy</Label>
                          <Input
                            id="shipping-postal-code"
                            value={address.postalCode}
                            onChange={updateAddressField('postalCode')}
                            onBlur={markAddressFieldTouched('postalCode')}
                            placeholder="00-000"
                            autoComplete="postal-code"
                            required
                            aria-invalid={shouldShowAddressFieldError('postalCode') || undefined}
                            aria-describedby={
                              shouldShowAddressFieldError('postalCode')
                                ? 'shipping-postal-code-error'
                                : 'shipping-postal-code-hint'
                            }
                          />
                          {shouldShowAddressFieldError('postalCode') ? (
                            <p
                              id="shipping-postal-code-error"
                              role="alert"
                              className="text-sm text-destructive"
                            >
                              {addressFieldErrors.postalCode}
                            </p>
                          ) : (
                            <p
                              id="shipping-postal-code-hint"
                              className="text-sm text-muted-foreground"
                            >
                              Format: NN-NNN, np. 00-001.
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="shipping-city">Miejscowość</Label>
                          <Input
                            id="shipping-city"
                            value={address.city}
                            onChange={updateAddressField('city')}
                            onBlur={markAddressFieldTouched('city')}
                            autoComplete="address-level2"
                            required
                            aria-invalid={shouldShowAddressFieldError('city') || undefined}
                            aria-describedby={
                              shouldShowAddressFieldError('city')
                                ? 'shipping-city-error'
                                : undefined
                            }
                          />
                          {shouldShowAddressFieldError('city') && (
                            <p
                              id="shipping-city-error"
                              role="alert"
                              className="text-sm text-destructive"
                            >
                              {addressFieldErrors.city}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="shipping-phone">Telefon (opcjonalnie)</Label>
                          <Input
                            id="shipping-phone"
                            value={address.phone}
                            onChange={updateAddressField('phone')}
                            autoComplete="tel"
                          />
                        </div>
                        {requiresPaczkomatId && (
                          <div className="space-y-1.5">
                            <Label htmlFor="shipping-paczkomat-id">Numer paczkomatu</Label>
                            <Input
                              id="shipping-paczkomat-id"
                              value={address.paczkomatId}
                              onChange={updateAddressField('paczkomatId')}
                              onBlur={markAddressFieldTouched('paczkomatId')}
                              placeholder="np. WAW01A"
                              required
                              aria-invalid={shouldShowAddressFieldError('paczkomatId') || undefined}
                              aria-describedby={
                                shouldShowAddressFieldError('paczkomatId')
                                  ? 'shipping-paczkomat-id-error'
                                  : undefined
                              }
                            />
                            {shouldShowAddressFieldError('paczkomatId') && (
                              <p
                                id="shipping-paczkomat-id-error"
                                role="alert"
                                className="text-sm text-destructive"
                              >
                                {addressFieldErrors.paczkomatId}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
                                +{formatMoney(method.surcharge)}
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

            {/* Invoice Data */}
            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Faktura
              </h2>
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <fieldset>
                  <legend className="mb-5 flex items-center gap-3 font-semibold">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    Dane do faktury
                  </legend>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="wants-invoice"
                      checked={wantsInvoice}
                      onCheckedChange={(checked) => setWantsInvoice(checked === true)}
                      className="mt-1"
                    />
                    <Label htmlFor="wants-invoice" className="cursor-pointer">
                      Chcę fakturę (dane firmy)
                    </Label>
                  </div>

                  {wantsInvoice && (
                    <div className="mt-6 space-y-4 border-t pt-6">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label htmlFor="invoice-company-name">Nazwa firmy</Label>
                          <Input
                            id="invoice-company-name"
                            value={invoice.companyName}
                            onChange={updateInvoiceField('companyName')}
                            onBlur={markInvoiceFieldTouched('companyName')}
                            autoComplete="organization"
                            required
                            aria-invalid={shouldShowInvoiceFieldError('companyName') || undefined}
                            aria-describedby={
                              shouldShowInvoiceFieldError('companyName')
                                ? 'invoice-company-name-error'
                                : undefined
                            }
                          />
                          {shouldShowInvoiceFieldError('companyName') && (
                            <p
                              id="invoice-company-name-error"
                              role="alert"
                              className="text-sm text-destructive"
                            >
                              {invoiceFieldErrors.companyName}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label htmlFor="invoice-nip">NIP</Label>
                          <Input
                            id="invoice-nip"
                            value={invoice.nip}
                            onChange={updateInvoiceField('nip')}
                            onBlur={markInvoiceFieldTouched('nip')}
                            placeholder="000-000-00-00"
                            required
                            aria-invalid={shouldShowInvoiceFieldError('nip') || undefined}
                            aria-describedby={
                              shouldShowInvoiceFieldError('nip')
                                ? 'invoice-nip-error'
                                : 'invoice-nip-hint'
                            }
                          />
                          {shouldShowInvoiceFieldError('nip') ? (
                            <p
                              id="invoice-nip-error"
                              role="alert"
                              className="text-sm text-destructive"
                            >
                              {invoiceFieldErrors.nip}
                            </p>
                          ) : (
                            <p id="invoice-nip-hint" className="text-sm text-muted-foreground">
                              10 cyfr, z myślnikami lub bez, np. 000-000-00-00.
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label htmlFor="invoice-street">Ulica i numer</Label>
                          <Input
                            id="invoice-street"
                            value={invoice.street}
                            onChange={updateInvoiceField('street')}
                            onBlur={markInvoiceFieldTouched('street')}
                            autoComplete="street-address"
                            required
                            aria-invalid={shouldShowInvoiceFieldError('street') || undefined}
                            aria-describedby={
                              shouldShowInvoiceFieldError('street')
                                ? 'invoice-street-error'
                                : undefined
                            }
                          />
                          {shouldShowInvoiceFieldError('street') && (
                            <p
                              id="invoice-street-error"
                              role="alert"
                              className="text-sm text-destructive"
                            >
                              {invoiceFieldErrors.street}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="invoice-postal-code">Kod pocztowy</Label>
                          <Input
                            id="invoice-postal-code"
                            value={invoice.postalCode}
                            onChange={updateInvoiceField('postalCode')}
                            onBlur={markInvoiceFieldTouched('postalCode')}
                            placeholder="00-000"
                            autoComplete="postal-code"
                            required
                            aria-invalid={shouldShowInvoiceFieldError('postalCode') || undefined}
                            aria-describedby={
                              shouldShowInvoiceFieldError('postalCode')
                                ? 'invoice-postal-code-error'
                                : 'invoice-postal-code-hint'
                            }
                          />
                          {shouldShowInvoiceFieldError('postalCode') ? (
                            <p
                              id="invoice-postal-code-error"
                              role="alert"
                              className="text-sm text-destructive"
                            >
                              {invoiceFieldErrors.postalCode}
                            </p>
                          ) : (
                            <p
                              id="invoice-postal-code-hint"
                              className="text-sm text-muted-foreground"
                            >
                              Format: NN-NNN, np. 00-001.
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="invoice-city">Miejscowość</Label>
                          <Input
                            id="invoice-city"
                            value={invoice.city}
                            onChange={updateInvoiceField('city')}
                            onBlur={markInvoiceFieldTouched('city')}
                            autoComplete="address-level2"
                            required
                            aria-invalid={shouldShowInvoiceFieldError('city') || undefined}
                            aria-describedby={
                              shouldShowInvoiceFieldError('city') ? 'invoice-city-error' : undefined
                            }
                          />
                          {shouldShowInvoiceFieldError('city') && (
                            <p
                              id="invoice-city-error"
                              role="alert"
                              className="text-sm text-destructive"
                            >
                              {invoiceFieldErrors.city}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </fieldset>
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
