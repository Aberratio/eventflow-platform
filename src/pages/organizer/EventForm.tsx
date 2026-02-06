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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { mockEvents, disciplineLabels } from '@/data/mockData';
import { SportDiscipline, BannerCropArea, PaymentConfigType } from '@/types';
import { ArrowLeft, ArrowRight, Plus, Trash2, Save, Eye, Image, Crop, Globe, CreditCard, Building2, FileText } from 'lucide-react';
import { ImageCropper, CropArea } from '@/components/ImageCropper';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

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
  
  // Virtual event fields
  const [isVirtual, setIsVirtual] = useState(existingEvent?.isVirtual || false);
  const [startDate, setStartDate] = useState(existingEvent?.startDate || '');
  const [endDate, setEndDate] = useState(existingEvent?.endDate || '');
  
  // Media - Banner and Logo
  const [bannerUrl, setBannerUrl] = useState(existingEvent?.bannerUrl || '');
  const [bannerCropArea, setBannerCropArea] = useState<BannerCropArea | undefined>(existingEvent?.bannerCropArea);
  const [organizerLogoUrl, setOrganizerLogoUrl] = useState(existingEvent?.organizerLogoUrl || '');
  const [showBannerCropper, setShowBannerCropper] = useState(false);

  // Payment configuration
  const [paymentConfigType, setPaymentConfigType] = useState<PaymentConfigType>(
    existingEvent?.paymentConfig?.type || 'admin_gateway'
  );
  const [bankAccountNumber, setBankAccountNumber] = useState(
    existingEvent?.paymentConfig?.bankAccountNumber || ''
  );
  const [bankAccountHolder, setBankAccountHolder] = useState(
    existingEvent?.paymentConfig?.bankAccountHolder || ''
  );
  const [transferTitle, setTransferTitle] = useState(
    existingEvent?.paymentConfig?.transferTitle || 'Opłata za {eventName} - {participantName}'
  );

  // Rich text fields
  const [organizersHtml, setOrganizersHtml] = useState(existingEvent?.organizersHtml || '');
  const [rulesHtml, setRulesHtml] = useState(existingEvent?.rulesHtml || '');
  const [requireFinalAcceptance, setRequireFinalAcceptance] = useState(existingEvent?.requireFinalAcceptance || false);
  const [finalAcceptanceHtml, setFinalAcceptanceHtml] = useState(existingEvent?.finalAcceptanceHtml || '');
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
    if (!name || !date || !registrationDeadline) {
      toast({ title: 'Błąd', description: 'Wypełnij wszystkie wymagane pola', variant: 'destructive' });
      return false;
    }
    // For non-virtual events, location and city are required
    if (!isVirtual && (!location || !city)) {
      toast({ title: 'Błąd', description: 'Wypełnij lokalizację i miasto', variant: 'destructive' });
      return false;
    }
    // For virtual events, start and end dates are required
    if (isVirtual && (!startDate || !endDate)) {
      toast({ title: 'Błąd', description: 'Wypełnij daty rozpoczęcia i zakończenia okna wirtualnego', variant: 'destructive' });
      return false;
    }
    // Validate bank transfer payment configuration
    if (paymentConfigType === 'organizer_bank') {
      if (!bankAccountNumber.trim() || !bankAccountHolder.trim()) {
        toast({ 
          title: 'Błąd', 
          description: 'Podaj numer konta i właściciela dla płatności przelewem bankowym', 
          variant: 'destructive' 
        });
        return false;
      }
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
          <>
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
                    <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Termin rejestracji *</Label>
                    <Input id="deadline" type="date" value={registrationDeadline} onChange={e => setRegistrationDeadline(e.target.value)} />
                  </div>
                </div>

                {/* Virtual event toggle */}
                <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="isVirtual" 
                      checked={isVirtual} 
                      onCheckedChange={(checked) => {
                        setIsVirtual(checked === true);
                        if (checked) {
                          setLocation('Wydarzenie wirtualne');
                          setCity('Cały świat');
                        } else {
                          setLocation('');
                          setCity('');
                        }
                      }} 
                    />
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      <Label htmlFor="isVirtual" className="cursor-pointer font-medium">Wydarzenie wirtualne</Label>
                    </div>
                  </div>
                  {isVirtual && (
                    <p className="text-sm text-muted-foreground pl-6">
                      Uczestnicy wykonują aktywność samodzielnie w dowolnym miejscu i wprowadzają swoje wyniki po zakończeniu okna czasowego.
                    </p>
                  )}
                </div>

                {/* Virtual event date range */}
                {isVirtual && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Data rozpoczęcia okna *</Label>
                      <Input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Data zakończenia okna *</Label>
                      <Input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                  </div>
                )}

                {/* Location fields - hidden for virtual events */}
                {!isVirtual && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Lokalizacja (miejsce startu) *</Label>
                      <Input id="location" value={location} onChange={e => setLocation(e.target.value)} placeholder="np. Stadion Narodowy" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Miasto *</Label>
                      <Input id="city" value={city} onChange={e => setCity(e.target.value)} placeholder="np. Warszawa" />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Opis wydarzenia</Label>
                  <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Opisz szczegóły wydarzenia, trasę, atrakcje..." rows={4} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">URL obrazka</Label>
                  <Input id="imageUrl" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="featured" checked={featured} onCheckedChange={(checked) => setFeatured(checked === true)} />
                  <Label htmlFor="featured" className="cursor-pointer">Wyróżnij wydarzenie na stronie głównej</Label>
                </div>

                {/* Media Section */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Image className="h-5 w-5 text-primary" />
                    Media wydarzenia (opcjonalne)
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label>Baner wydarzenia</Label>
                      <p className="text-sm text-muted-foreground">Pionowy obrazek w tle (zalecane 800x1200px)</p>
                      <Input placeholder="URL banera" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} />
                      {bannerUrl && (
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowBannerCropper(true)}>
                          <Crop className="h-4 w-4 mr-2" /> Przytnij baner
                        </Button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <Label>Logo organizatora</Label>
                      <p className="text-sm text-muted-foreground">Kwadratowe logo (zalecane 200x200px)</p>
                      <Input placeholder="URL logo" value={organizerLogoUrl} onChange={(e) => setOrganizerLogoUrl(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Payment Configuration Section */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Konfiguracja płatności
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Wybierz sposób przyjmowania płatności od uczestników
                  </p>
                  
                  <RadioGroup 
                    value={paymentConfigType} 
                    onValueChange={(value: PaymentConfigType) => setPaymentConfigType(value)}
                    className="space-y-4"
                  >
                    {/* Admin Gateway Option */}
                    <div className={`relative flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                      paymentConfigType === 'admin_gateway' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-muted-foreground/50'
                    }`}>
                      <RadioGroupItem value="admin_gateway" id="admin_gateway" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="admin_gateway" className="flex items-center gap-2 cursor-pointer font-medium">
                          <CreditCard className="h-4 w-4 text-primary" />
                          Bramka płatnicza (automatyczna)
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Płatności są przetwarzane automatycznie przez bramkę płatniczą administratora serwisu. 
                          Nie musisz ręcznie potwierdzać wpłat.
                        </p>
                      </div>
                    </div>

                    {/* Organizer Bank Transfer Option */}
                    <div className={`relative flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                      paymentConfigType === 'organizer_bank' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-muted-foreground/50'
                    }`}>
                      <RadioGroupItem value="organizer_bank" id="organizer_bank" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="organizer_bank" className="flex items-center gap-2 cursor-pointer font-medium">
                          <Building2 className="h-4 w-4 text-primary" />
                          Przelew bankowy (ręczny)
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Uczestnicy wpłacają na Twoje konto bankowe. 
                          Musisz ręcznie potwierdzać otrzymane wpłaty w panelu organizatora.
                        </p>

                        {/* Bank transfer fields - shown when selected */}
                        {paymentConfigType === 'organizer_bank' && (
                          <div className="mt-4 pt-4 border-t border-dashed space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="bankAccountNumber">Numer konta bankowego *</Label>
                              <Input
                                id="bankAccountNumber"
                                value={bankAccountNumber}
                                onChange={(e) => setBankAccountNumber(e.target.value)}
                                placeholder="PL 00 0000 0000 0000 0000 0000 0000"
                              />
                              <p className="text-xs text-muted-foreground">
                                Podaj pełny numer konta w formacie IBAN
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="bankAccountHolder">Właściciel konta *</Label>
                              <Input
                                id="bankAccountHolder"
                                value={bankAccountHolder}
                                onChange={(e) => setBankAccountHolder(e.target.value)}
                                placeholder="Nazwa firmy lub Imię Nazwisko"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="transferTitle">Wzór tytułu przelewu</Label>
                              <Input
                                id="transferTitle"
                                value={transferTitle}
                                onChange={(e) => setTransferTitle(e.target.value)}
                                placeholder="Opłata za {eventName} - {participantName}"
                              />
                              <p className="text-xs text-muted-foreground">
                                Dostępne zmienne: {'{eventName}'}, {'{participantName}'}, {'{distanceName}'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Rich Text Fields Section */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Dodatkowe informacje (opcjonalne)
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Te pola pozwalają na formatowanie tekstu, dodawanie linków i list.
                  </p>
                  
                  <div className="space-y-6">
                    {/* Organizers HTML */}
                    <div className="space-y-2">
                      <Label>Organizatorzy</Label>
                      <p className="text-sm text-muted-foreground">
                        Możesz wpisać wielu organizatorów, sponsorów z linkami do ich stron.
                      </p>
                      <RichTextEditor
                        value={organizersHtml}
                        onChange={setOrganizersHtml}
                        placeholder="Wpisz informacje o organizatorach..."
                        minHeight="100px"
                      />
                    </div>

                    {/* Rules HTML */}
                    <div className="space-y-2">
                      <Label>Regulamin</Label>
                      <p className="text-sm text-muted-foreground">
                        Wpisz treść regulaminu lub dodaj linki do plików PDF.
                      </p>
                      <RichTextEditor
                        value={rulesHtml}
                        onChange={setRulesHtml}
                        placeholder="Wpisz regulamin lub dodaj linki do dokumentów..."
                        minHeight="120px"
                      />
                    </div>

                    {/* Final Acceptance */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="requireFinalAcceptance"
                          checked={requireFinalAcceptance}
                          onCheckedChange={(checked) => setRequireFinalAcceptance(checked === true)}
                        />
                        <Label htmlFor="requireFinalAcceptance" className="cursor-pointer">
                          Wymagaj dodatkowej akceptacji przy rejestracji
                        </Label>
                      </div>
                      
                      {requireFinalAcceptance && (
                        <div className="space-y-2 pl-6">
                          <Label>Tekst akceptacji</Label>
                          <p className="text-sm text-muted-foreground">
                            Ten tekst pojawi się jako checkbox, który uczestnik musi zaakceptować przy rejestracji.
                          </p>
                          <RichTextEditor
                            value={finalAcceptanceHtml}
                            onChange={setFinalAcceptanceHtml}
                            placeholder="Oświadczam, że zapoznałem się z regulaminem..."
                            minHeight="100px"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {bannerUrl && (
              <ImageCropper
                imageUrl={bannerUrl}
                open={showBannerCropper}
                onOpenChange={setShowBannerCropper}
                aspectRatio={16 / 9}
                title="Przytnij baner wydarzenia"
                onCrop={(crop) => setBannerCropArea(crop)}
              />
            )}
          </>
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
                  {isVirtual ? (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Okno startowe</p>
                        <p className="font-medium">{startDate} - {endDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Typ wydarzenia</p>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                          <Globe className="h-3 w-3 mr-1" /> Wirtualny
                        </Badge>
                      </div>
                    </>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground">Lokalizacja</p>
                      <p className="font-medium">{location}, {city}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Slug URL</p>
                    <p className="font-medium text-primary">/events/{generateSlug(name)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Metoda płatności</p>
                    <p className="font-medium flex items-center gap-2">
                      {paymentConfigType === 'admin_gateway' ? (
                        <>
                          <CreditCard className="h-4 w-4 text-primary" />
                          Bramka płatnicza (automatyczna)
                        </>
                      ) : (
                        <>
                          <Building2 className="h-4 w-4 text-primary" />
                          Przelew bankowy (ręczny)
                        </>
                      )}
                    </p>
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

                <div className="flex flex-wrap gap-2">
                  {isVirtual && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                      <Globe className="h-3 w-3 mr-1" /> Wirtualny
                    </Badge>
                  )}
                  {featured && (
                    <Badge variant="default">⭐ Wyróżnione wydarzenie</Badge>
                  )}
                </div>
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
