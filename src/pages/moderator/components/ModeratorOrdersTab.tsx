import { getUsers, getOrders, updateOrderStatus } from '@/api';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ShopOrder } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { toast } from 'sonner';
import { Search, Eye, ShoppingCart, Lock, Package, Truck, CheckCircle } from 'lucide-react';

const orderStatusLabels: Record<ShopOrder['status'], string> = {
  pending: 'Oczekujące',
  paid: 'Opłacone',
  shipped: 'Wysłane',
  delivered: 'Dostarczone',
  cancelled: 'Anulowane',
  refunded: 'Zwrócone',
};

const orderStatusColors: Record<ShopOrder['status'], string> = {
  pending: 'bg-warning/20 text-warning-foreground border-warning',
  paid: 'bg-primary/20 text-primary border-primary',
  shipped: 'bg-accent/20 text-accent-foreground border-accent',
  delivered: 'bg-success/20 text-success border-success',
  cancelled: 'bg-destructive/20 text-destructive border-destructive',
  refunded: 'bg-muted text-muted-foreground border-muted-foreground',
};

// Only allow forward status changes (no cancellation)
const allowedStatusTransitions: Record<ShopOrder['status'], ShopOrder['status'][]> = {
  pending: ['paid'],
  paid: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  refunded: [],
};

export const ModeratorOrdersTab = () => {
  const queryClient = useQueryClient();
  const { data: ordersResp } = useQuery({
    queryKey: ['shop-orders'],
    queryFn: () => getOrders(),
    select: (r) => r.data ?? [],
  });
  const orders = ordersResp ?? [];
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState<ShopOrder['status'] | 'all'>('all');
  const [viewingOrder, setViewingOrder] = useState<ShopOrder | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [orderNewStatus, setOrderNewStatus] = useState<ShopOrder['status']>('pending');
  const [orderTrackingNumber, setOrderTrackingNumber] = useState('');
  const { data: usersResponse } = useQuery({
    queryKey: ['users', 'moderator-order-customers'],
    queryFn: () => getUsers({ pageSize: 1000 }),
  });
  const users = usersResponse?.data ?? [];

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      trackingNumber,
    }: {
      id: string;
      status: ShopOrder['status'];
      trackingNumber?: string;
    }) => updateOrderStatus(id, status, trackingNumber),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shop-orders'] }),
  });

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const user = users.find((u) => u.id === order.userId);
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
        user?.name.toLowerCase().includes(orderSearch.toLowerCase());
      const matchesStatus = orderStatus === 'all' || order.status === orderStatus;
      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearch, orderStatus, users]);

  const getCustomerName = (userId: string) => {
    return users.find((u) => u.id === userId)?.name || 'Nieznany klient';
  };

  const handleViewOrder = (order: ShopOrder) => {
    setViewingOrder(order);
    setOrderNewStatus(order.status);
    setOrderTrackingNumber(order.trackingNumber || '');
    setIsOrderDialogOpen(true);
  };

  const handleSaveOrder = () => {
    if (!viewingOrder) return;
    statusMutation.mutate(
      {
        id: viewingOrder.id,
        status: orderNewStatus,
        trackingNumber: orderNewStatus === 'shipped' ? orderTrackingNumber : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Status zamówienia został zaktualizowany');
          setIsOrderDialogOpen(false);
        },
        // PP.105: the server validates the move (404 / 409 / 422 with a Polish message): show it as is.
        onError: (error) => {
          toast.error(
            error instanceof Error && error.message
              ? error.message
              : 'Nie udało się zmienić statusu zamówienia',
          );
        },
      },
    );
  };

  const getStatusIcon = (status: ShopOrder['status']) => {
    switch (status) {
      case 'pending':
        return <ShoppingCart className="h-4 w-4" />;
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <Package className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <Alert className="border-muted bg-muted/50">
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Możesz tylko aktualizować statusy zamówień. Nie widzisz szczegółów finansowych ani nie
          możesz anulować zamówień.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 sm:flex-row">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Zamówienia ({filteredOrders.length})
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Szukaj..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={orderStatus}
                onValueChange={(v) => setOrderStatus(v as ShopOrder['status'] | 'all')}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  {Object.entries(orderStatusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nr zamówienia</TableHead>
                  <TableHead>Klient</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Produkty</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-24">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                    <TableCell>
                      <p className="font-medium">{getCustomerName(order.userId)}</p>
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.createdAt), 'd MMM yyyy', { locale: pl })}
                    </TableCell>
                    <TableCell>
                      {order.items.length} {order.items.length === 1 ? 'produkt' : 'produktów'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={orderStatusColors[order.status]}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{orderStatusLabels[order.status]}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleViewOrder(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredOrders.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">Nie znaleziono zamówień</p>
          )}
        </CardContent>
      </Card>

      {/* Order Status Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zamówienie {viewingOrder?.orderNumber}</DialogTitle>
          </DialogHeader>

          {viewingOrder && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p>
                  <strong>Klient:</strong> {getCustomerName(viewingOrder.userId)}
                </p>
                <p>
                  <strong>Data:</strong>{' '}
                  {format(new Date(viewingOrder.createdAt), 'd MMMM yyyy, HH:mm', { locale: pl })}
                </p>
                <p>
                  <strong>Produkty:</strong> {viewingOrder.items.length}
                </p>
              </div>

              <div className="border-t pt-4">
                <Label>Zmień status</Label>
                <Select
                  value={orderNewStatus}
                  onValueChange={(v) => setOrderNewStatus(v as ShopOrder['status'])}
                  disabled={allowedStatusTransitions[viewingOrder.status].length === 0}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={viewingOrder.status}>
                      {orderStatusLabels[viewingOrder.status]} (obecny)
                    </SelectItem>
                    {allowedStatusTransitions[viewingOrder.status].map((status) => (
                      <SelectItem key={status} value={status}>
                        {orderStatusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {orderNewStatus === 'shipped' && viewingOrder.status !== 'shipped' && (
                  <div className="mt-4">
                    <Label>Numer przesyłki</Label>
                    <Input
                      value={orderTrackingNumber}
                      onChange={(e) => setOrderTrackingNumber(e.target.value)}
                      placeholder="Wprowadź numer śledzenia..."
                      className="mt-1"
                    />
                  </div>
                )}

                {allowedStatusTransitions[viewingOrder.status].length === 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    To zamówienie nie może być już zmienione.
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
              Anuluj
            </Button>
            <Button
              onClick={handleSaveOrder}
              disabled={!viewingOrder || orderNewStatus === viewingOrder.status}
            >
              Zapisz zmiany
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
