import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Star, Minus, Plus, ShoppingCart, Check, Zap, Clock, Shield } from 'lucide-react';
import { mockShopProducts, shopCategoryLabels } from '@/data/mockData';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

const ShopProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  
  const product = mockShopProducts.find(p => p.slug === slug);

  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product?.sizes?.[0]
  );
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product?.colors?.[0]?.id
  );
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product?.imageUrl || '');

  if (!product) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Produkt nie znaleziony</h1>
          <Button asChild>
            <Link to="/shop">Wróć do sklepu</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount 
    ? Math.round((1 - product.price / product.originalPrice!) * 100) 
    : 0;

  const selectedColorData = product.colors?.find(c => c.id === selectedColor);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      quantity,
      size: selectedSize,
      color: selectedColor,
    });
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            to="/shop" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Powrót do sklepu
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image & Gallery */}
          <div className="space-y-3">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted relative">
              <img
                src={selectedImage || product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              {hasDiscount && (
                <Badge className="absolute top-4 right-4 bg-destructive text-lg px-3 py-1">
                  -{discountPercent}%
                </Badge>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={cn(
                      'w-16 h-16 rounded-md overflow-hidden border-2 flex-shrink-0 transition-all',
                      (selectedImage || product.imageUrl) === img
                        ? 'border-primary ring-1 ring-primary'
                        : 'border-border hover:border-muted-foreground'
                    )}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div>
            <div className="mb-2 flex gap-2">
              <Badge variant="secondary">{shopCategoryLabels[product.category]}</Badge>
              {product.isService && (
                <Badge variant="default" className="gap-1">
                  <Zap className="h-3 w-3" />
                  Usługa cyfrowa
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-1">{product.brand}</p>
            <h1 className="text-2xl md:text-3xl font-bold mb-4">{product.name}</h1>

            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        'h-4 w-4',
                        star <= Math.round(product.rating!)
                          ? 'fill-warning text-warning'
                          : 'text-muted'
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">
                  ({product.reviewCount} opinii)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold">{product.price} zł</span>
              {hasDiscount && (
                <span className="text-xl text-muted-foreground line-through">
                  {product.originalPrice} zł
                </span>
              )}
            </div>

            <Separator className="my-6" />

            {/* Size Selection - only for physical products */}
            {!product.isService && product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <label className="text-sm font-medium mb-3 block">Rozmiar</label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedSize(size)}
                      className="min-w-[48px]"
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection - only for physical products */}
            {!product.isService && product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <label className="text-sm font-medium mb-3 block">
                  Kolor: {selectedColorData?.name}
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setSelectedColor(color.id)}
                      className={cn(
                        'w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center',
                        selectedColor === color.id 
                          ? 'border-primary ring-2 ring-primary ring-offset-2' 
                          : 'border-border hover:border-muted-foreground'
                      )}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {selectedColor === color.id && (
                        <Check className={cn(
                          'h-5 w-5',
                          color.hex === '#FFFFFF' || color.hex === '#ffffff' 
                            ? 'text-foreground' 
                            : 'text-white'
                        )} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Service Details */}
            {product.isService && product.serviceDetails && (
              <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Informacje o usłudze
                </h3>
                <p className="text-sm text-muted-foreground">{product.serviceDetails}</p>
                {product.validityDays && (
                  <p className="text-sm mt-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Ważność: {product.validityDays} dni
                  </p>
                )}
              </div>
            )}

            {/* Quantity - only for physical products */}
            {!product.isService && (
              <div className="mb-6">
                <label className="text-sm font-medium mb-3 block">Ilość</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={product.stockCount !== undefined && quantity >= product.stockCount}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  {product.stockCount !== undefined && (
                    <span className="text-sm text-muted-foreground">
                      (dostępnych: {product.stockCount})
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <Button 
              size="lg" 
              className="w-full gap-2" 
              onClick={handleAddToCart}
              disabled={!product.inStock}
            >
              <ShoppingCart className="h-5 w-5" />
              {product.inStock 
                ? (product.isService ? 'Kup teraz' : 'Dodaj do koszyka')
                : 'Produkt niedostępny'}
            </Button>

            {product.inStock && (
              <p className="text-sm text-muted-foreground text-center mt-3">
                <Check className="h-4 w-4 inline mr-1 text-success" />
                {product.isService 
                  ? 'Usługa zostanie aktywowana w ciągu 24h'
                  : 'Produkt dostępny - wysyłka w 24h'}
              </p>
            )}

            <Separator className="my-6" />

            {/* Description */}
            <div>
              <h2 className="font-semibold mb-3">Opis produktu</h2>
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ShopProductPage;
