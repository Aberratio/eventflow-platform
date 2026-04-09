import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';
import { ShopProduct } from '@/types';

interface ProductCardProps {
  product: ShopProduct;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / product.originalPrice!) * 100)
    : 0;

  return (
    <Link to={`/shop/${product.slug}`}>
      <Card className="group overflow-hidden bg-card/80 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-warning/30 hover:shadow-lg">
        <div className="relative aspect-square overflow-hidden bg-muted/50">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Subtle gradient overlay at bottom */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/30 to-transparent" />

          {/* Badges */}
          <div className="absolute left-2 right-2 top-2 flex items-start justify-between">
            <div className="flex flex-col gap-1">
              {product.isService && (
                <Badge variant="default" className="gap-1 px-1.5 py-0.5 text-[10px]">
                  <Zap className="h-2.5 w-2.5" />
                  Cyfrowa
                </Badge>
              )}
              {product.featured && (
                <Badge className="bg-warning px-1.5 py-0.5 text-[10px] text-warning-foreground">
                  Hit
                </Badge>
              )}
            </div>
            {hasDiscount && (
              <Badge className="bg-destructive font-bold text-destructive-foreground">
                -{discountPercent}%
              </Badge>
            )}
          </div>

          {!product.inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-[2px]">
              <span className="rounded-full bg-background/90 px-3 py-1.5 text-sm font-medium text-muted-foreground">
                Brak w magazynie
              </span>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
            {product.brand}
          </p>
          <h3 className="mb-3 line-clamp-2 text-sm font-medium leading-snug transition-colors group-hover:text-primary">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-foreground">{product.price} zł</span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {product.originalPrice} zł
              </span>
            )}
          </div>
          {product.inStock && (
            <div className="mt-2 flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-success" />
              <span className="text-[10px] text-muted-foreground">Dostępny</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};
