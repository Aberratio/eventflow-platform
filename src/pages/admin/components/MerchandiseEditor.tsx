import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { EventMerchandise, MerchandiseColor } from '@/types';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

interface MerchandiseEditorProps {
  merchandise: EventMerchandise[];
  onChange: (merchandise: EventMerchandise[]) => void;
}

const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

export const MerchandiseEditor = ({ merchandise, onChange }: MerchandiseEditorProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EventMerchandise | null>(null);
  const [formData, setFormData] = useState<Omit<EventMerchandise, 'id'>>({
    name: '',
    description: '',
    price: 0,
    sizes: [],
    colors: [],
    imageUrl: '',
    available: true,
  });
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      sizes: [],
      colors: [],
      imageUrl: '',
      available: true,
    });
    setNewColorName('');
    setNewColorHex('#000000');
  };

  const handleAddItem = () => {
    const newItem: EventMerchandise = {
      id: `merch_${Date.now()}`,
      ...formData,
    };
    onChange([...merchandise, newItem]);
    toast.success(`Produkt "${formData.name}" został dodany`);
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditItem = () => {
    if (!editingItem) return;
    onChange(
      merchandise.map((item) => (item.id === editingItem.id ? { ...item, ...formData } : item)),
    );
    toast.success(`Produkt "${formData.name}" został zaktualizowany`);
    resetForm();
    setEditingItem(null);
  };

  const handleDeleteItem = (item: EventMerchandise) => {
    onChange(merchandise.filter((m) => m.id !== item.id));
    toast.success(`Produkt "${item.name}" został usunięty`);
  };

  const openEditDialog = (item: EventMerchandise) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      sizes: item.sizes,
      colors: item.colors,
      imageUrl: item.imageUrl || '',
      available: item.available,
    });
  };

  const toggleSize = (size: string) => {
    const newSizes = formData.sizes.includes(size)
      ? formData.sizes.filter((s) => s !== size)
      : [...formData.sizes, size];
    setFormData({ ...formData, sizes: newSizes });
  };

  const addColor = () => {
    if (!newColorName.trim()) return;
    const newColor: MerchandiseColor = {
      id: `color_${Date.now()}`,
      name: newColorName,
      hex: newColorHex,
    };
    setFormData({ ...formData, colors: [...formData.colors, newColor] });
    setNewColorName('');
    setNewColorHex('#000000');
  };

  const removeColor = (colorId: string) => {
    setFormData({
      ...formData,
      colors: formData.colors.filter((c) => c.id !== colorId),
    });
  };

  const ProductForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nazwa produktu</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="np. Koszulka pamiątkowa"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Opis (opcjonalnie)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Krótki opis produktu..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Cena (PLN)</Label>
        <Input
          id="price"
          type="number"
          min="0"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
        />
      </div>

      <div className="space-y-2">
        <Label>Dostępne rozmiary</Label>
        <div className="flex flex-wrap gap-2">
          {availableSizes.map((size) => (
            <div key={size} className="flex items-center space-x-2">
              <Checkbox
                id={`size-${size}`}
                checked={formData.sizes.includes(size)}
                onCheckedChange={() => toggleSize(size)}
              />
              <Label htmlFor={`size-${size}`} className="cursor-pointer text-sm">
                {size}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Dostępne kolory</Label>
        <div className="mb-2 flex flex-wrap gap-2">
          {formData.colors.map((color) => (
            <Badge key={color.id} variant="outline" className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full border"
                style={{ backgroundColor: color.hex }}
              />
              {color.name}
              <button
                type="button"
                onClick={() => removeColor(color.id)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Nazwa koloru"
            value={newColorName}
            onChange={(e) => setNewColorName(e.target.value)}
            className="flex-1"
          />
          <Input
            type="color"
            value={newColorHex}
            onChange={(e) => setNewColorHex(e.target.value)}
            className="h-10 w-14 p-1"
          />
          <Button type="button" variant="outline" size="sm" onClick={addColor}>
            Dodaj
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">URL obrazka (opcjonalnie)</Label>
        <Input
          id="imageUrl"
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="available">Produkt dostępny</Label>
        <Switch
          id="available"
          checked={formData.available}
          onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
        />
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Przedmioty do kupienia</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Dodaj produkt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Dodaj nowy produkt</DialogTitle>
            </DialogHeader>
            <ProductForm />
            <Button onClick={handleAddItem} className="mt-4 w-full">
              Dodaj produkt
            </Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {merchandise.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Brak produktów. Kliknij "Dodaj produkt", aby dodać pierwszy.
          </p>
        ) : (
          <div className="space-y-4">
            {merchandise.map((item) => (
              <div key={item.id} className="flex items-start gap-4 rounded-lg border p-4">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-16 w-16 rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{item.price} PLN</span>
                      {!item.available && (
                        <Badge variant="outline" className="ml-2 text-destructive">
                          Niedostępny
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.sizes.map((size) => (
                      <Badge key={size} variant="secondary" className="text-xs">
                        {size}
                      </Badge>
                    ))}
                    {item.colors.map((color) => (
                      <Badge key={color.id} variant="outline" className="text-xs">
                        <span
                          className="mr-1 h-2 w-2 rounded-full"
                          style={{ backgroundColor: color.hex }}
                        />
                        {color.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Dialog
                    open={editingItem?.id === item.id}
                    onOpenChange={(open) => {
                      if (!open) setEditingItem(null);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Edytuj produkt</DialogTitle>
                      </DialogHeader>
                      <ProductForm />
                      <Button onClick={handleEditItem} className="mt-4 w-full">
                        Zapisz zmiany
                      </Button>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteItem(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
