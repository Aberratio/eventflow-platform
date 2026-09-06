import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CartItem } from '@/types';

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export const CartItemCard = ({ item, onUpdateQuantity, onRemove }: CartItemCardProps) => {
  const itemTotal = item.unitPrice * item.quantity;

  return (
    <div className="flex gap-4 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Product Details */}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 font-medium text-foreground">{item.productName}</p>

        {(item.size || item.color) && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
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

        <div className="mt-2 text-sm font-medium text-muted-foreground">
          {item.unitPrice.toFixed(2)} zł / szt.
        </div>
      </div>

      {/* Quantity & Actions */}
      <div className="flex flex-col items-end justify-between gap-2">
        <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md hover:bg-background"
            onClick={() => onUpdateQuantity(item.quantity - 1)}
            disabled={item.quantity <= 1}
            aria-label="Zmniejsz ilość"
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="w-8 text-center text-sm font-semibold" aria-live="polite">
            {item.quantity}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md hover:bg-background"
            onClick={() => onUpdateQuantity(item.quantity + 1)}
            aria-label="Zwiększ ilość"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="text-right text-base font-bold">{itemTotal.toFixed(2)} zł</div>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          Usuń
        </Button>
      </div>
    </div>
  );
};
