import {
  createShopCategory,
  deleteProduct,
  deleteShopCategory,
  getProducts,
  getShopCategories,
} from '@/api';
import { QUERY_KEYS } from '@/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Box,
  Infinity as InfinityIcon,
  Package,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
} from 'lucide-react';
import { ShopCategory } from '@/types';
import { toast } from 'sonner';
import { formatMoney } from '@/lib/format';

export const AdminShopTab = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ShopCategory | 'all'>('all');
  const [availability, setAvailability] = useState<'all' | 'inStock' | 'outOfStock'>('all');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  const { data: productsData } = useQuery({
    queryKey: [...QUERY_KEYS.products, 'staff'],
    queryFn: () => getProducts({ includeArchived: true }),
  });
  const { data: categoriesData } = useQuery({
    queryKey: [...QUERY_KEYS.shopCategories, 'staff'],
    queryFn: () => getShopCategories(true),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shopCategories });
  };

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      invalidate();
      toast.success('Produkt został zarchiwizowany');
    },
  });
  const deleteCategoryMutation = useMutation({
    mutationFn: deleteShopCategory,
    onSuccess: () => {
      invalidate();
      toast.success('Kategoria została zarchiwizowana');
    },
  });
  const createCategoryMutation = useMutation({
    mutationFn: createShopCategory,
    onSuccess: () => {
      invalidate();
      setNewCategoryId('');
      setNewCategoryName('');
      toast.success('Kategoria została dodana');
    },
  });

  const products = useMemo(() => productsData?.data ?? [], [productsData]);
  const categories = categoriesData?.data ?? [];
  const categoryLabels = Object.fromEntries(categories.map((item) => [item.id, item.name]));

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const q = search.toLowerCase();
      const matchesSearch =
        product.name.toLowerCase().includes(q) || product.brand.toLowerCase().includes(q);
      const matchesCategory = category === 'all' || product.category === category;
      const matchesAvailability =
        availability === 'all' ||
        (availability === 'inStock' && product.inStock) ||
        (availability === 'outOfStock' && !product.inStock);
      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [availability, category, products, search]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Zarządzanie sklepem</h2>
        <p className="text-muted-foreground">Produkty i kategorie z API</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Package className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{products.length}</p>
              <p className="text-xs text-muted-foreground">Produktów</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Box className="h-5 w-5 text-success" />
            <div>
              <p className="text-2xl font-bold">{products.filter((p) => p.inStock).length}</p>
              <p className="text-xs text-muted-foreground">Dostępnych</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button
          variant={activeTab === 'products' ? 'default' : 'outline'}
          onClick={() => setActiveTab('products')}
        >
          <Package className="mr-2 h-4 w-4" /> Produkty
        </Button>
        <Button
          variant={activeTab === 'categories' ? 'default' : 'outline'}
          onClick={() => setActiveTab('categories')}
        >
          <Tags className="mr-2 h-4 w-4" /> Kategorie
        </Button>
      </div>

      {activeTab === 'products' ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Szukaj produktów..."
                  className="pl-10"
                />
              </div>
              <Select value={category} onValueChange={(value) => setCategory(value)}>
                <SelectTrigger className="lg:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  {categories.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={availability}
                onValueChange={(value) => setAvailability(value as typeof availability)}
              >
                <SelectTrigger className="lg:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  <SelectItem value="inStock">Dostępne</SelectItem>
                  <SelectItem value="outOfStock">Niedostępne</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => navigate('/admin/shop/products/new')}>
                <Plus className="mr-2 h-4 w-4" /> Dodaj
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produkt</TableHead>
                  <TableHead>Kategoria</TableHead>
                  <TableHead className="text-right">Cena</TableHead>
                  <TableHead className="text-center">Stan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-11 w-11 rounded object-cover"
                        />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.brand}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {categoryLabels[product.category] ?? product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatMoney(product.price)}</TableCell>
                    <TableCell className="text-center">
                      {product.isService ? (
                        <InfinityIcon className="mx-auto h-4 w-4" />
                      ) : (
                        (product.stockCount ?? '-')
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product.status === 'archived'
                            ? 'secondary'
                            : product.inStock
                              ? 'default'
                              : 'outline'
                        }
                      >
                        {product.status === 'archived'
                          ? 'Archiwalny'
                          : product.inStock
                            ? 'Dostępny'
                            : 'Niedostępny'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
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
                        onClick={() => deleteProductMutation.mutate(product.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Kategorie produktów</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Klucz</TableHead>
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono">{item.id}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.status === 'archived' ? 'Archiwalna' : 'Aktywna'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCategoryMutation.mutate(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="grid gap-3 rounded border p-4 md:grid-cols-[1fr_1fr_auto]">
              <div>
                <Label>Klucz</Label>
                <Input
                  value={newCategoryId}
                  onChange={(e) =>
                    setNewCategoryId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))
                  }
                />
              </div>
              <div>
                <Label>Nazwa</Label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>
              <Button
                className="self-end"
                disabled={!newCategoryId || !newCategoryName}
                onClick={() =>
                  createCategoryMutation.mutate({ id: newCategoryId, name: newCategoryName })
                }
              >
                Dodaj
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
