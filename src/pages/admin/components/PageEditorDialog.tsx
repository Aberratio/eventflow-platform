import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, ArrowUp, ArrowDown, Trash2, Type, LayoutGrid, HelpCircle, BarChart3, UsersRound, CreditCard, Megaphone, Image } from 'lucide-react';
import { InfoPage, InfoPageSection, InfoPageSectionType } from '@/types';
import { SectionEditor } from './SectionEditor';

interface PageEditorDialogProps {
  page: InfoPage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (page: InfoPage) => void;
}

const iconOptions = [
  { value: 'Mail', label: 'Koperta (Mail)' },
  { value: 'Gift', label: 'Prezent (Gift)' },
  { value: 'Shield', label: 'Tarcza (Shield)' },
  { value: 'Users', label: 'Użytkownicy (Users)' },
  { value: 'HelpCircle', label: 'Pomoc (HelpCircle)' },
  { value: 'FileText', label: 'Dokument (FileText)' },
  { value: 'Scale', label: 'Waga (Scale)' },
  { value: 'CreditCard', label: 'Karta (CreditCard)' },
  { value: 'Settings', label: 'Ustawienia (Settings)' },
  { value: 'Info', label: 'Info (Info)' },
];

const sectionTypes: { type: InfoPageSectionType; label: string; icon: React.ReactNode }[] = [
  { type: 'hero', label: 'Nagłówek (Hero)', icon: <Image className="h-4 w-4" /> },
  { type: 'text', label: 'Tekst', icon: <Type className="h-4 w-4" /> },
  { type: 'cards', label: 'Karty', icon: <LayoutGrid className="h-4 w-4" /> },
  { type: 'faq', label: 'FAQ', icon: <HelpCircle className="h-4 w-4" /> },
  { type: 'stats', label: 'Statystyki', icon: <BarChart3 className="h-4 w-4" /> },
  { type: 'team', label: 'Zespół', icon: <UsersRound className="h-4 w-4" /> },
  { type: 'pricing', label: 'Cennik', icon: <CreditCard className="h-4 w-4" /> },
  { type: 'cta', label: 'Call to Action', icon: <Megaphone className="h-4 w-4" /> },
];

export const PageEditorDialog = ({ page, open, onOpenChange, onSave }: PageEditorDialogProps) => {
  const [formData, setFormData] = useState<InfoPage>(page);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
      .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
      .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const handleAddSection = (type: InfoPageSectionType) => {
    const newSection: InfoPageSection = {
      id: `section-${Date.now()}`,
      type,
      title: '',
      content: '',
      items: type === 'text' || type === 'hero' || type === 'cta' ? undefined : [],
    };
    setFormData(prev => ({
      ...prev,
      content: [...prev.content, newSection],
    }));
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<InfoPageSection>) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content.map(s =>
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    }));
  };

  const handleDeleteSection = (sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content.filter(s => s.id !== sectionId),
    }));
  };

  const handleMoveSection = (sectionId: string, direction: 'up' | 'down') => {
    const index = formData.content.findIndex(s => s.id === sectionId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === formData.content.length - 1)
    ) return;

    const newContent = [...formData.content];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newContent[index], newContent[swapIndex]] = [newContent[swapIndex], newContent[index]];
    setFormData(prev => ({ ...prev, content: newContent }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  const isValid = formData.title.trim() && formData.slug.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {page.id.startsWith('page-') && !page.title ? 'Nowa strona' : `Edytuj stronę: ${page.title}`}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tytuł strony *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="np. O nas"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug URL *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="np. o-nas"
                />
                <p className="text-xs text-muted-foreground">
                  Podgląd: /info/{formData.slug || 'slug'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Ikona</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz ikonę" />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Krótki opis (SEO)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Opis wyświetlany w wynikach wyszukiwania"
                />
              </div>
            </div>

            {/* Visibility settings */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="published"
                      checked={formData.published}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({ ...prev, published: checked === true }))
                      }
                    />
                    <Label htmlFor="published">Opublikowana</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showInFooter"
                      checked={formData.showInFooter}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({ ...prev, showInFooter: checked === true }))
                      }
                    />
                    <Label htmlFor="showInFooter">Pokazuj w stopce</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showInHeader"
                      checked={formData.showInHeader}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({ ...prev, showInHeader: checked === true }))
                      }
                    />
                    <Label htmlFor="showInHeader">Pokazuj w nagłówku</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Sections */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Sekcje treści</h3>
                <Select onValueChange={(type) => handleAddSection(type as InfoPageSectionType)}>
                  <SelectTrigger className="w-[200px]">
                    <Plus className="h-4 w-4 mr-2" />
                    <span>Dodaj sekcję</span>
                  </SelectTrigger>
                  <SelectContent>
                    {sectionTypes.map(st => (
                      <SelectItem key={st.type} value={st.type}>
                        <div className="flex items-center gap-2">
                          {st.icon}
                          <span>{st.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.content.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p>Brak sekcji. Dodaj pierwszą sekcję używając przycisku powyżej.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.content.map((section, index) => (
                    <Card key={section.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={index === 0}
                              onClick={() => handleMoveSection(section.id, 'up')}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={index === formData.content.length - 1}
                              onClick={() => handleMoveSection(section.id, 'down')}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {sectionTypes.find(st => st.type === section.type)?.icon}
                                <span className="font-medium">
                                  {sectionTypes.find(st => st.type === section.type)?.label}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteSection(section.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <SectionEditor
                              section={section}
                              onUpdate={(updates) => handleUpdateSection(section.id, updates)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Zapisz zmiany
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
