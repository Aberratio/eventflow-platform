import { shopCategoryLabels, mockShopProducts } from '@/api';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Package,
  Box,
  Infinity as InfinityIcon,
  Tags,
} from 'lucide-react';
import { ShopProduct, ShopCategory } from '@/types';
import { toast } from 'sonner';

export const AdminShopTab = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');

  // Products state
  const [products, setProducts] = useState<ShopProduct[]>(mockShopProducts);
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState<ShopCategory | 'all'>('all');
  const [productAvailability, setProductAvailability] = useState<'all' | 'inStock' | 'outOfStock'>(
    'all',
  );
  const [deletingProduct, setDeletingProduct] = useState<ShopProduct | null>(null);

  // Categories state
  const [categories, setCategories] = useState<Record<string, string>>({ ...shopCategoryLabels });
  const [newCategoryKey, setNewCategoryKey] = useState('');
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.brand.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCategory = productCategory === 'all' || product.category === productCategory;
      const matchesAvailability =
        productAvailability === 'all' ||
        (productAvailability === 'inStock' && product.inStock) ||
        (productAvailability === 'outOfStock' && !product.inStock);
      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [products, productSearch, productCategory, productAvailability]);

  const handleDeleteProduct = () => {
    if (deletingProduct) {
      setProducts(products.filter((p) => p.id !== deletingProduct.id));
      toast.success('Produkt został usunięty');
      setDeletingProduct(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Zarządzanie Sklepem</h2>
          <p className="text-muted-foreground">Produkty i kategorie</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-xs text-muted-foreground">Produktów</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <Box className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{products.filter((p) => p.inStock).length}</p>
                <p className="text-xs text-muted-foreground">Dostępnych</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            Produkty
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Tags className="h-4 w-4" />
            Kategorie
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col justify-between gap-4 sm:flex-row">
                <div className="flex flex-1 gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Szukaj produktów..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={productCategory}
                    onValueChange={(v) => setProductCategory(v as ShopCategory | 'all')}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Kategoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Wszystkie</SelectItem>
                      {Object.entries(categories).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={productAvailability}
                    onValueChange={(v) =>
                      setProductAvailability(v as 'all' | 'inStock' | 'outOfStock')
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Dostępność" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Wszystkie</SelectItem>
                      <SelectItem value="inStock">Dostępne</SelectItem>
                      <SelectItem value="outOfStock">Niedostępne</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => navigate('/admin/shop/products/new')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Dodaj produkt
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Obraz</TableHead>
                      <TableHead>Nazwa</TableHead>
                      <TableHead>Kategoria</TableHead>
                      <TableHead className="text-right">Cena</TableHead>
                      <TableHead className="text-center">Stan mag.</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="w-28">Akcje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-12 w-12 rounded object-cover"
                          />
                        </TableCell>
                        <TableCell>
                          <p className="line-clamp-1 font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.brand}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {categories[product.category] || product.category}
                          </Badge>
                          {product.isService && (
                            <Badge variant="secondary" className="ml-1">
                              Usługa
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {product.price} zł
                          {product.originalPrice && (
                            <span className="ml-2 text-sm text-muted-foreground line-through">
                              {product.originalPrice} zł
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {product.isService ? (
                            <InfinityIcon className="mx-auto h-4 w-4 text-muted-foreground" />
                          ) : (
                            <span>{product.stockCount ?? '-'}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={product.inStock ? 'default' : 'secondary'}>
                            {product.inStock ? 'Dostępny' : 'Niedostępny'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" asChild>
                              <a
                                href={`/shop/${product.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Eye className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/admin/shop/products/${product.id}/edit`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingProduct(product)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredProducts.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">Nie znaleziono produktów</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kategorie produktów</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto rounded-md border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Klucz</TableHead>
                      <TableHead>Nazwa wyświetlana</TableHead>
                      <TableHead className="text-center">Produktów</TableHead>
                      <TableHead className="w-16">Akcje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(categories).map(([key, label]) => {
                      const count = products.filter((p) => p.category === key).length;
                      return (
                        <TableRow key={key}>
                          <TableCell className="font-mono text-sm">{key}</TableCell>
                          <TableCell className="font-medium">{label}</TableCell>
                          <TableCell className="text-center">{count}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={count > 0}
                              onClick={() => setDeletingCategory(key)}
                              title={
                                count > 0
                                  ? 'Nie można usunąć kategorii z przypisanymi produktami'
                                  : 'Usuń kategorię'
                              }
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 rounded-lg border border-border/50 p-4">
                <p className="text-sm font-medium">Dodaj nową kategorię</p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">
                      Klucz (bez spacji, małe litery)
                    </Label>
                    <Input
                      value={newCategoryKey}
                      onChange={(e) =>
                        setNewCategoryKey(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))
                      }
                      placeholder="np. supplements"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Nazwa wyświetlana</Label>
                    <Input
                      value={newCategoryLabel}
                      onChange={(e) => setNewCategoryLabel(e.target.value)}
                      placeholder="np. Suplementy"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => {
                        if (newCategoryKey && newCategoryLabel && !categories[newCategoryKey]) {
                          setCategories({ ...categories, [newCategoryKey]: newCategoryLabel });
                          setNewCategoryKey('');
                          setNewCategoryLabel('');
                          toast.success(`Kategoria "${newCategoryLabel}" została dodana`);
                        } else if (categories[newCategoryKey]) {
                          toast.error('Kategoria o takim kluczu już istnieje');
                        }
                      }}
                      disabled={!newCategoryKey || !newCategoryLabel}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Dodaj
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Category Confirmation */}
      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć kategorię?</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć kategorię "
              {deletingCategory && categories[deletingCategory]}"? Ta operacja jest nieodwracalna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingCategory) {
                  const updated = { ...categories };
                  delete updated[deletingCategory];
                  setCategories(updated);
                  toast.success('Kategoria została usunięta');
                  setDeletingCategory(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Product Confirmation */}
      <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć produkt?</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć produkt "{deletingProduct?.name}"? Ta operacja jest
              nieodwracalna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
