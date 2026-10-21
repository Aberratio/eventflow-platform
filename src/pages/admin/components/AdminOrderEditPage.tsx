import { getUserById, getOrders } from '@/api';
import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Trash2,
  Plus,
  Package,
  FileText,
  MessageSquare,
  Truck,
  CreditCard,
  Clock,
} from 'lucide-react';
import { ShopOrder, OrderHistoryEntry } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { OrderHistoryTimeline } from '@/components/admin/OrderHistoryTimeline';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { formatMoney } from '@/lib/format';
import { toast } from 'sonner';
import { appLogger } from '@/lib/logger';

const statusLabels: Record<ShopOrder['status'], string> = {
  pending: 'Oczekujące',
  paid: 'Opłacone',
  shipped: 'Wysłane',
  delivered: 'Dostarczone',
  cancelled: 'Anulowane',
  refunded: 'Zwrócone',
};

const statusColors: Record<ShopOrder['status'], string> = {
  pending: 'bg-warning/20 text-warning border-warning',
  paid: 'bg-primary/20 text-primary border-primary',
  shipped: 'bg-accent/20 text-accent-foreground border-accent',
  delivered: 'bg-success/20 text-success border-success',
  cancelled: 'bg-destructive/20 text-destructive border-destructive',
  refunded: 'bg-muted text-muted-foreground border-muted-foreground',
};

export const AdminOrderEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: ordersResp } = useQuery({
    queryKey: ['shop-orders'],
    queryFn: () => getOrders(),
    select: (r) => r.data ?? [],
  });
  const originalOrder = (ordersResp ?? []).find((o) => o.id === id) ?? null;

  const { data: customerResponse } = useQuery({
    queryKey: ['users', originalOrder?.userId],
    queryFn: () => getUserById(originalOrder?.userId ?? ''),
    enabled: Boolean(originalOrder?.userId),
  });
  const customer = customerResponse?.data ?? null;

  const [items, setItems] = useState(() => (originalOrder ? [...originalOrder.items] : []));
  const [status, setStatus] = useState<ShopOrder['status']>(
    () => originalOrder?.status || 'pending',
  );
  const [trackingNumber, setTrackingNumber] = useState(() => originalOrder?.trackingNumber || '');
  const [adminNotes, setAdminNotes] = useState(() => originalOrder?.adminNotes || '');
  const [cancelReason, setCancelReason] = useState(() => originalOrder?.cancelReason || '');
  const [priceAdjustment, setPriceAdjustment] = useState(() => originalOrder?.priceAdjustment || 0);
  const [history, setHistory] = useState<OrderHistoryEntry[]>(() => originalOrder?.history || []);

  const { user } = useAuth();

  const productTotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );
  const totalPrice = useMemo(
    () =>
      productTotal +
      (originalOrder?.deliveryPrice || 0) +
      (originalOrder?.paymentSurcharge || 0) +
      priceAdjustment,
    [productTotal, originalOrder?.deliveryPrice, originalOrder?.paymentSurcharge, priceAdjustment],
  );

  if (!originalOrder) {
    return (
      <Layout>
        <div className="container py-8">
          <p className="text-muted-foreground">Zamówienie nie zostało znalezione.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/admin')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Powrót
          </Button>
        </div>
      </Layout>
    );
  }

  const updateItemQuantity = (idx: number, qty: number) => {
    if (qty < 0) return;
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, quantity: Math.max(0, qty) } : item)),
    );
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: '',
        productName: 'Nowy produkt',
        quantity: 1,
        price: 0,
      },
    ]);
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    const userName = user?.name || 'Admin';
    const userId = user?.id || 'unknown';
    const newEntries: OrderHistoryEntry[] = [];
    let counter = 0;
    const makeId = () => `h-new-${Date.now()}-${counter++}`;

    if (status !== originalOrder.status) {
      newEntries.push({
        id: makeId(),
        orderId: originalOrder.id,
        timestamp: now,
        userId,
        userName,
        action: 'status_change',
        description: `Status zmieniony z ${statusLabels[originalOrder.status]} na ${statusLabels[status]}`,
        previousValue: originalOrder.status,
        newValue: status,
      });
    }

    const itemsChanged = JSON.stringify(items) !== JSON.stringify(originalOrder.items);
    if (itemsChanged) {
      newEntries.push({
        id: makeId(),
        orderId: originalOrder.id,
        timestamp: now,
        userId,
        userName,
        action: 'items_edited',
        description: 'Zmieniono pozycje zamówienia',
      });
    }

    if (priceAdjustment !== (originalOrder.priceAdjustment || 0)) {
      newEntries.push({
        id: makeId(),
        orderId: originalOrder.id,
        timestamp: now,
        userId,
        userName,
        action: 'price_adjustment',
        description: `Zastosowano korektę cenową: ${formatMoney(priceAdjustment)}`,
        newValue: priceAdjustment.toString(),
      });
    }

    if (trackingNumber !== (originalOrder.trackingNumber || '')) {
      newEntries.push({
        id: makeId(),
        orderId: originalOrder.id,
        timestamp: now,
        userId,
        userName,
        action: 'tracking_updated',
        description: `Zaktualizowano numer przesyłki: ${trackingNumber}`,
        newValue: trackingNumber,
      });
    }

    if (adminNotes !== (originalOrder.adminNotes || '')) {
      newEntries.push({
        id: makeId(),
        orderId: originalOrder.id,
        timestamp: now,
        userId,
        userName,
        action: 'notes_updated',
        description: 'Zaktualizowano notatkę admina',
      });
    }

    if (cancelReason !== (originalOrder.cancelReason || '')) {
      newEntries.push({
        id: makeId(),
        orderId: originalOrder.id,
        timestamp: now,
        userId,
        userName,
        action: 'cancel_reason',
        description: 'Dodano powód anulowania/zwrotu',
      });
    }

    if (newEntries.length > 0) {
      setHistory((prev) => [...prev, ...newEntries]);
    }

    appLogger.log(
      'audit',
      'shop',
      'order_edit',
      `Zaktualizowano zamówienie ${originalOrder.orderNumber}`,
      {
        targetType: 'order',
        targetId: originalOrder.id,
        targetName: originalOrder.orderNumber,
        metadata: { changesCount: newEntries.length, newStatus: status },
      },
    );
    toast.success('Zamówienie zostało zaktualizowane');
    navigate(-1);
  };

  return (
    <Layout>
      <div className="container max-w-4xl py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Wstecz">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold">
                {originalOrder.orderNumber}
                <Badge variant="outline" className={statusColors[status]}>
                  {statusLabels[status]}
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(originalOrder.createdAt), 'd MMMM yyyy, HH:mm', { locale: pl })}
              </p>
            </div>
          </div>
          <Button onClick={handleSave}>Zapisz zmiany</Button>
        </div>

        <div className="space-y-6">
          {/* Customer & shipping info */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4" /> Klient
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-medium">{customer?.name || 'Nieznany'}</p>
                <p className="text-muted-foreground">{customer?.email}</p>
              </CardContent>
            </Card>

            {originalOrder.shippingAddress && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Truck className="h-4 w-4" /> Adres dostawy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0.5 text-sm">
                  <p>{originalOrder.shippingAddress.fullName}</p>
                  <p>{originalOrder.shippingAddress.street}</p>
                  <p>
                    {originalOrder.shippingAddress.postalCode} {originalOrder.shippingAddress.city}
                  </p>
                  {originalOrder.shippingAddress.phone && (
                    <p>Tel: {originalOrder.shippingAddress.phone}</p>
                  )}
                  {originalOrder.shippingAddress.paczkomatId && (
                    <p>
                      Paczkomat:{' '}
                      <span className="font-mono">{originalOrder.shippingAddress.paczkomatId}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {originalOrder.invoiceData && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4" /> Dane do faktury
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0.5 text-sm">
                  <p>{originalOrder.invoiceData.companyName}</p>
                  <p>NIP: {originalOrder.invoiceData.nip}</p>
                  <p>{originalOrder.invoiceData.street}</p>
                  <p>
                    {originalOrder.invoiceData.postalCode} {originalOrder.invoiceData.city}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {originalOrder.customerNotes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4" /> Notatki klienta
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">{originalOrder.customerNotes}</CardContent>
            </Card>
          )}

          {/* Editable items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Produkty w zamówieniu</CardTitle>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-1 h-4 w-4" /> Dodaj pozycję
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produkt</TableHead>
                      <TableHead className="w-20">Rozmiar</TableHead>
                      <TableHead className="w-20">Kolor</TableHead>
                      <TableHead className="w-24 text-center">Ilość</TableHead>
                      <TableHead className="w-28 text-right">Cena jedn.</TableHead>
                      <TableHead className="w-28 text-right">Suma</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.size || '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.color || '—'}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(idx, parseInt(e.target.value) || 0)}
                            className="mx-auto w-20 text-center"
                          />
                        </TableCell>
                        <TableCell className="text-right">{formatMoney(item.price)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMoney(item.price * item.quantity)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => removeItem(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                          Brak produktów w zamówieniu
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Shop operations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Operacje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">Status zamówienia</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as ShopOrder['status'])}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tracking">Numer przesyłki</Label>
                  <Input
                    id="tracking"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Wprowadź numer przesyłki..."
                  />
                </div>
              </div>

              {(status === 'cancelled' || status === 'refunded') && (
                <div className="space-y-2">
                  <Label htmlFor="cancelReason">Powód anulowania / zwrotu</Label>
                  <Textarea
                    id="cancelReason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Opisz powód..."
                    rows={2}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="adminNotes">Notatka admina (wewnętrzna)</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="np. Klient prosił o zamianę rozmiaru..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4" /> Podsumowanie finansowe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Produkty</span>
                <span>{formatMoney(productTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Dostawa ({originalOrder.deliveryMethod.name})</span>
                <span>{formatMoney(originalOrder.deliveryPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Dopłata za płatność ({originalOrder.paymentMethod.name})</span>
                <span>{formatMoney(originalOrder.paymentSurcharge)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <Label htmlFor="adjustment" className="text-sm font-normal">
                  Korekta ręczna
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="adjustment"
                    type="number"
                    step="0.01"
                    value={priceAdjustment}
                    onChange={(e) => setPriceAdjustment(parseFloat(e.target.value) || 0)}
                    className="w-28 text-right"
                  />
                  <span className="text-sm">zł</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>SUMA</span>
                <span>{formatMoney(totalPrice)}</span>
              </div>
            </CardContent>
          </Card>

          {/* History placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" /> Historia zmian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderHistoryTimeline entries={history} />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
