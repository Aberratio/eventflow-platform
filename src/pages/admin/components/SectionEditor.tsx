import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { InfoPageSection, InfoPageSectionItem } from '@/types';

interface SectionEditorProps {
  section: InfoPageSection;
  onUpdate: (updates: Partial<InfoPageSection>) => void;
}

const iconOptions = [
  'Mail',
  'Phone',
  'MapPin',
  'Clock',
  'Calendar',
  'CheckCircle',
  'Star',
  'Heart',
  'Users',
  'Trophy',
  'Target',
  'Zap',
  'Shield',
  'Award',
  'Rocket',
  'Gift',
  'CreditCard',
  'Package',
  'Truck',
  'Globe',
  'Building',
  'Home',
  'Info',
  'HelpCircle',
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
      items: (section.items || []).map((item) =>
        item.id === itemId ? { ...item, ...updates } : item,
      ),
    });
  };

  const deleteItem = (itemId: string) => {
    onUpdate({
      items: (section.items || []).filter((item) => item.id !== itemId),
    });
  };

  // Hero section
  if (section.type === 'hero') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Tytuł główny</Label>
          <Input
            value={section.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="np. Witamy w ZmierzymyCzas"
          />
        </div>
        <div className="space-y-2">
          <Label>Podtytuł / opis</Label>
          <Textarea
            value={section.content || ''}
            onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder="Krótki opis lub hasło przewodnie"
            rows={2}
          />
        </div>
      </div>
    );
  }

  // Text section
  if (section.type === 'text') {
    return (
      <div className="space-y-4">
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
            placeholder="Treść tekstowa. Użyj nowych linii do tworzenia akapitów."
            rows={8}
          />
          <p className="text-xs text-muted-foreground">
            Użyj nowych linii (Enter), aby rozdzielić akapity.
          </p>
        </div>
      </div>
    );
  }

  // CTA section
  if (section.type === 'cta') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Tytuł CTA</Label>
          <Input
            value={section.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="np. Gotowy do działania?"
          />
        </div>
        <div className="space-y-2">
          <Label>Opis zachęcający</Label>
          <Textarea
            value={section.content || ''}
            onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder="Tekst zachęcający do podjęcia akcji"
            rows={2}
          />
        </div>
      </div>
    );
  }

  // Sections with items (cards, faq, stats, team, pricing)
  const getItemConfig = () => {
    switch (section.type) {
      case 'cards':
        return {
          titleLabel: 'Tytuł karty',
          titlePlaceholder: 'np. Email',
          descLabel: 'Opis / wartość',
          descPlaceholder: 'np. kontakt@zmierzymyczas.pl',
          showIcon: true,
          showLink: true,
        };
      case 'faq':
        return {
          titleLabel: 'Pytanie',
          titlePlaceholder: 'np. Jak się zarejestrować?',
          descLabel: 'Odpowiedź',
          descPlaceholder: 'Wpisz odpowiedź na pytanie...',
          descRows: 3,
        };
      case 'stats':
        return {
          titleLabel: 'Wartość',
          titlePlaceholder: 'np. 500+',
          descLabel: 'Etykieta',
          descPlaceholder: 'np. Wydarzeń',
        };
      case 'team':
        return {
          titleLabel: 'Imię i nazwisko',
          titlePlaceholder: 'np. Jan Kowalski',
          descLabel: 'Stanowisko',
          descPlaceholder: 'np. CEO',
          showImage: true,
        };
      case 'pricing':
        return {
          titleLabel: 'Nazwa pakietu',
          titlePlaceholder: 'np. Pro',
          descLabel: 'Opis pakietu',
          descPlaceholder: 'np. Dla średnich wydarzeń',
          showPrice: true,
          showFeatures: true,
        };
      default:
        return {
          titleLabel: 'Tytuł',
          titlePlaceholder: 'Tytuł',
          descLabel: 'Opis',
          descPlaceholder: 'Opis',
        };
    }
  };

  const config = getItemConfig();

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
            <Plus className="mr-1 h-4 w-4" />
            Dodaj element
          </Button>
        </div>

        {(section.items || []).length === 0 && (
          <p className="rounded-lg border-2 border-dashed py-4 text-center text-sm text-muted-foreground">
            Brak elementów. Kliknij "Dodaj element", aby dodać pierwszy.
          </p>
        )}

        {(section.items || []).map((item, index) => (
          <div key={item.id} className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Element {index + 1}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => deleteItem(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{config.titleLabel}</Label>
                <Input
                  value={item.title}
                  onChange={(e) => updateItem(item.id, { title: e.target.value })}
                  placeholder={config.titlePlaceholder}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{config.descLabel}</Label>
                <Textarea
                  value={item.description}
                  onChange={(e) => updateItem(item.id, { description: e.target.value })}
                  placeholder={config.descPlaceholder}
                  rows={config.descRows || 2}
                />
              </div>

              {config.showIcon && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Ikona</Label>
                  <Select
                    value={item.icon || ''}
                    onValueChange={(value) => updateItem(item.id, { icon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz ikonę" />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          {icon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {config.showLink && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Link (opcjonalnie)</Label>
                  <Input
                    value={item.link || ''}
                    onChange={(e) => updateItem(item.id, { link: e.target.value })}
                    placeholder="np. /kontakt lub https://..."
                  />
                </div>
              )}

              {config.showImage && (
                <div className="space-y-1.5">
                  <Label className="text-xs">URL zdjęcia</Label>
                  <Input
                    value={item.image || ''}
                    onChange={(e) => updateItem(item.id, { image: e.target.value })}
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
              )}

              {config.showPrice && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Cena (PLN)</Label>
                  <Input
                    type="number"
                    value={item.price || ''}
                    onChange={(e) =>
                      updateItem(item.id, { price: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="np. 299"
                  />
                  <p className="text-xs text-muted-foreground">Wpisz 0 dla darmowego pakietu</p>
                </div>
              )}

              {config.showFeatures && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Funkcje (każda w nowej linii)</Label>
                  <Textarea
                    value={item.features?.join('\n') || ''}
                    onChange={(e) =>
                      updateItem(item.id, { features: e.target.value.split('\n').filter(Boolean) })
                    }
                    placeholder="Funkcja 1&#10;Funkcja 2&#10;Funkcja 3"
                    rows={4}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
