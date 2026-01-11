import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="flex gap-4 p-4 bg-card rounded-lg border">
      {/* Product Image */}
      <Link to={`/shop/${product.slug}`} className="shrink-0">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-20 h-20 object-cover rounded-md"
        />
      </Link>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <Link 
          to={`/shop/${product.slug}`} 
          className="font-medium text-foreground hover:text-primary transition-colors line-clamp-2"
        >
          {product.name}
        </Link>
        
        <div className="mt-1 text-sm text-muted-foreground">
          {item.size && <span>Rozmiar: {item.size}</span>}
          {item.size && item.color && <span className="mx-2">|</span>}
          {item.color && <span>Kolor: {item.color}</span>}
        </div>

        <div className="mt-2 text-sm font-medium">
          {product.price.toFixed(2)} zł
        </div>
      </div>

      {/* Quantity Controls */}
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdateQuantity(item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center font-medium">{item.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdateQuantity(item.quantity + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-right">
          <div className="font-semibold">{itemTotal.toFixed(2)} zł</div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Usuń
        </Button>
      </div>
    </div>
  );
};
