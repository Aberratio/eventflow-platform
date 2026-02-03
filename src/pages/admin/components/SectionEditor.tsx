import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { InfoPageSection, InfoPageSectionItem } from '@/types';

interface SectionEditorProps {
  section: InfoPageSection;
  onUpdate: (updates: Partial<InfoPageSection>) => void;
}

const iconOptions = [
  'Mail', 'Phone', 'MapPin', 'Clock', 'Calendar', 'CheckCircle', 'Star', 'Heart',
  'Users', 'Trophy', 'Target', 'Zap', 'Shield', 'Award', 'Rocket', 'Gift',
  'CreditCard', 'Package', 'Truck', 'Globe', 'Building', 'Home', 'Info', 'HelpCircle',
];

export const SectionEditor = ({ section, onUpdate }: SectionEditorProps) => {
  const addItem = () => {
    const newItem: InfoPageSectionItem = {
      id: `item-${Date.now()}`,
      title: '',
      description: '',
    };
    onUpdate({ items: [...(section.items || []), newItem] });
  };

  const updateItem = (itemId: string, updates: Partial<InfoPageSectionItem>) => {
    onUpdate({
      items: (section.items || []).map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    });
  };

  const deleteItem = (itemId: string) => {
    onUpdate({
      items: (section.items || []).filter(item => item.id !== itemId),
    });
  };

  // Hero section
  if (section.type === 'hero') {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label>Tytuł</Label>
          <Input
            value={section.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Tytuł główny strony"
          />
        </div>
        <div className="space-y-2">
          <Label>Podtytuł / opis</Label>
          <Textarea
            value={section.content || ''}
            onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder="Krótki opis lub podtytuł"
            rows={2}
          />
        </div>
      </div>
    );
  }

  // Text section
  if (section.type === 'text') {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label>Nagłówek sekcji (opcjonalnie)</Label>
          <Input
            value={section.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="np. Nasza historia"
          />
        </div>
        <div className="space-y-2">
          <Label>Treść</Label>
          <Textarea
            value={section.content || ''}
            onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder="Treść tekstowa (możesz użyć Markdown)"
            rows={6}
          />
        </div>
      </div>
    );
  }

  // CTA section
  if (section.type === 'cta') {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label>Tytuł CTA</Label>
          <Input
            value={section.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="np. Gotowy do działania?"
          />
        </div>
        <div className="space-y-2">
          <Label>Opis</Label>
          <Textarea
            value={section.content || ''}
            onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder="Tekst zachęcający do działania"
            rows={2}
          />
        </div>
      </div>
    );
  }

  // Cards, FAQ, Stats, Team, Pricing sections (with items)
  const getItemFields = () => {
    switch (section.type) {
      case 'cards':
        return ['title', 'description', 'icon', 'link'];
      case 'faq':
        return ['title', 'description'];
      case 'stats':
        return ['title', 'description'];
      case 'team':
        return ['title', 'description', 'image'];
      case 'pricing':
        return ['title', 'description', 'price', 'features'];
      default:
        return ['title', 'description'];
    }
  };

  const itemFields = getItemFields();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nagłówek sekcji (opcjonalnie)</Label>
        <Input
          value={section.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="np. Nasze usługi"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Elementy ({section.items?.length || 0})</Label>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            Dodaj
          </Button>
        </div>

        {(section.items || []).map((item, index) => (
          <div key={item.id} className="p-3 border rounded-lg space-y-2 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Element {index + 1}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => deleteItem(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-2">
              {itemFields.includes('title') && (
                <Input
                  value={item.title}
                  onChange={(e) => updateItem(item.id, { title: e.target.value })}
                  placeholder={section.type === 'faq' ? 'Pytanie' : section.type === 'stats' ? 'Wartość (np. 500+)' : 'Tytuł'}
                />
              )}

              {itemFields.includes('description') && (
                <Textarea
                  value={item.description}
                  onChange={(e) => updateItem(item.id, { description: e.target.value })}
                  placeholder={section.type === 'faq' ? 'Odpowiedź' : section.type === 'stats' ? 'Etykieta (np. Wydarzeń)' : 'Opis'}
                  rows={section.type === 'faq' ? 3 : 2}
                />
              )}

              {itemFields.includes('icon') && (
                <Select
                  value={item.icon || ''}
                  onValueChange={(value) => updateItem(item.id, { icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz ikonę" />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map(icon => (
                      <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {itemFields.includes('link') && (
                <Input
                  value={item.link || ''}
                  onChange={(e) => updateItem(item.id, { link: e.target.value })}
                  placeholder="Link (opcjonalnie)"
                />
              )}

              {itemFields.includes('image') && (
                <Input
                  value={item.image || ''}
                  onChange={(e) => updateItem(item.id, { image: e.target.value })}
                  placeholder="URL zdjęcia"
                />
              )}

              {itemFields.includes('price') && (
                <Input
                  type="number"
                  value={item.price || ''}
                  onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                  placeholder="Cena"
                />
              )}

              {itemFields.includes('features') && (
                <Textarea
                  value={item.features?.join('\n') || ''}
                  onChange={(e) => updateItem(item.id, { features: e.target.value.split('\n').filter(Boolean) })}
                  placeholder="Funkcje (każda w nowej linii)"
                  rows={3}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
