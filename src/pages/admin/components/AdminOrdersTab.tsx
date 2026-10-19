import { getOrders } from '@/api';
import { getAllUsers } from '@/api/fetchAllPages';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateInput } from '@/components/ui/date-time-input';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Pencil,
  ShoppingCart,
  Package,
  Clock,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { ShopOrder } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { exportToCSV, exportToXML } from '@/lib/exportUtils';
import { formatMoney } from '@/lib/format';

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

type SortField = 'createdAt' | 'totalPrice' | 'status';
type SortDir = 'asc' | 'desc';

export const AdminOrdersTab = () => {
  const navigate = useNavigate();
  const { data: ordersResp } = useQuery({
    queryKey: ['shop-orders'],
    queryFn: () => getOrders(),
    select: (r) => r.data ?? [],
  });
  const orders = ordersResp ?? [];
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShopOrder['status'] | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const { data: usersResponse } = useQuery({
    queryKey: ['users', 'order-customers'],
    queryFn: () => getAllUsers(),
  });
  const users = usersResponse?.data ?? [];

  const getCustomerName = (userId: string) =>
    users.find((u) => u.id === userId)?.name || 'Nieznany';
  const getCustomerEmail = (userId: string) => users.find((u) => u.id === userId)?.email || '';

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  const filteredOrders = useMemo(() => {
    const result = orders.filter((order) => {
      const name = getCustomerName(order.userId).toLowerCase();
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        name.includes(search.toLowerCase());
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
  }, [orders, search, statusFilter, dateFrom, dateTo, sortField, sortDir, users]);

  const prepareOrdersExport = () => {
    return filteredOrders.map((order) => ({
      'Nr zamówienia': order.orderNumber,
      Klient: getCustomerName(order.userId),
      Email: getCustomerEmail(order.userId),
      Data: format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm'),
      Produkty: order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', '),
      Kwota: formatMoney(order.totalPrice),
      Status: orderStatusLabels[order.status],
      'Nr przesyłki': order.trackingNumber || '-',
    }));
  };

  const prepareOrdersXmlExport = () => {
    return filteredOrders.map((order) => ({
      orderNumber: order.orderNumber,
      customer: getCustomerName(order.userId),
      email: getCustomerEmail(order.userId),
      date: order.createdAt,
      totalPrice: order.totalPrice,
      status: order.status,
      trackingNumber: order.trackingNumber || '',
      items: order.items.map((i) => ({
        name: i.productName,
        quantity: i.quantity,
        price: i.price,
        size: i.size || '',
        color: i.color || '',
      })),
    }));
  };

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const paidCount = orders.filter((o) => o.status === 'paid').length;

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
            <DropdownMenuItem
              onClick={() =>
                exportToCSV(prepareOrdersExport(), `zamowienia-${format(new Date(), 'yyyy-MM-dd')}`)
              }
            >
              Eksportuj CSV
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                exportToXML(
                  prepareOrdersXmlExport(),
                  'orders',
                  'order',
                  `zamowienia-${format(new Date(), 'yyyy-MM-dd')}`,
                )
              }
            >
              Eksportuj XML
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-accent/10 p-2">
              <ShoppingCart className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-xs text-muted-foreground">Wszystkich</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-warning/10 p-2">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Oczekujących</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Package className="h-5 w-5 text-primary" />
            </div>
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
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Szukaj (nr zamówienia, klient)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as ShopOrder['status'] | 'all')}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
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
            <DateInput
              value={dateFrom}
              onValueChange={setDateFrom}
              className="w-full sm:w-[150px]"
              placeholder="Od"
            />
            <DateInput
              value={dateTo}
              onValueChange={setDateTo}
              className="w-full sm:w-[150px]"
              placeholder="Do"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nr zamówienia</TableHead>
                  <TableHead>Klient</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort('createdAt')}
                  >
                    <span className="flex items-center">
                      Data <SortIcon field="createdAt" />
                    </span>
                  </TableHead>
                  <TableHead>Produkty</TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right"
                    onClick={() => toggleSort('totalPrice')}
                  >
                    <span className="flex items-center justify-end">
                      Kwota <SortIcon field="totalPrice" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-center"
                    onClick={() => toggleSort('status')}
                  >
                    <span className="flex items-center justify-center">
                      Status <SortIcon field="status" />
                    </span>
                  </TableHead>
                  <TableHead className="w-16">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                    <TableCell>
                      <p className="font-medium">{getCustomerName(order.userId)}</p>
                      <p className="text-sm text-muted-foreground">
                        {getCustomerEmail(order.userId)}
                      </p>
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.createdAt), 'd MMM yyyy, HH:mm', { locale: pl })}
                    </TableCell>
                    <TableCell>
                      <span className="line-clamp-1 text-sm text-muted-foreground">
                        {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(order.totalPrice)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={orderStatusColors[order.status]}>
                        {orderStatusLabels[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/admin/orders/${order.id}/edit`)}
                      >
                        <Pencil className="h-4 w-4" />
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
    </div>
  );
};
