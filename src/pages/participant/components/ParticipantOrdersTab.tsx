import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShopOrder } from '@/types';
import { Package, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useState } from 'react';

interface ParticipantOrdersTabProps {
  orders: ShopOrder[];
}

const ParticipantOrdersTab = ({ orders }: ParticipantOrdersTabProps) => {
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);

  const toggleOrder = (orderId: string) => {
    setExpandedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId],
    );
  };

  const getStatusBadge = (status: ShopOrder['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Oczekuje na płatność</Badge>;
      case 'paid':
        return <Badge className="bg-info/10 text-info hover:bg-info/20">Opłacone</Badge>;
      case 'shipped':
        return <Badge className="bg-warning/10 text-warning hover:bg-warning/20">Wysłane</Badge>;
      case 'delivered':
        return (
          <Badge className="bg-success/10 text-success hover:bg-success/20">Dostarczone</Badge>
        );
      case 'cancelled':
        return <Badge variant="destructive">Anulowane</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Historia zamówień ({orders.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {orders.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <ShoppingBag className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Brak zamówień.</p>
            <p className="text-sm">Twoje zamówienia ze sklepu pojawią się tutaj.</p>
          </div>
        ) : (
          orders.map((order) => {
            const isExpanded = expandedOrders.includes(order.id);
            return (
              <div key={order.id} className="overflow-hidden rounded-lg border border-border/50">
                {/* Order header */}
                <div
                  className="cursor-pointer bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                  onClick={() => toggleOrder(order.id)}
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{order.orderNumber}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(order.createdAt), 'd MMMM yyyy, HH:mm', { locale: pl })}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{order.totalPrice.toFixed(2)} zł</span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Order details */}
                {isExpanded && (
                  <div className="space-y-4 p-4">
                    {/* Items */}
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <div>
                            <span>{item.productName}</span>
                            {(item.size || item.color) && (
                              <span className="ml-1 text-muted-foreground">
                                ({[item.size, item.color].filter(Boolean).join(', ')})
                              </span>
                            )}
                            <span className="ml-1 text-muted-foreground">x{item.quantity}</span>
                          </div>
                          <span>{(item.price * item.quantity).toFixed(2)} zł</span>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Summary */}
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Produkty</span>
                        <span>{order.productTotal.toFixed(2)} zł</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Dostawa ({order.deliveryMethod.name})
                        </span>
                        <span>
                          {order.deliveryPrice > 0
                            ? `${order.deliveryPrice.toFixed(2)} zł`
                            : 'Gratis'}
                        </span>
                      </div>
                      {order.paymentSurcharge > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Opłata za płatność</span>
                          <span>{order.paymentSurcharge.toFixed(2)} zł</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 font-semibold">
                        <span>Razem</span>
                        <span>{order.totalPrice.toFixed(2)} zł</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Delivery info */}
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Metoda dostawy</span>
                        <span>{order.deliveryMethod.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Płatność</span>
                        <span>{order.paymentMethod.name}</span>
                      </div>
                      {order.trackingNumber && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Numer śledzenia</span>
                          <span className="font-mono">{order.trackingNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default ParticipantOrdersTab;
