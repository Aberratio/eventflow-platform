import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft, Eye, Save, Plus, X, Palette, Star, ImagePlus,
} from 'lucide-react';
import { mockShopProducts, shopCategoryLabels } from '@/data/mockData';
import { ShopProduct, ShopCategory } from '@/types';
import { toast } from 'sonner';

export const AdminProductEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const categories: Record<string, string> = { ...shopCategoryLabels };

  const [form, setForm] = useState<Partial<ShopProduct>>({
    name: '', slug: '', description: '', price: 0, category: 'apparel',
    brand: '', imageUrl: '', inStock: true, isService: false,
  });

  const [newSize, setNewSize] = useState('');
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    if (id) {
      const product = mockShopProducts.find(p => p.id === id);
      if (product) setForm({ ...product });
      else {
        toast.error('Nie znaleziono produktu');
        navigate(-1);
      }
    }
  }, [id, navigate]);

  const handleSave = () => {
    if (!form.name || !form.price) {
      toast.error('Wypełnij wymagane pola');
      return;
    }
    toast.success(isNew ? 'Produkt został dodany' : 'Produkt został zaktualizowany');
    navigate(-1);
  };

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{isNew ? 'Nowy produkt' : 'Edycja produktu'}</h1>
              <p className="text-muted-foreground">
                {isNew ? 'Dodaj nowy produkt do sklepu' : form.name}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {!isNew && form.slug && (
              <Button variant="outline" className="gap-2" asChild>
                <a href={`/shop/${form.slug}`} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4" />
                  Podgląd w sklepie
                </a>
              </Button>
            )}
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              {isNew ? 'Dodaj produkt' : 'Zapisz zmiany'}
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Basic info */}
          <Card>
            <CardHeader><CardTitle>Podstawowe informacje</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Nazwa *</Label>
                <Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nazwa produktu" />
              </div>
              <div>
                <Label>Slug (URL)</Label>
                <Input value={form.slug || ''} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="nazwa-produktu" />
              </div>
              <div>
                <Label>Marka</Label>
                <Input value={form.brand || ''} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="ZmierzymyCzas" />
              </div>
              <div className="md:col-span-2">
                <Label>Opis</Label>
                <Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Opis produktu..." rows={4} />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader><CardTitle>Ceny i dostępność</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Cena *</Label>
                <Input type="number" value={form.price || ''} onChange={e => setForm({ ...form, price: Number(e.target.value) })} placeholder="0" />
              </div>
              <div>
                <Label>Cena oryginalna (opcjonalna)</Label>
                <Input type="number" value={form.originalPrice || ''} onChange={e => setForm({ ...form, originalPrice: Number(e.target.value) || undefined })} placeholder="0" />
              </div>
              <div>
                <Label>Kategoria</Label>
                <Select value={form.category || 'apparel'} onValueChange={v => setForm({ ...form, category: v as ShopCategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categories).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Stan magazynowy</Label>
                <Input type="number" value={form.stockCount || ''} onChange={e => setForm({ ...form, stockCount: Number(e.target.value) })} placeholder="0" disabled={form.isService} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.inStock || false} onCheckedChange={checked => setForm({ ...form, inStock: checked })} />
                <Label>Dostępny w sprzedaży</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.featured || false} onCheckedChange={checked => setForm({ ...form, featured: checked })} />
                <Label>Wyróżniony produkt</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isService || false} onCheckedChange={checked => setForm({ ...form, isService: checked })} />
                <Label>To jest usługa (bez dostawy)</Label>
              </div>
            </CardContent>
          </Card>

          {/* Service details */}
          {form.isService && (
            <Card>
              <CardHeader><CardTitle>Szczegóły usługi</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Szczegóły usługi</Label>
                  <Textarea value={form.serviceDetails || ''} onChange={e => setForm({ ...form, serviceDetails: e.target.value })} placeholder="Informacje o aktywacji, dostępie..." rows={2} />
                </div>
                <div>
                  <Label>Ważność (dni)</Label>
                  <Input type="number" value={form.validityDays || ''} onChange={e => setForm({ ...form, validityDays: Number(e.target.value) })} placeholder="365" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Images */}
          <Card>
            <CardHeader><CardTitle>Zdjęcia</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>URL głównego obrazu</Label>
                <Input value={form.imageUrl || ''} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <ImagePlus className="h-4 w-4" />
                  Galeria zdjęć
                </Label>
                <div className="space-y-2">
                  {(form.images || []).map((img, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <img src={img} alt="" className="h-10 w-10 rounded object-cover bg-muted" />
                      <Input value={img} readOnly className="flex-1 text-xs" />
                      <Button variant="ghost" size="icon" onClick={() => setForm({ ...form, images: (form.images || []).filter((_, i) => i !== idx) })}>
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} placeholder="URL dodatkowego zdjęcia..." className="flex-1" />
                    <Button variant="outline" size="sm" onClick={() => {
                      if (newImageUrl.trim()) {
                        setForm({ ...form, images: [...(form.images || []), newImageUrl.trim()] });
                        setNewImageUrl('');
                      }
                    }}>
                      <Plus className="h-4 w-4 mr-1" />Dodaj
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sizes & Colors - physical only */}
          {!form.isService && (
            <Card>
              <CardHeader><CardTitle>Warianty</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                {/* Sizes */}
                <div>
                  <Label className="mb-2 block">Rozmiary</Label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(form.sizes || []).map(size => (
                      <Badge key={size} variant="secondary" className="gap-1 pr-1">
                        {size}
                        <button onClick={() => setForm({ ...form, sizes: (form.sizes || []).filter(s => s !== size) })} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {(form.sizes || []).length === 0 && <span className="text-sm text-muted-foreground">Brak rozmiarów</span>}
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input value={newSize} onChange={e => setNewSize(e.target.value)} placeholder="np. M, XL, 42..." className="w-32"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newSize.trim()) {
                          e.preventDefault();
                          if (!(form.sizes || []).includes(newSize.trim())) {
                            setForm({ ...form, sizes: [...(form.sizes || []), newSize.trim()] });
                          }
                          setNewSize('');
                        }
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={() => {
                      if (newSize.trim() && !(form.sizes || []).includes(newSize.trim())) {
                        setForm({ ...form, sizes: [...(form.sizes || []), newSize.trim()] });
                        setNewSize('');
                      }
                    }}>Dodaj</Button>
                    <div className="flex gap-1 ml-2">
                      {form.category === 'apparel' && (
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setForm({ ...form, sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] })}>Preset: odzież</Button>
                      )}
                      {form.category === 'footwear' && (
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setForm({ ...form, sizes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'] })}>Preset: obuwie</Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Palette className="h-4 w-4" />
                    Kolory
                  </Label>
                  <div className="space-y-2 mb-2">
                    {(form.colors || []).map(color => (
                      <div key={color.id} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full border border-border" style={{ backgroundColor: color.hex }} />
                        <span className="text-sm">{color.name}</span>
                        <span className="text-xs text-muted-foreground">{color.hex}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => setForm({ ...form, colors: (form.colors || []).filter(c => c.id !== color.id) })}>
                          <X className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input value={newColorName} onChange={e => setNewColorName(e.target.value)} placeholder="Nazwa koloru..." className="w-40" />
                    <input type="color" value={newColorHex} onChange={e => setNewColorHex(e.target.value)} className="w-10 h-10 rounded cursor-pointer border border-border" />
                    <Button variant="outline" size="sm" onClick={() => {
                      if (newColorName.trim()) {
                        setForm({ ...form, colors: [...(form.colors || []), { id: `c-${Date.now()}`, name: newColorName.trim(), hex: newColorHex }] });
                        setNewColorName('');
                        setNewColorHex('#000000');
                      }
                    }}>Dodaj kolor</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rating (read-only) */}
          {!isNew && form.rating !== undefined && (
            <Card>
              <CardContent className="p-4">
                <Label className="flex items-center gap-2 mb-1">
                  <Star className="h-4 w-4 text-warning" />
                  Ocena i recenzje (tylko odczyt)
                </Label>
                <div className="flex items-center gap-4 text-sm">
                  <span>Ocena: <strong>{form.rating?.toFixed(1)}</strong> / 5</span>
                  <span>Recenzji: <strong>{form.reviewCount}</strong></span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};
