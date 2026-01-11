import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

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
    <div className="bg-card rounded-lg border p-6 space-y-4">
      <h2 className="text-lg font-semibold">Podsumowanie</h2>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Produkty ({itemCount} szt.)
          </span>
          <span>{productTotal.toFixed(2)} zł</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Dostawa</span>
          <span>
            {deliveryPrice === 0 ? 'Gratis' : `${deliveryPrice.toFixed(2)} zł`}
          </span>
        </div>
        
        {paymentSurcharge > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dopłata za płatność</span>
            <span>{paymentSurcharge.toFixed(2)} zł</span>
          </div>
        )}
      </div>
      
      <Separator />
      
      <div className="flex justify-between items-center">
        <span className="font-semibold">Razem</span>
        <span className="text-xl font-bold">{total.toFixed(2)} zł</span>
      </div>
      
      <Button 
        className="w-full" 
        size="lg"
        onClick={onCheckout}
        disabled={!canCheckout || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Przetwarzanie...
          </>
        ) : (
          'Przejdź do płatności'
        )}
      </Button>
      
      {!canCheckout && (
        <p className="text-xs text-muted-foreground text-center">
          Wybierz metodę dostawy i płatności
        </p>
      )}
    </div>
  );
};
