import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { mockEvents, disciplineLabels } from '@/data/mockData';
import { SportDiscipline, Distance } from '@/types';
import { ArrowLeft, ArrowRight, Plus, Trash2, Save, Eye } from 'lucide-react';

interface DistanceForm {
  id: string;
  name: string;
  length: string;
  unit: 'km' | 'm';
  price: string;
  limit: string;
  categories: string[];
}

const defaultCategories = ['K18-29', 'K30-39', 'K40-49', 'K50-59', 'K60+', 'M18-29', 'M30-39', 'M40-49', 'M50-59', 'M60+'];

const EventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = Boolean(id);
  const existingEvent = isEditing ? mockEvents.find(e => e.id === id) : null;

  const [step, setStep] = useState(1);
  
  // Step 1 - Basic info
  const [name, setName] = useState(existingEvent?.name || '');
  const [discipline, setDiscipline] = useState<SportDiscipline>(existingEvent?.discipline || 'running');
  const [date, setDate] = useState(existingEvent?.date || '');
  const [registrationDeadline, setRegistrationDeadline] = useState(existingEvent?.registrationDeadline || '');
  const [location, setLocation] = useState(existingEvent?.location || '');
  const [city, setCity] = useState(existingEvent?.city || '');
  const [description, setDescription] = useState(existingEvent?.description || '');
  const [imageUrl, setImageUrl] = useState(existingEvent?.imageUrl || '');
  const [featured, setFeatured] = useState(existingEvent?.featured || false);

  // Step 2 - Distances
  const [distances, setDistances] = useState<DistanceForm[]>(
    existingEvent?.distances.map(d => ({
      id: d.id,
      name: d.name,
      length: d.length.toString(),
      unit: d.unit,
      price: d.price.toString(),
      limit: d.limit?.toString() || '',
      categories: d.categories
    })) || []
  );

  // Step 3 - Status
  const [status, setStatus] = useState<'draft' | 'awaiting_approval' | 'published'>(
    existingEvent?.status === 'published' ? 'published' : 
    existingEvent?.status === 'awaiting_approval' ? 'awaiting_approval' : 'draft'
  );

  const addDistance = () => {
    setDistances([...distances, {
      id: `dist-${Date.now()}`,
      name: '',
      length: '',
      unit: 'km',
      price: '',
      limit: '',
      categories: [...defaultCategories]
    }]);
  };

  const removeDistance = (index: number) => {
    setDistances(distances.filter((_, i) => i !== index));
  };

  const updateDistance = (index: number, field: keyof DistanceForm, value: string | string[]) => {
    const updated = [...distances];
    updated[index] = { ...updated[index], [field]: value };
    setDistances(updated);
  };

  const toggleCategory = (distIndex: number, category: string) => {
    const dist = distances[distIndex];
    const newCategories = dist.categories.includes(category)
      ? dist.categories.filter(c => c !== category)
      : [...dist.categories, category];
    updateDistance(distIndex, 'categories', newCategories);
  };

  const validateStep1 = () => {
    if (!name || !date || !registrationDeadline || !location || !city) {
      toast({ title: 'Błąd', description: 'Wypełnij wszystkie wymagane pola', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (distances.length === 0) {
      toast({ title: 'Błąd', description: 'Dodaj przynajmniej jeden dystans', variant: 'destructive' });
      return false;
    }
    for (const dist of distances) {
      if (!dist.name || !dist.length || !dist.price) {
        toast({ title: 'Błąd', description: 'Wypełnij wszystkie pola dystansów', variant: 'destructive' });
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = () => {
    const messages = {
      draft: 'Wydarzenie zostało zapisane jako szkic.',
      awaiting_approval: 'Wydarzenie zostało zgłoszone do akceptacji. Administrator sprawdzi je wkrótce.',
      published: 'Wydarzenie zostało opublikowane i jest widoczne dla uczestników.',
    };
    toast({
      title: isEditing ? 'Wydarzenie zaktualizowane' : 'Wydarzenie utworzone',
      description: messages[status],
    });
    navigate('/organizer');
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[ąáàâä]/g, 'a')
      .replace(/[ęéèêë]/g, 'e')
      .replace(/[íìîï]/g, 'i')
      .replace(/[óòôö]/g, 'o')
      .replace(/[úùûü]/g, 'u')
      .replace(/[ćç]/g, 'c')
      .replace(/[ł]/g, 'l')
      .replace(/[ń]/g, 'n')
      .replace(/[ś]/g, 's')
      .replace(/[źż]/g, 'z')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/organizer')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Powrót do panelu
        </Button>

        <h1 className="text-3xl font-bold mb-2">
          {isEditing ? 'Edytuj wydarzenie' : 'Nowe wydarzenie'}
        </h1>
        <p className="text-muted-foreground mb-8">
          {step === 1 && 'Krok 1 z 3: Podstawowe informacje'}
          {step === 2 && 'Krok 2 z 3: Dystanse i kategorie'}
          {step === 3 && 'Krok 3 z 3: Podsumowanie i publikacja'}
        </p>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Podstawowe informacje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nazwa wydarzenia *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="np. Warsaw Marathon 2025"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discipline">Dyscyplina *</Label>
                  <Select value={discipline} onValueChange={(v: SportDiscipline) => setDiscipline(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(disciplineLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data wydarzenia *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Termin rejestracji *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={registrationDeadline}
                    onChange={e => setRegistrationDeadline(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Lokalizacja (miejsce startu) *</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="np. Stadion Narodowy"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Miasto *</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="np. Warszawa"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Opis wydarzenia</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Opisz szczegóły wydarzenia, trasę, atrakcje..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL obrazka</Label>
                <Input
                  id="imageUrl"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured"
                  checked={featured}
                  onCheckedChange={(checked) => setFeatured(checked === true)}
                />
                <Label htmlFor="featured" className="cursor-pointer">
                  Wyróżnij wydarzenie na stronie głównej
                </Label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Distances */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Dystanse ({distances.length})</h2>
              <Button onClick={addDistance} variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Dodaj dystans
              </Button>
            </div>

            {distances.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p>Nie dodano jeszcze żadnych dystansów.</p>
                  <Button onClick={addDistance} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" /> Dodaj pierwszy dystans
                  </Button>
                </CardContent>
              </Card>
            )}

            {distances.map((dist, index) => (
              <Card key={dist.id}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {dist.name || `Dystans ${index + 1}`}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDistance(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Nazwa dystansu *</Label>
                      <Input
                        value={dist.name}
                        onChange={e => updateDistance(index, 'name', e.target.value)}
                        placeholder="np. Maraton"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Długość *</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={dist.length}
                          onChange={e => updateDistance(index, 'length', e.target.value)}
                          placeholder="42.195"
                        />
                        <Select
                          value={dist.unit}
                          onValueChange={(v: 'km' | 'm') => updateDistance(index, 'unit', v)}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="km">km</SelectItem>
                            <SelectItem value="m">m</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Cena (PLN) *</Label>
                      <Input
                        type="number"
                        value={dist.price}
                        onChange={e => updateDistance(index, 'price', e.target.value)}
                        placeholder="150"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Limit uczestników</Label>
                      <Input
                        type="number"
                        value={dist.limit}
                        onChange={e => updateDistance(index, 'limit', e.target.value)}
                        placeholder="500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Kategorie wiekowe</Label>
                    <div className="flex flex-wrap gap-2">
                      {defaultCategories.map(cat => (
                        <Badge
                          key={cat}
                          variant={dist.categories.includes(cat) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => toggleCategory(index, cat)}
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Step 3: Summary */}
        {step === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" /> Podgląd wydarzenia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nazwa</p>
                    <p className="font-medium">{name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Dyscyplina</p>
                    <p className="font-medium">{disciplineLabels[discipline]}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="font-medium">{date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Termin rejestracji</p>
                    <p className="font-medium">{registrationDeadline}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lokalizacja</p>
                    <p className="font-medium">{location}, {city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Slug URL</p>
                    <p className="font-medium text-primary">/events/{generateSlug(name)}</p>
                  </div>
                </div>

                {description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Opis</p>
                    <p className="font-medium">{description}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Dystanse ({distances.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {distances.map(dist => (
                      <Badge key={dist.id} variant="secondary">
                        {dist.name} - {dist.length} {dist.unit} ({dist.price} PLN)
                      </Badge>
                    ))}
                  </div>
                </div>

                {featured && (
                  <Badge variant="default">⭐ Wyróżnione wydarzenie</Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status publikacji</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant={status === 'draft' ? 'default' : 'outline'}
                    onClick={() => setStatus('draft')}
                    className="flex-1"
                  >
                    Zapisz jako szkic
                  </Button>
                  <Button
                    variant={status === 'awaiting_approval' ? 'default' : 'outline'}
                    onClick={() => setStatus('awaiting_approval')}
                    className="flex-1"
                  >
                    Zgłoś do akceptacji
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {status === 'draft'
                    ? 'Wydarzenie będzie widoczne tylko dla Ciebie. Możesz je zgłosić do akceptacji później.'
                    : 'Wydarzenie zostanie przesłane do administratora w celu weryfikacji i zatwierdzenia.'}
                </p>
                <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  <strong>Uwaga:</strong> Wszystkie nowe wydarzenia wymagają zatwierdzenia przez administratora przed publikacją.
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Wstecz
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button onClick={nextStep}>
              Dalej <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit}>
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? 'Zapisz zmiany' : 'Utwórz wydarzenie'}
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default EventForm;
