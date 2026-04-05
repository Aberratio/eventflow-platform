import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CartItem, ShopProduct } from '@/types';

interface CartItemCardProps {
  item: CartItem;
  product: ShopProduct;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export const CartItemCard = ({ item, product, onUpdateQuantity, onRemove }: CartItemCardProps) => {
  const itemTotal = product.price * item.quantity;

  return (
    <div className="flex gap-4 p-4 bg-card rounded-xl border shadow-sm hover:shadow-md transition-shadow">
      {/* Product Image */}
      <Link to={`/shop/${product.slug}`} className="shrink-0">
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-20 h-20 sm:w-24 sm:h-24 object-cover transition-transform hover:scale-105"
          />
          {product.isService && (
            <Badge className="absolute top-1 left-1 text-[10px] px-1.5 py-0 bg-primary/90">
              Cyfrowa
            </Badge>
          )}
        </div>
      </Link>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <Link 
          to={`/shop/${product.slug}`} 
          className="font-medium text-foreground hover:text-primary transition-colors line-clamp-2"
        >
          {product.name}
        </Link>
        
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
          {product.price.toFixed(2)} zł / szt.
        </div>
      </div>

      {/* Quantity & Actions */}
      <div className="flex flex-col items-end justify-between gap-2">
        <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md hover:bg-background"
            onClick={() => onUpdateQuantity(item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md hover:bg-background"
            onClick={() => onUpdateQuantity(item.quantity + 1)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="text-right font-bold text-base">{itemTotal.toFixed(2)} zł</div>

        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-destructive h-7 px-2"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Usuń
        </Button>
      </div>
    </div>
  );
};
