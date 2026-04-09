import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/shop/ProductCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Search, SlidersHorizontal, X, ShoppingBag, Package, Sparkles } from 'lucide-react';
import { ShopCategory } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { getProducts } from '@/api';
import { shopCategoryLabels } from '@/api/mock/labels';
import { QUERY_KEYS } from '@/constants';
import { Skeleton } from '@/components/ui/skeleton';

type SortOption = 'popular' | 'price-asc' | 'price-desc' | 'newest';

const sortLabels: Record<SortOption, string> = {
  popular: 'Popularność',
  'price-asc': 'Cena: rosnąco',
  'price-desc': 'Cena: malejąco',
  newest: 'Nowości',
};

const ShopPage = () => {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ShopCategory | 'all'>('all');
  const [brand, setBrand] = useState<string | 'all'>('all');
  const [sort, setSort] = useState<SortOption>('popular');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: productsData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.products,
    queryFn: () => getProducts(),
  });

  const allProducts = productsData?.data ?? [];

  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(allProducts.map((p) => p.brand))];
    return uniqueBrands.sort();
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    let products = [...allProducts];
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.brand.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower),
      );
    }
    if (category !== 'all') products = products.filter((p) => p.category === category);
    if (brand !== 'all') products = products.filter((p) => p.brand === brand);

    switch (sort) {
      case 'price-asc':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        products.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        break;
      case 'newest':
        products.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }
    return products;
  }, [allProducts, search, category, brand, sort]);

  const activeFiltersCount = [category !== 'all', brand !== 'all'].filter(Boolean).length;
  const clearFilters = () => {
    setCategory('all');
    setBrand('all');
    setSearch('');
  };
  const totalProducts = allProducts.length;
  const discountedCount = allProducts.filter(
    (p) => p.originalPrice && p.originalPrice > p.price,
  ).length;

  const FiltersContent = () => (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Kategoria</label>
        <Select value={category} onValueChange={(v) => setCategory(v as ShopCategory | 'all')}>
          <SelectTrigger>
            <SelectValue placeholder="Wszystkie kategorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie kategorie</SelectItem>
            {Object.entries(shopCategoryLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium">Marka</label>
        <Select value={brand} onValueChange={setBrand}>
          <SelectTrigger>
            <SelectValue placeholder="Wszystkie marki" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie marki</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium">Sortuj</label>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(sortLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {activeFiltersCount > 0 && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="mr-2 h-4 w-4" />
          Wyczyść filtry
        </Button>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="border-b border-border/50 bg-gradient-to-br from-primary/10 via-background to-warning/5">
        <div className="container py-10 md:py-14">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-3xl font-bold md:text-4xl">Sklep biegowy</h1>
              </div>
              <p className="max-w-md text-lg text-muted-foreground">
                Znajdź idealne wyposażenie do treningów i zawodów
              </p>
            </div>
            <div className="flex gap-4">
              <div className="rounded-xl border border-border/50 bg-card/80 px-5 py-3 text-center backdrop-blur-sm">
                <div className="mb-0.5 flex items-center gap-2 text-primary">
                  <Package className="h-4 w-4" />
                  <span className="text-2xl font-bold">{totalProducts}</span>
                </div>
                <p className="text-xs text-muted-foreground">Produktów</p>
              </div>
              {discountedCount > 0 && (
                <div className="rounded-xl border border-border/50 bg-card/80 px-5 py-3 text-center backdrop-blur-sm">
                  <div className="mb-0.5 flex items-center gap-2 text-destructive">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-2xl font-bold">{discountedCount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">W promocji</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="mb-6 rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Szukaj produktów..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-background pl-10"
              />
            </div>
            {isMobile ? (
              <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtry
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Filtry i sortowanie</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-4">
                    <FiltersContent />
                  </div>
                </DrawerContent>
              </Drawer>
            ) : (
              <div className="flex items-end gap-3">
                <div className="flex flex-col">
                  <label className="mb-1 text-xs font-medium text-muted-foreground">
                    Kategoria
                  </label>
                  <Select
                    value={category}
                    onValueChange={(v) => setCategory(v as ShopCategory | 'all')}
                  >
                    <SelectTrigger className="w-[180px] bg-background">
                      <SelectValue placeholder="Wszystkie kategorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Wszystkie kategorie</SelectItem>
                      {Object.entries(shopCategoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-xs font-medium text-muted-foreground">Marka</label>
                  <Select value={brand} onValueChange={setBrand}>
                    <SelectTrigger className="w-[160px] bg-background">
                      <SelectValue placeholder="Wszystkie marki" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Wszystkie marki</SelectItem>
                      {brands.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-xs font-medium text-muted-foreground">Sortuj</label>
                  <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                    <SelectTrigger className="w-[170px] bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(sortLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="mb-0 gap-1 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                    Wyczyść
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {activeFiltersCount > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {category !== 'all' && (
              <Badge variant="secondary" className="gap-1 px-3 py-1">
                {shopCategoryLabels[category]}
                <button onClick={() => setCategory('all')} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {brand !== 'all' && (
              <Badge variant="secondary" className="gap-1 px-3 py-1">
                {brand}
                <button onClick={() => setBrand('all')} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        <p className="mb-6 text-sm text-muted-foreground">
          Znaleziono {filteredProducts.length}{' '}
          {filteredProducts.length === 1
            ? 'produkt'
            : filteredProducts.length < 5
              ? 'produkty'
              : 'produktów'}
        </p>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border/50 bg-muted/30 py-16 text-center">
            <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="mb-4 text-muted-foreground">Nie znaleziono produktów</p>
            <Button variant="outline" onClick={clearFilters}>
              Wyczyść filtry
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ShopPage;
