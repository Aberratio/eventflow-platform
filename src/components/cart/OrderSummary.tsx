import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, Lock, Tag } from 'lucide-react';

interface OrderSummaryProps {
  productTotal: number;
  itemCount: number;
  deliveryPrice: number;
  paymentSurcharge: number;
  onCheckout: () => void;
  isProcessing?: boolean;
  canCheckout: boolean;
}

export const OrderSummary = ({
  productTotal,
  itemCount,
  deliveryPrice,
  paymentSurcharge,
  onCheckout,
  isProcessing = false,
  canCheckout,
}: OrderSummaryProps) => {
  const total = productTotal + deliveryPrice + paymentSurcharge;

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-primary/10 to-warning/5 px-6 py-4">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Tag className="h-4 w-4 text-primary" />
          Podsumowanie
        </h2>
      </div>

      <div className="space-y-4 p-6">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Produkty ({itemCount} szt.)</span>
            <span className="font-medium">{productTotal.toFixed(2)} zł</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Dostawa</span>
            <span className={`font-medium ${deliveryPrice === 0 ? 'text-success' : ''}`}>
              {deliveryPrice === 0 ? 'Gratis' : `${deliveryPrice.toFixed(2)} zł`}
            </span>
          </div>

          {paymentSurcharge > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dopłata za płatność</span>
              <span className="font-medium">{paymentSurcharge.toFixed(2)} zł</span>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-base font-bold">Do zapłaty</span>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary">{total.toFixed(2)} zł</span>
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={onCheckout}
          disabled={!canCheckout || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Przetwarzanie...
            </>
          ) : (
            'Przejdź do płatności'
          )}
        </Button>

        {!canCheckout && (
          <p className="text-center text-xs text-muted-foreground">
            Wybierz metodę dostawy i płatności
          </p>
        )}

        <div className="flex items-center justify-center gap-1.5 pt-1 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          <span>Bezpieczna transakcja SSL</span>
        </div>
      </div>
    </div>
  );
};
