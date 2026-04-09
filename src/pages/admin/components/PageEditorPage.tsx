import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EditorHint } from '@/components/admin/EditorHint';
import { SectionEditor } from './SectionEditor';
import { mockInfoPages } from '@/api/mock/cms.mock';
import { InfoPage, InfoPageSection } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  FileText,
  Type,
  LayoutGrid,
  HelpCircle,
  BarChart3,
  Users,
  CreditCard,
  Megaphone,
  Mail,
  Gift,
  Shield,
  Scale,
  Package,
} from 'lucide-react';

const iconOptions = [
  { value: 'FileText', label: 'Dokument', icon: FileText },
  { value: 'Mail', label: 'Email', icon: Mail },
  { value: 'Gift', label: 'Prezent', icon: Gift },
  { value: 'Shield', label: 'Tarcza', icon: Shield },
  { value: 'Users', label: 'Użytkownicy', icon: Users },
  { value: 'HelpCircle', label: 'Pomoc', icon: HelpCircle },
  { value: 'Scale', label: 'Waga', icon: Scale },
  { value: 'CreditCard', label: 'Karta', icon: CreditCard },
  { value: 'Package', label: 'Paczka', icon: Package },
];

const sectionTypes = [
  { type: 'hero', label: 'Nagłówek', icon: Type, description: 'Sekcja powitalna na górze strony' },
  { type: 'text', label: 'Tekst', icon: FileText, description: 'Blok tekstu z formatowaniem' },
  { type: 'cards', label: 'Karty', icon: LayoutGrid, description: 'Siatka kart z ikonami' },
  { type: 'faq', label: 'FAQ', icon: HelpCircle, description: 'Rozwijane pytania i odpowiedzi' },
  { type: 'stats', label: 'Statystyki', icon: BarChart3, description: 'Liczby i osiągnięcia' },
  { type: 'team', label: 'Zespół', icon: Users, description: 'Lista osób z avatarami' },
  { type: 'pricing', label: 'Cennik', icon: CreditCard, description: 'Tabela z pakietami' },
  { type: 'cta', label: 'CTA', icon: Megaphone, description: 'Wezwanie do działania' },
] as const;

const sectionHints: Record<string, string> = {
  hero: 'Sekcja powitalna na górze strony. Przyciąga uwagę odwiedzających i wprowadza w temat strony.',
  text: 'Blok tekstu. Możesz użyć nowych linii do tworzenia akapitów. Idealne do opisów i artykułów.',
  cards: 'Siatka kart z ikonami. Idealna do prezentacji usług, funkcji lub danych kontaktowych.',
  faq: 'Rozwijane pytania i odpowiedzi. Użytkownicy klikają pytanie, aby zobaczyć odpowiedź.',
  stats: 'Wyświetla liczby w atrakcyjny sposób. Idealne do pokazania osiągnięć i statystyk.',
  team: 'Lista osób z avatarami. Pokazuje członków zespołu lub partnerów.',
  pricing: 'Tabela z pakietami cenowymi. Środkowy pakiet jest automatycznie wyróżniony.',
  cta: 'Wezwanie do działania. Zachęca użytkowników do kontaktu lub rejestracji.',
};

export const PageEditorPage = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNewPage = pageId === 'new';

  const [formData, setFormData] = useState<InfoPage>({
    id: `page-${Date.now()}`,
    title: '',
    slug: '',
    icon: 'FileText',
    description: '',
    content: [],
    published: false,
    showInFooter: false,
    showInHeader: false,
    order: mockInfoPages.length + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [showAddSection, setShowAddSection] = useState(false);

  useEffect(() => {
    if (!isNewPage && pageId) {
      const page = mockInfoPages.find((p) => p.id === pageId);
      if (page) {
        setFormData(page);
      } else {
        toast({ title: 'Nie znaleziono strony', variant: 'destructive' });
        navigate('/admin?tab=pages');
      }
    }
  }, [pageId, isNewPage, navigate, toast]);

  const updateField = <K extends keyof InfoPage>(field: K, value: InfoPage[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[ąĄ]/g, 'a')
      .replace(/[ćĆ]/g, 'c')
      .replace(/[ęĘ]/g, 'e')
      .replace(/[łŁ]/g, 'l')
      .replace(/[ńŃ]/g, 'n')
      .replace(/[óÓ]/g, 'o')
      .replace(/[śŚ]/g, 's')
      .replace(/[źŹżŻ]/g, 'z')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleTitleChange = (title: string) => {
    updateField('title', title);
    if (isNewPage || !formData.slug) {
      updateField('slug', generateSlug(title));
    }
  };

  const addSection = (type: InfoPageSection['type']) => {
    const newSection: InfoPageSection = {
      id: `section-${Date.now()}`,
      type,
      title: '',
      content: '',
      items: type !== 'hero' && type !== 'text' && type !== 'cta' ? [] : undefined,
    };
    updateField('content', [...formData.content, newSection]);
    setShowAddSection(false);
  };

  const updateSection = (sectionId: string, updates: Partial<InfoPageSection>) => {
    updateField(
      'content',
      formData.content.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)),
    );
  };

  const deleteSection = (sectionId: string) => {
    updateField(
      'content',
      formData.content.filter((s) => s.id !== sectionId),
    );
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const index = formData.content.findIndex((s) => s.id === sectionId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === formData.content.length - 1)
    )
      return;

    const newContent = [...formData.content];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newContent[index], newContent[targetIndex]] = [newContent[targetIndex], newContent[index]];
    updateField('content', newContent);
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast({ title: 'Podaj tytuł strony', variant: 'destructive' });
      return;
    }
    if (!formData.slug.trim()) {
      toast({ title: 'Podaj slug URL', variant: 'destructive' });
      return;
    }

    // Mock save - in real app would save to DB
    toast({
      title: isNewPage ? 'Utworzono stronę' : 'Zapisano zmiany',
      description: `Strona "${formData.title}" została ${isNewPage ? 'utworzona' : 'zaktualizowana'}.`,
    });
    navigate(-1);
  };

  const handlePreview = () => {
    window.open(`/info/${formData.slug}`, '_blank');
  };

  return (
    <Layout>
      <div className="container max-w-4xl py-6">
        {/* Back navigation */}
        <Button
          variant="ghost"
          className="-ml-2 mb-4 text-muted-foreground hover:text-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Wróć do listy stron
        </Button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            {isNewPage ? 'Nowa strona' : `Edytuj: ${formData.title}`}
          </h1>
          {!isNewPage && formData.updatedAt && (
            <p className="mt-1 text-sm text-muted-foreground">
              Ostatnia edycja:{' '}
              {new Date(formData.updatedAt).toLocaleDateString('pl-PL', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>

        {/* Basic info section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Podstawowe informacje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <EditorHint variant="info">
              Te dane określają jak strona będzie widoczna w nawigacji i w wynikach wyszukiwania
              (Google, Bing).
            </EditorHint>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Tytuł strony *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="np. O nas, Kontakt, Regulamin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug URL *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => updateField('slug', generateSlug(e.target.value))}
                  placeholder="np. o-nas"
                />
                <p className="text-xs text-muted-foreground">
                  Podgląd: /info/{formData.slug || 'adres-strony'}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Ikona</Label>
                <Select value={formData.icon} onValueChange={(v) => updateField('icon', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <opt.icon className="h-4 w-4" />
                          {opt.label}
                        </div>
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
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Opis widoczny w wynikach wyszukiwania"
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/160 znaków
                </p>
              </div>
            </div>

            <EditorHint variant="tip">
              Opis SEO pojawi się w wynikach wyszukiwania Google. Staraj się zmieścić w 160 znakach
              i zawrzeć najważniejsze informacje o stronie.
            </EditorHint>
          </CardContent>
        </Card>

        {/* Visibility section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Widoczność</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <EditorHint variant="info">
              Określ gdzie strona będzie widoczna. Niepublikowane strony są dostępne tylko dla
              administratorów w trybie podglądu.
            </EditorHint>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => updateField('published', !!checked)}
                />
                <div>
                  <Label htmlFor="published" className="cursor-pointer font-medium">
                    Opublikowana
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Strona jest widoczna publicznie
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="showInFooter"
                  checked={formData.showInFooter}
                  onCheckedChange={(checked) => updateField('showInFooter', !!checked)}
                />
                <div>
                  <Label htmlFor="showInFooter" className="cursor-pointer font-medium">
                    Pokazuj w stopce
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Link w dolnej części strony
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="showInHeader"
                  checked={formData.showInHeader}
                  onCheckedChange={(checked) => updateField('showInHeader', !!checked)}
                />
                <div>
                  <Label htmlFor="showInHeader" className="cursor-pointer font-medium">
                    Pokazuj w nagłówku
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">Link w górnym menu</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content sections */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Sekcje treści</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <EditorHint variant="info">
              Sekcje to bloki treści, z których składa się strona. Możesz je dowolnie dodawać,
              usuwać i zmieniać kolejność. Każdy typ sekcji wyświetla treść w inny sposób.
            </EditorHint>

            {formData.content.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed py-8 text-center text-muted-foreground">
                <p className="mb-2">Strona nie ma jeszcze żadnych sekcji</p>
                <p className="text-sm">Kliknij "Dodaj sekcję" poniżej, aby zacząć</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.content.map((section, index) => {
                  const sectionType = sectionTypes.find((t) => t.type === section.type);
                  const SectionIcon = sectionType?.icon || FileText;

                  return (
                    <Card key={section.id} className="border-2">
                      <CardHeader className="bg-muted/30 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                            <div className="rounded bg-primary/10 p-1.5 text-primary">
                              <SectionIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="font-medium">
                                {index + 1}. {sectionType?.label || section.type}
                              </span>
                              {section.title && (
                                <span className="ml-2 text-muted-foreground">
                                  – {section.title}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={index === 0}
                              onClick={() => moveSection(section.id, 'up')}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={index === formData.content.length - 1}
                              onClick={() => moveSection(section.id, 'down')}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => deleteSection(section.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <EditorHint variant="tip" className="mb-4">
                          {sectionHints[section.type]}
                        </EditorHint>
                        <SectionEditor
                          section={section}
                          onUpdate={(updates) => updateSection(section.id, updates)}
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Add section */}
            {showAddSection ? (
              <Card className="border-2 border-dashed border-primary/50 bg-primary/5">
                <CardContent className="py-6">
                  <p className="mb-4 text-center text-sm font-medium">
                    Wybierz typ sekcji do dodania:
                  </p>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {sectionTypes.map((st) => (
                      <Button
                        key={st.type}
                        variant="outline"
                        className="h-auto flex-col gap-2 py-4 hover:border-primary hover:bg-primary/5"
                        onClick={() => addSection(st.type)}
                      >
                        <st.icon className="h-5 w-5" />
                        <span className="font-medium">{st.label}</span>
                        <span className="text-center text-xs text-muted-foreground">
                          {st.description}
                        </span>
                      </Button>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-center">
                    <Button variant="ghost" onClick={() => setShowAddSection(false)}>
                      Anuluj
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={() => setShowAddSection(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Dodaj sekcję
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Action buttons - sticky footer */}
        <div className="sticky bottom-4 flex justify-end gap-3 rounded-lg border bg-background/95 p-4 shadow-lg backdrop-blur">
          <Button variant="outline" onClick={() => navigate('/admin?tab=pages')}>
            Anuluj
          </Button>
          <Button variant="outline" onClick={handlePreview} disabled={!formData.slug}>
            <Eye className="mr-2 h-4 w-4" />
            Podgląd
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Zapisz {isNewPage ? 'stronę' : 'zmiany'}
          </Button>
        </div>
      </div>
    </Layout>
  );
};
