import { createProduct, getProductById, getShopCategories, updateProduct } from '@/api';
import { QUERY_KEYS } from '@/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, X } from 'lucide-react';
import { MerchandiseColor, ShopProduct } from '@/types';
import { toast } from 'sonner';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

/** Mirrors the server's POST/PATCH /shop/products validation (routes.php
 * `$validateShopProduct`) so the admin gets immediate feedback instead of
 * a round trip to discover a required field is missing. */
const validateProductForm = (form: Partial<ShopProduct>): string | null => {
  const required: Array<[keyof ShopProduct, string]> = [
    ['name', 'Nazwa'],
    ['slug', 'Slug'],
    ['description', 'Opis'],
    ['category', 'Kategoria'],
    ['brand', 'Marka'],
    ['imageUrl', 'URL g\u0142\u00f3wnego obrazu'],
  ];
  for (const [field, label] of required) {
    if (!String(form[field] ?? '').trim()) {
      return `Pole "${label}" jest wymagane.`;
    }
  }
  if (form.price === undefined || form.price === null || Number.isNaN(Number(form.price))) {
    return 'Cena jest wymagana.';
  }
  if (Number(form.price) < 0) {
    return 'Cena nie mo\u017ce by\u0107 ujemna.';
  }
  return null;
};

export const AdminProductEditPage = () => {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: productData } = useQuery({
    queryKey: id ? ['product', id] : ['product', 'new'],
    queryFn: () => getProductById(id!),
    enabled: !!id,
  });
  const { data: categoriesData } = useQuery({
    queryKey: [...QUERY_KEYS.shopCategories, 'staff'],
    queryFn: () => getShopCategories(true),
  });

  const [form, setForm] = useState<Partial<ShopProduct>>({
    name: '',
    slug: '',
    description: '',
    price: 0,
    category: 'apparel',
    brand: 'ZmierzymyCzas',
    imageUrl: '',
    inStock: true,
    stockCount: 0,
    featured: false,
    isService: false,
    status: 'active',
  });

  useEffect(() => {
    if (productData?.data) setForm(productData.data);
  }, [productData?.data]);

  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');

  const saveMutation = useMutation({
    mutationFn: () => (isNew ? createProduct(form as ShopProduct) : updateProduct(id!, form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      toast.success(isNew ? 'Produkt został dodany' : 'Produkt został zapisany');
      navigate(-1);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Nie udało się zapisać produktu');
    },
  });

  const handleSave = () => {
    const validationError = validateProductForm(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    saveMutation.mutate();
  };

  const setName = (name: string) =>
    setForm((prev) => ({ ...prev, name, slug: prev.slug ? prev.slug : slugify(name) }));

  const toggleSize = (size: string) => {
    setForm((prev) => {
      const sizes = prev.sizes ?? [];
      return {
        ...prev,
        sizes: sizes.includes(size) ? sizes.filter((s) => s !== size) : [...sizes, size],
      };
    });
  };

  const addColor = () => {
    if (!newColorName.trim()) return;
    const color: MerchandiseColor = {
      id: slugify(newColorName) || `color-${Date.now()}`,
      name: newColorName,
      hex: newColorHex,
    };
    setForm((prev) => ({ ...prev, colors: [...(prev.colors ?? []), color] }));
    setNewColorName('');
    setNewColorHex('#000000');
  };

  const removeColor = (colorId: string) =>
    setForm((prev) => ({ ...prev, colors: (prev.colors ?? []).filter((c) => c.id !== colorId) }));

  const categories = categoriesData?.data ?? [];

  return (
    <Layout>
      <div className="container max-w-4xl py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Powrót
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" /> Zapisz
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{isNew ? 'Nowy produkt' : 'Edycja produktu'}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="product-name">Nazwa</Label>
                <Input
                  id="product-name"
                  value={form.name ?? ''}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="product-slug">Slug</Label>
                <Input
                  id="product-slug"
                  value={form.slug ?? ''}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="product-brand">Marka</Label>
                <Input
                  id="product-brand"
                  value={form.brand ?? ''}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="product-category">Kategoria</Label>
                <Select
                  value={form.category}
                  onValueChange={(category) => setForm({ ...form, category })}
                >
                  <SelectTrigger id="product-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="product-description">Opis</Label>
                <Textarea
                  id="product-description"
                  value={form.description ?? ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="product-price">Cena</Label>
                <Input
                  id="product-price"
                  type="number"
                  value={form.price ?? 0}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="product-original-price">Cena oryginalna</Label>
                <Input
                  id="product-original-price"
                  type="number"
                  value={form.originalPrice ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, originalPrice: Number(e.target.value) || undefined })
                  }
                />
              </div>
              <div>
                <Label htmlFor="product-stock-count">Stan magazynowy</Label>
                <Input
                  id="product-stock-count"
                  type="number"
                  value={form.stockCount ?? ''}
                  disabled={form.isService}
                  onChange={(e) => setForm({ ...form, stockCount: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="product-status">Status</Label>
                <Select
                  value={form.status ?? 'active'}
                  onValueChange={(status) =>
                    setForm({ ...form, status: status as ShopProduct['status'] })
                  }
                >
                  <SelectTrigger id="product-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktywny</SelectItem>
                    <SelectItem value="archived">Archiwalny</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="product-image-url">URL głównego obrazu</Label>
                <Input
                  id="product-image-url"
                  value={form.imageUrl ?? ''}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="product-in-stock"
                  checked={!!form.inStock}
                  onCheckedChange={(inStock) => setForm({ ...form, inStock })}
                />
                <Label htmlFor="product-in-stock">Dostępny</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="product-featured"
                  checked={!!form.featured}
                  onCheckedChange={(featured) => setForm({ ...form, featured })}
                />
                <Label htmlFor="product-featured">Wyróżniony</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="product-is-service"
                  checked={!!form.isService}
                  onCheckedChange={(isService) => setForm({ ...form, isService })}
                />
                <Label htmlFor="product-is-service">Usługa</Label>
              </div>
            </CardContent>
          </Card>

          {!form.isService && (
            <Card>
              <CardHeader>
                <CardTitle>Warianty</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <fieldset className="m-0 space-y-2 border-0 p-0">
                  <legend className="text-xs font-semibold leading-none text-foreground">
                    Dostępne rozmiary
                  </legend>
                  <div className="flex flex-wrap gap-3">
                    {availableSizes.map((size) => (
                      <div key={size} className="flex items-center space-x-2">
                        <Checkbox
                          id={`size-${size}`}
                          checked={(form.sizes ?? []).includes(size)}
                          onCheckedChange={() => toggleSize(size)}
                        />
                        <Label htmlFor={`size-${size}`} className="cursor-pointer text-sm">
                          {size}
                        </Label>
                      </div>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="m-0 space-y-2 border-0 p-0">
                  <legend className="text-xs font-semibold leading-none text-foreground">
                    Dostępne kolory
                  </legend>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {(form.colors ?? []).map((color) => (
                      <Badge key={color.id} variant="outline" className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full border"
                          style={{ backgroundColor: color.hex }}
                        />
                        {color.name}
                        <button
                          type="button"
                          aria-label={`Usuń kolor ${color.name}`}
                          onClick={() => removeColor(color.id)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      aria-label="Nazwa koloru"
                      placeholder="Nazwa koloru"
                      value={newColorName}
                      onChange={(e) => setNewColorName(e.target.value)}
                      className="max-w-xs flex-1"
                    />
                    <Input
                      aria-label="Kolor"
                      type="color"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      className="h-10 w-14 p-1"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addColor}>
                      Dodaj kolor
                    </Button>
                  </div>
                </fieldset>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};
