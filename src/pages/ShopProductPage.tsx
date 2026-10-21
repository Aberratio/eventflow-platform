import { getProductBySlug, getShopCategories } from '@/api';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { QueryErrorState } from '@/components/ui/query-error-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageHero } from '@/components/ui/page-hero';
import { PageSection } from '@/components/ui/page-section';
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  Check,
  Zap,
  Clock,
  Shield,
  Package,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { QUERY_KEYS } from '@/constants';
import { formatMoney } from '@/lib/format';

const ShopProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();

  const {
    data: productData,
    isLoading: productLoading,
    isError: productError,
    refetch: refetchProduct,
  } = useQuery({
    queryKey: slug ? QUERY_KEYS.productBySlug(slug) : ['product'],
    queryFn: () => getProductBySlug(slug!),
    enabled: !!slug,
  });
  const { data: categoriesData } = useQuery({
    queryKey: QUERY_KEYS.shopCategories,
    queryFn: () => getShopCategories(),
  });
  const product = productData?.data;
  const categoryLabels = Object.fromEntries(
    (categoriesData?.data ?? []).map((item) => [item.id, item.name]),
  );

  const [selectedSize, setSelectedSize] = useState<string | undefined>(product?.sizes?.[0]);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(product?.colors?.[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product?.imageUrl || '');

  useEffect(() => {
    if (!product) return;
    setSelectedSize(product.sizes?.[0]);
    setSelectedColor(product.colors?.[0]?.id);
    setSelectedImage(product.imageUrl || '');
  }, [product]);

  if (productLoading) {
    return (
      <Layout>
        <div className="container py-16 text-center text-muted-foreground">
          Ładowanie produktu...
        </div>
      </Layout>
    );
  }

  if (productError && !product) {
    return (
      <Layout>
        <div className="container py-16">
          <QueryErrorState onRetry={() => void refetchProduct()} />
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="mb-4 text-2xl font-bold">Produkt nie znaleziony</h1>
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

  const selectedColorData = product.colors?.find((c) => c.id === selectedColor);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      quantity,
      size: selectedSize,
      color: selectedColor,
      isService: product.isService,
      serviceKind: product.serviceKind,
    });
  };

  return (
    <Layout>
      <PageHero className="py-4">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Powrót do sklepu
        </Link>
      </PageHero>

      <PageSection compact>
        <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
          {/* Product Image & Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-border/50 bg-muted/30">
              <img
                src={selectedImage || product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              {hasDiscount && (
                <Badge className="absolute right-4 top-4 bg-destructive px-3 py-1.5 text-lg font-bold text-destructive-foreground">
                  -{discountPercent}%
                </Badge>
              )}
              {product.isService && (
                <Badge variant="default" className="absolute left-4 top-4 gap-1">
                  <Zap className="h-3 w-3" />
                  Usługa cyfrowa
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
                      'w-18 h-18 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all',
                      (selectedImage || product.imageUrl) === img
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-border hover:border-muted-foreground',
                    )}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                {categoryLabels[product.category] ?? product.category}
              </Badge>
              {product.featured && (
                <Badge className="border border-warning/30 bg-warning/20 text-xs text-warning">
                  Wyróżniony
                </Badge>
              )}
            </div>

            <p className="mb-1 text-sm uppercase tracking-wider text-muted-foreground">
              {product.brand}
            </p>
            <h1 className="mb-5 text-2xl font-bold md:text-3xl">{product.name}</h1>

            {/* Price Card */}
            <div className="mb-6 rounded-xl border border-primary/10 bg-gradient-to-r from-primary/5 to-warning/5 p-5">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-foreground">
                  {formatMoney(product.price)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      {formatMoney(product.originalPrice)}
                    </span>
                    <Badge className="border border-destructive/20 bg-destructive/10 text-destructive">
                      Oszczędzasz {formatMoney(product.originalPrice! - product.price)}
                    </Badge>
                  </>
                )}
              </div>
              {product.inStock ? (
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
                  <span className="text-sm font-medium text-success">Dostępny</span>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Niedostępny</span>
                </div>
              )}
            </div>

            {/* Size Selection */}
            {!product.isService && product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <label className="mb-3 block text-sm font-medium">Rozmiar</label>
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

            {/* Color Selection */}
            {!product.isService && product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <label className="mb-3 block text-sm font-medium">
                  Kolor: <span className="text-muted-foreground">{selectedColorData?.name}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setSelectedColor(color.id)}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                        selectedColor === color.id
                          ? 'border-primary ring-2 ring-primary ring-offset-2'
                          : 'border-border hover:border-muted-foreground',
                      )}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {selectedColor === color.id && (
                        <Check
                          className={cn(
                            'h-5 w-5',
                            color.hex === '#FFFFFF' || color.hex === '#ffffff'
                              ? 'text-foreground'
                              : 'text-white',
                          )}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Service Details */}
            {product.isService && product.serviceDetails && (
              <div className="mb-6 rounded-xl border border-primary/15 bg-primary/5 p-5">
                <h3 className="mb-2 flex items-center gap-2 font-medium">
                  <Shield className="h-4 w-4 text-primary" />
                  Informacje o usłudze
                </h3>
                <p className="text-sm text-muted-foreground">{product.serviceDetails}</p>
                {product.validityDays && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Ważność:{' '}
                    <span className="font-medium text-foreground">{product.validityDays} dni</span>
                  </p>
                )}
              </div>
            )}

            {/* Quantity */}
            {!product.isService && (
              <div className="mb-6">
                <label className="mb-3 block text-sm font-medium">Ilość</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    aria-label="Zmniejsz ilość"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center text-lg font-bold" aria-live="polite">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={product.stockCount !== undefined && quantity >= product.stockCount}
                    aria-label="Zwiększ ilość"
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
              className="h-12 w-full gap-2 text-base"
              onClick={handleAddToCart}
              disabled={!product.inStock}
            >
              <ShoppingCart className="h-5 w-5" />
              {product.inStock
                ? product.isService
                  ? 'Kup teraz'
                  : 'Dodaj do koszyka'
                : 'Produkt niedostępny'}
            </Button>

            {/* Trust badges */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center rounded-xl bg-muted/30 p-3 text-center">
                <Truck className="mb-1.5 h-4 w-4 text-primary" />
                <span className="text-[10px] leading-tight text-muted-foreground">
                  {product.isService ? 'Aktywacja 24h' : 'Wysyłka 24h'}
                </span>
              </div>
              <div className="flex flex-col items-center rounded-xl bg-muted/30 p-3 text-center">
                <Shield className="mb-1.5 h-4 w-4 text-primary" />
                <span className="text-[10px] leading-tight text-muted-foreground">
                  Bezpieczna płatność
                </span>
              </div>
              <div className="flex flex-col items-center rounded-xl bg-muted/30 p-3 text-center">
                <RotateCcw className="mb-1.5 h-4 w-4 text-primary" />
                <span className="text-[10px] leading-tight text-muted-foreground">
                  14 dni na zwrot
                </span>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Description */}
            <div className="rounded-xl border border-border/50 bg-muted/20 p-5">
              <h2 className="mb-3 flex items-center gap-2 font-semibold">
                <Package className="h-4 w-4 text-primary" />
                Opis produktu
              </h2>
              <p className="leading-relaxed text-muted-foreground">{product.description}</p>
            </div>
          </div>
        </div>
      </PageSection>
    </Layout>
  );
};

export default ShopProductPage;
