import {
  createProduct,
  getProductById,
  getShopCategories,
  updateProduct,
} from '@/api';
import { QUERY_KEYS } from '@/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import { ShopProduct } from '@/types';
import { toast } from 'sonner';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

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

  const saveMutation = useMutation({
    mutationFn: () => isNew ? createProduct(form as ShopProduct) : updateProduct(id!, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      toast.success(isNew ? 'Produkt został dodany' : 'Produkt został zapisany');
      navigate(-1);
    },
  });

  const setName = (name: string) =>
    setForm((prev) => ({ ...prev, name, slug: prev.slug ? prev.slug : slugify(name) }));

  const categories = categoriesData?.data ?? [];

  return (
    <Layout>
      <div className="container max-w-4xl py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Powrót
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" /> Zapisz
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{isNew ? 'Nowy produkt' : 'Edycja produktu'}</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Nazwa</Label>
                <Input value={form.name ?? ''} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={form.slug ?? ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div>
                <Label>Marka</Label>
                <Input value={form.brand ?? ''} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              </div>
              <div>
                <Label>Kategoria</Label>
                <Select value={form.category} onValueChange={(category) => setForm({ ...form, category })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Opis</Label>
                <Textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <Label>Cena</Label>
                <Input type="number" value={form.price ?? 0} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Cena oryginalna</Label>
                <Input type="number" value={form.originalPrice ?? ''} onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) || undefined })} />
              </div>
              <div>
                <Label>Stan magazynowy</Label>
                <Input type="number" value={form.stockCount ?? ''} disabled={form.isService} onChange={(e) => setForm({ ...form, stockCount: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status ?? 'active'} onValueChange={(status) => setForm({ ...form, status: status as ShopProduct['status'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktywny</SelectItem>
                    <SelectItem value="archived">Archiwalny</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>URL głównego obrazu</Label>
                <Input value={form.imageUrl ?? ''} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
              </div>
              <div className="flex items-center gap-2"><Switch checked={!!form.inStock} onCheckedChange={(inStock) => setForm({ ...form, inStock })} /><Label>Dostępny</Label></div>
              <div className="flex items-center gap-2"><Switch checked={!!form.featured} onCheckedChange={(featured) => setForm({ ...form, featured })} /><Label>Wyróżniony</Label></div>
              <div className="flex items-center gap-2"><Switch checked={!!form.isService} onCheckedChange={(isService) => setForm({ ...form, isService })} /><Label>Usługa</Label></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
