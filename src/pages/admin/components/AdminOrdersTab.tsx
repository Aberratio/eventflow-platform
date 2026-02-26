import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search, Eye, Pencil, ShoppingCart, Package, Clock, Download, ArrowUpDown, ArrowUp, ArrowDown,
} from 'lucide-react';
import { mockShopOrders, mockUsers } from '@/data/mockData';
import { ShopOrder } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { toast } from 'sonner';
import { exportToCSV, exportToXML } from '@/lib/exportUtils';

const orderStatusLabels: Record<ShopOrder['status'], string> = {
  pending: 'Oczekujące',
  paid: 'Opłacone',
  shipped: 'Wysłane',
  delivered: 'Dostarczone',
  cancelled: 'Anulowane',
};

const orderStatusColors: Record<ShopOrder['status'], string> = {
  pending: 'bg-warning/20 text-warning-foreground border-warning',
  paid: 'bg-primary/20 text-primary border-primary',
  shipped: 'bg-accent/20 text-accent-foreground border-accent',
  delivered: 'bg-success/20 text-success border-success',
  cancelled: 'bg-destructive/20 text-destructive border-destructive',
};

type SortField = 'createdAt' | 'totalPrice' | 'status';
type SortDir = 'asc' | 'desc';

export const AdminOrdersTab = () => {
  const [orders, setOrders] = useState<ShopOrder[]>(mockShopOrders);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShopOrder['status'] | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Order detail dialog
  const [viewingOrder, setViewingOrder] = useState<ShopOrder | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [newStatus, setNewStatus] = useState<ShopOrder['status']>('pending');

  const getCustomerName = (userId: string) => mockUsers.find(u => u.id === userId)?.name || 'Nieznany';
  const getCustomerEmail = (userId: string) => mockUsers.find(u => u.id === userId)?.email || '';

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const filteredOrders = useMemo(() => {
    let result = orders.filter(order => {
      const name = getCustomerName(order.userId).toLowerCase();
      const matchesSearch = order.orderNumber.toLowerCase().includes(search.toLowerCase()) || name.includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const orderDate = order.createdAt.substring(0, 10);
      const matchesDateFrom = !dateFrom || orderDate >= dateFrom;
      const matchesDateTo = !dateTo || orderDate <= dateTo;
      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'createdAt') cmp = a.createdAt.localeCompare(b.createdAt);
      else if (sortField === 'totalPrice') cmp = a.totalPrice - b.totalPrice;
      else cmp = a.status.localeCompare(b.status);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [orders, search, statusFilter, dateFrom, dateTo, sortField, sortDir]);

  const handleViewOrder = (order: ShopOrder) => {
    setViewingOrder(order);
    setTrackingNumber(order.trackingNumber || '');
    setNewStatus(order.status);
    setIsDialogOpen(true);
  };

  const handleSaveOrder = () => {
    if (viewingOrder) {
      setOrders(orders.map(o =>
        o.id === viewingOrder.id ? { ...o, status: newStatus, trackingNumber: trackingNumber || undefined } : o
      ));
      toast.success('Zamówienie zostało zaktualizowane');
      setIsDialogOpen(false);
    }
  };

  const prepareOrdersExport = () => {
    return filteredOrders.map(order => ({
      'Nr zamówienia': order.orderNumber,
      'Klient': getCustomerName(order.userId),
      'Email': getCustomerEmail(order.userId),
      'Data': format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm'),
      'Produkty': order.items.map(i => `${i.quantity}x ${i.productName}`).join(', '),
      'Kwota': `${order.totalPrice.toFixed(2)} PLN`,
      'Status': orderStatusLabels[order.status],
      'Nr przesyłki': order.trackingNumber || '-',
    }));
  };

  const prepareOrdersXmlExport = () => {
    return filteredOrders.map(order => ({
      orderNumber: order.orderNumber,
      customer: getCustomerName(order.userId),
      email: getCustomerEmail(order.userId),
      date: order.createdAt,
      totalPrice: order.totalPrice,
      status: order.status,
      trackingNumber: order.trackingNumber || '',
      items: order.items.map(i => ({
        name: i.productName,
        quantity: i.quantity,
        price: i.price,
        size: i.size || '',
        color: i.color || '',
      })),
    }));
  };

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const paidCount = orders.filter(o => o.status === 'paid').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Zamówienia</h2>
          <p className="text-muted-foreground">Zarządzanie zamówieniami sklepowymi</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Eksportuj
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => exportToCSV(prepareOrdersExport(), `zamowienia-${format(new Date(), 'yyyy-MM-dd')}`)}>
              Eksportuj CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportToXML(prepareOrdersXmlExport(), 'orders', 'order', `zamowienia-${format(new Date(), 'yyyy-MM-dd')}`)}>
              Eksportuj XML
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10"><ShoppingCart className="h-5 w-5 text-accent-foreground" /></div>
            <div>
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-xs text-muted-foreground">Wszystkich</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Oczekujących</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Package className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold">{paidCount}</p>
              <p className="text-xs text-muted-foreground">Opłaconych</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Szukaj (nr zamówienia, klient)..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as ShopOrder['status'] | 'all')}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie</SelectItem>
                {Object.entries(orderStatusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[150px]" placeholder="Od" />
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[150px]" placeholder="Do" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nr zamówienia</TableHead>
                  <TableHead>Klient</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('createdAt')}>
                    <span className="flex items-center">Data <SortIcon field="createdAt" /></span>
                  </TableHead>
                  <TableHead>Produkty</TableHead>
                  <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort('totalPrice')}>
                    <span className="flex items-center justify-end">Kwota <SortIcon field="totalPrice" /></span>
                  </TableHead>
                  <TableHead className="text-center cursor-pointer select-none" onClick={() => toggleSort('status')}>
                    <span className="flex items-center justify-center">Status <SortIcon field="status" /></span>
                  </TableHead>
                  <TableHead className="w-24">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                    <TableCell>
                      <p className="font-medium">{getCustomerName(order.userId)}</p>
                      <p className="text-sm text-muted-foreground">{getCustomerEmail(order.userId)}</p>
                    </TableCell>
                    <TableCell>{format(new Date(order.createdAt), 'd MMM yyyy, HH:mm', { locale: pl })}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground line-clamp-1">
                        {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">{order.totalPrice.toFixed(2)} zł</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={orderStatusColors[order.status]}>
                        {orderStatusLabels[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewOrder(order)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleViewOrder(order)}><Pencil className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredOrders.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">Nie znaleziono zamówień</p>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Zamówienie {viewingOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {viewingOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Klient</p>
                  <p className="font-medium">{getCustomerName(viewingOrder.userId)}</p>
                  <p className="text-sm text-muted-foreground">{getCustomerEmail(viewingOrder.userId)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data zamówienia</p>
                  <p className="font-medium">{format(new Date(viewingOrder.createdAt), 'd MMMM yyyy, HH:mm', { locale: pl })}</p>
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={v => setNewStatus(v as ShopOrder['status'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(orderStatusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Produkty</p>
                <div className="space-y-2 bg-muted/50 rounded-lg p-3">
                  {viewingOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.productName}{item.size && ` (${item.size})`}{item.color && `, ${item.color}`}</span>
                      <span className="font-medium">{(item.price * item.quantity).toFixed(2)} zł</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Dostawa</p><p>{viewingOrder.deliveryMethod.name}</p></div>
                <div className="text-right"><p className="text-muted-foreground">Koszt</p><p>{viewingOrder.deliveryPrice.toFixed(2)} zł</p></div>
                <div><p className="text-muted-foreground">Płatność</p><p>{viewingOrder.paymentMethod.name}</p></div>
                <div className="text-right"><p className="text-muted-foreground">Dopłata</p><p>{viewingOrder.paymentSurcharge.toFixed(2)} zł</p></div>
              </div>

              <div className="flex justify-between items-center border-t pt-4">
                <span className="font-semibold">SUMA</span>
                <span className="text-xl font-bold">{viewingOrder.totalPrice.toFixed(2)} zł</span>
              </div>

              <div>
                <Label>Numer przesyłki</Label>
                <Input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Wprowadź numer przesyłki..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Zamknij</Button>
            <Button onClick={handleSaveOrder}>Zapisz zmiany</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
