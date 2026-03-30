import { useState, useMemo } from 'react';
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
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { mockShopProducts, shopCategoryLabels } from '@/data/mockData';
import { ShopCategory } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';

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

  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(mockShopProducts.map(p => p.brand))];
    return uniqueBrands.sort();
  }, []);

  const filteredProducts = useMemo(() => {
    let products = [...mockShopProducts];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.brand.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (category !== 'all') {
      products = products.filter(p => p.category === category);
    }

    // Brand filter
    if (brand !== 'all') {
      products = products.filter(p => p.brand === brand);
    }

    // Sort
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
  }, [search, category, brand, sort]);

  const activeFiltersCount = [
    category !== 'all',
    brand !== 'all',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setCategory('all');
    setBrand('all');
    setSearch('');
  };

  const FiltersContent = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Kategoria</label>
        <Select value={category} onValueChange={(v) => setCategory(v as ShopCategory | 'all')}>
          <SelectTrigger>
            <SelectValue placeholder="Wszystkie kategorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie kategorie</SelectItem>
            {Object.entries(shopCategoryLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Marka</label>
        <Select value={brand} onValueChange={setBrand}>
          <SelectTrigger>
            <SelectValue placeholder="Wszystkie marki" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie marki</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Sortuj</label>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(sortLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeFiltersCount > 0 && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Wyczyść filtry
        </Button>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 bg-warning rounded-full" />
            <h1 className="text-3xl font-bold">Sklep biegowy</h1>
          </div>
          <p className="text-muted-foreground">
            Znajdź idealne wyposażenie do treningów i zawodów
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj produktów..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
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
            <div className="flex gap-3 items-end">
              <div className="flex flex-col">
                <label className="text-xs font-medium text-muted-foreground mb-1">Kategoria</label>
                <Select value={category} onValueChange={(v) => setCategory(v as ShopCategory | 'all')}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Wszystkie kategorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie kategorie</SelectItem>
                    {Object.entries(shopCategoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-medium text-muted-foreground mb-1">Marka</label>
                <Select value={brand} onValueChange={setBrand}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Wszystkie marki" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie marki</SelectItem>
                    {brands.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-medium text-muted-foreground mb-1">Sortuj</label>
                <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                  <SelectTrigger className="w-[170px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(sortLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-destructive gap-1 mb-0">
                  <X className="h-4 w-4" />
                  Wyczyść
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Active filters badges */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {category !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {shopCategoryLabels[category]}
                <button onClick={() => setCategory('all')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {brand !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {brand}
                <button onClick={() => setBrand('all')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-6">
          Znaleziono {filteredProducts.length} {filteredProducts.length === 1 ? 'produkt' : 
            filteredProducts.length < 5 ? 'produkty' : 'produktów'}
        </p>

        {/* Products grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Nie znaleziono produktów</p>
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
