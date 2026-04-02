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
      <Card className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 hover:border-warning/30 bg-card/80 backdrop-blur-sm">
        <div className="aspect-square overflow-hidden bg-muted/50 relative">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Subtle gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/30 to-transparent pointer-events-none" />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
            <div className="flex flex-col gap-1">
              {product.isService && (
                <Badge variant="default" className="gap-1 text-[10px] px-1.5 py-0.5">
                  <Zap className="h-2.5 w-2.5" />
                  Cyfrowa
                </Badge>
              )}
              {product.featured && (
                <Badge className="bg-warning text-warning-foreground text-[10px] px-1.5 py-0.5">
                  Hit
                </Badge>
              )}
            </div>
            {hasDiscount && (
              <Badge className="bg-destructive text-destructive-foreground font-bold">
                -{discountPercent}%
              </Badge>
            )}
          </div>

          {!product.inStock && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-muted-foreground font-medium text-sm bg-background/90 px-3 py-1.5 rounded-full">
                Brak w magazynie
              </span>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{product.brand}</p>
          <h3 className="font-medium text-sm line-clamp-2 mb-3 group-hover:text-primary transition-colors leading-snug">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-lg text-foreground">{product.price} zł</span>
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
