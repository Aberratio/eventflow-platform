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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { mockEvents, disciplineLabels } from '@/data/mockData';
import { SportDiscipline, BannerCropArea, PaymentConfigType, AgeCategory, SpecialCategory, DistanceRouteFile, RegistrationFormConfig, CustomRegistrationField, EventDisplayOptions, RegistrationEmbedConfig } from '@/types';
import { ArrowLeft, ArrowRight, Plus, Trash2, Save, Eye, Image, Crop, Globe, CreditCard, Building2, FileText, Lock, Copy, RefreshCw, ListPlus, X, Map, ChevronDown, Code, Settings2, Monitor } from 'lucide-react';
import { ImageCropper, CropArea } from '@/components/ImageCropper';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

interface DistanceForm {
  id: string;
  name: string;
  length: string;
  unit: 'km' | 'm';
  price: string;
  limit: string;
  disabledCategoryIds: string[];
  routeMapUrl: string;
  routeElevationProfile: string;
  routeGpxUrl: string;
  routeFiles: DistanceRouteFile[];
}

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

  // Private event fields
  const [isPrivate, setIsPrivate] = useState(existingEvent?.isPrivate || false);
  const [accessCode, setAccessCode] = useState(existingEvent?.accessCode || '');

  const generateAccessCode = () => Math.random().toString(36).substring(2, 14);

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

  // Registration embed config
  const [embedEnabled, setEmbedEnabled] = useState(existingEvent?.registrationEmbed?.enabled || false);
  const [embedStartDate, setEmbedStartDate] = useState(existingEvent?.registrationEmbed?.startDate || '');
  const [embedEndDate, setEmbedEndDate] = useState(existingEvent?.registrationEmbed?.endDate || '');

  // Registration form config
  const defaultFormConfig: RegistrationFormConfig = {
    collectPhone: true,
    collectClub: true,
    collectBirthDate: true,
    collectTeam: true,
    collectInsurance: true,
    collectMerchandise: true,
    customFields: [],
  };
  const [formConfig, setFormConfig] = useState<RegistrationFormConfig>(
    existingEvent?.registrationFormConfig || defaultFormConfig
  );

  // Display options
  const defaultDisplayOptions: EventDisplayOptions = {
    defaultSort: 'name',
    uppercaseNames: false,
    hideUnpaid: false,
  };
  const [displayOptions, setDisplayOptions] = useState<EventDisplayOptions>(
    existingEvent?.displayOptions || defaultDisplayOptions
  );


  const getEventYear = () => {
    return date ? parseInt(date.substring(0, 4)) || new Date().getFullYear() : new Date().getFullYear();
  };

  const generateStandardAgeCategories = (): AgeCategory[] => {
    const eventYear = getEventYear();
    const ranges: Array<{ label: string; from: number; to: number }> = [
      { label: '18-29', from: eventYear - 29, to: eventYear - 18 },
      { label: '30-39', from: eventYear - 39, to: eventYear - 30 },
      { label: '40-49', from: eventYear - 49, to: eventYear - 40 },
      { label: '50-59', from: eventYear - 59, to: eventYear - 50 },
      { label: '60+', from: eventYear - 100, to: eventYear - 60 },
    ];
    const categories: AgeCategory[] = [];
    for (const gender of ['K', 'M'] as const) {
      for (const r of ranges) {
        categories.push({
          id: `cat-${gender}-${r.label}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: `${gender}${r.label}`,
          gender,
          birthYearFrom: r.from,
          birthYearTo: r.to,
        });
      }
    }
    return categories;
  };

  // ---- Event-level categories (shared across all distances) ----
  const existingAgeCats = existingEvent?.distances?.[0]?.ageCategories;
  const existingSpecialCats = existingEvent?.distances?.[0]?.specialCategories;

  const [ageCategories, setAgeCategories] = useState<AgeCategory[]>(
    existingAgeCats && existingAgeCats.length > 0
      ? existingAgeCats
      : generateStandardAgeCategories()
  );
  const [specialCategories, setSpecialCategories] = useState<SpecialCategory[]>(
    existingSpecialCats || []
  );

  // ---- Distances (without per-distance categories, but with disabledCategoryIds) ----
  const [distances, setDistances] = useState<DistanceForm[]>(
    existingEvent?.distances.map(d => ({
      id: d.id,
      name: d.name,
      length: d.length.toString(),
      unit: d.unit,
      price: d.price.toString(),
      limit: d.limit?.toString() || '',
      disabledCategoryIds: [],
      routeMapUrl: d.routeMapUrl || '',
      routeElevationProfile: d.routeElevationProfile || '',
      routeGpxUrl: d.routeGpxUrl || '',
      routeFiles: d.routeFiles || [],
    })) || []
  );

  // Step 3 - Status
  const [status, setStatus] = useState<'draft' | 'awaiting_approval' | 'published'>(
    existingEvent?.status === 'published' ? 'published' : 
    existingEvent?.status === 'awaiting_approval' ? 'awaiting_approval' : 'draft'
  );

  // ---- Distance handlers ----
  const addDistance = () => {
    setDistances([...distances, {
      id: `dist-${Date.now()}`,
      name: '',
      length: '',
      unit: 'km',
      price: '',
      limit: '',
      disabledCategoryIds: [],
      routeMapUrl: '',
      routeElevationProfile: '',
      routeGpxUrl: '',
      routeFiles: [],
    }]);
  };

  const removeDistance = (index: number) => {
    setDistances(distances.filter((_, i) => i !== index));
  };

  const updateDistance = (index: number, field: keyof DistanceForm, value: string | string[] | DistanceRouteFile[]) => {
    const updated = [...distances];
    updated[index] = { ...updated[index], [field]: value };
    setDistances(updated);
  };

  const addRouteFile = (distIndex: number) => {
    const updated = [...distances];
    const dist = updated[distIndex];
    updated[distIndex] = {
      ...dist,
      routeFiles: [...dist.routeFiles, { id: `rf-${Date.now()}`, name: '', type: 'image', url: '' }],
    };
    setDistances(updated);
  };

  const removeRouteFile = (distIndex: number, fileId: string) => {
    const updated = [...distances];
    const dist = updated[distIndex];
    updated[distIndex] = {
      ...dist,
      routeFiles: dist.routeFiles.filter(f => f.id !== fileId),
    };
    setDistances(updated);
  };

  const updateRouteFile = (distIndex: number, fileId: string, field: keyof DistanceRouteFile, value: string) => {
    const updated = [...distances];
    const dist = updated[distIndex];
    updated[distIndex] = {
      ...dist,
      routeFiles: dist.routeFiles.map(f => f.id === fileId ? { ...f, [field]: value } : f),
    };
    setDistances(updated);
  };

  const toggleCategoryForDistance = (distIndex: number, categoryId: string) => {
    const updated = [...distances];
    const dist = updated[distIndex];
    const disabled = dist.disabledCategoryIds.includes(categoryId)
      ? dist.disabledCategoryIds.filter(id => id !== categoryId)
      : [...dist.disabledCategoryIds, categoryId];
    updated[distIndex] = { ...dist, disabledCategoryIds: disabled };
    setDistances(updated);
  };

  // ---- Event-level age category handlers ----
  const addAgeCategory = () => {
    const eventYear = getEventYear();
    setAgeCategories([...ageCategories, {
      id: `cat-${Date.now()}`,
      name: '',
      gender: 'M',
      birthYearFrom: eventYear - 39,
      birthYearTo: eventYear - 30,
    }]);
  };

  const removeAgeCategory = (catIndex: number) => {
    const removedId = ageCategories[catIndex].id;
    setAgeCategories(ageCategories.filter((_, i) => i !== catIndex));
    // Clean up disabled references in distances
    setDistances(distances.map(d => ({
      ...d,
      disabledCategoryIds: d.disabledCategoryIds.filter(id => id !== removedId),
    })));
  };

  const updateAgeCategory = (catIndex: number, field: keyof AgeCategory, value: string | number) => {
    const cats = [...ageCategories];
    cats[catIndex] = { ...cats[catIndex], [field]: value };
    setAgeCategories(cats);
  };

  const applyStandardTemplate = () => {
    setAgeCategories(generateStandardAgeCategories());
  };

  // ---- Event-level special category handlers ----
  const addSpecialCategory = () => {
    setSpecialCategories([...specialCategories, {
      id: `scat-${Date.now()}`,
      name: '',
      description: '',
    }]);
  };

  const removeSpecialCategory = (catIndex: number) => {
    const removedId = specialCategories[catIndex].id;
    setSpecialCategories(specialCategories.filter((_, i) => i !== catIndex));
    setDistances(distances.map(d => ({
      ...d,
      disabledCategoryIds: d.disabledCategoryIds.filter(id => id !== removedId),
    })));
  };

  const updateSpecialCategory = (catIndex: number, field: keyof SpecialCategory, value: string) => {
    const cats = [...specialCategories];
    cats[catIndex] = { ...cats[catIndex], [field]: value };
    setSpecialCategories(cats);
  };

  // ---- Validation ----
  const validateStep1 = () => {
    if (!name || !date || !registrationDeadline) {
      toast({ title: 'Błąd', description: 'Wypełnij wszystkie wymagane pola', variant: 'destructive' });
      return false;
    }
    if (!isVirtual && (!location || !city)) {
      toast({ title: 'Błąd', description: 'Wypełnij lokalizację i miasto', variant: 'destructive' });
      return false;
    }
    if (isVirtual && (!startDate || !endDate)) {
      toast({ title: 'Błąd', description: 'Wypełnij daty rozpoczęcia i zakończenia okna wirtualnego', variant: 'destructive' });
      return false;
    }
    if (paymentConfigType === 'organizer_bank') {
      if (!bankAccountNumber.trim() || !bankAccountHolder.trim()) {
        toast({ title: 'Błąd', description: 'Podaj numer konta i właściciela dla płatności przelewem bankowym', variant: 'destructive' });
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
    navigate(-1);
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

  const allCategories = [
    ...ageCategories.map(c => ({ id: c.id, name: c.name, type: 'age' as const })),
    ...specialCategories.map(c => ({ id: c.id, name: c.name, type: 'special' as const })),
  ];

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Powrót do panelu
        </Button>

        <h1 className="text-3xl font-bold mb-2">
          {isEditing ? 'Edytuj wydarzenie' : 'Nowe wydarzenie'}
        </h1>
        <p className="text-muted-foreground mb-8">
          {step === 1 && 'Krok 1 z 3: Podstawowe informacje'}
          {step === 2 && 'Krok 2 z 3: Kategorie i dystanse'}
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

                {/* Private event toggle */}
                <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="isPrivate" 
                      checked={isPrivate} 
                      onCheckedChange={(checked) => {
                        const val = checked === true;
                        setIsPrivate(val);
                        if (val && !accessCode) {
                          setAccessCode(generateAccessCode());
                        }
                      }} 
                    />
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      <Label htmlFor="isPrivate" className="cursor-pointer font-medium">Wydarzenie prywatne</Label>
                    </div>
                  </div>
                  {isPrivate && (
                    <div className="pl-6 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Prywatne wydarzenie nie będzie widoczne publicznie. Uczestnicy mogą dołączyć tylko przez specjalny link.
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="accessCode">Kod dostępu</Label>
                        <div className="flex gap-2">
                          <Input 
                            id="accessCode" 
                            value={accessCode} 
                            onChange={e => setAccessCode(e.target.value)} 
                            placeholder="np. abc123xyz"
                            className="font-mono"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon"
                            onClick={() => setAccessCode(generateAccessCode())}
                            title="Wygeneruj nowy kod"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const slug = name ? generateSlug(name) : 'wydarzenie';
                              const url = `${window.location.origin}/events/${slug}?access=${accessCode}`;
                              navigator.clipboard.writeText(url);
                              toast({ title: 'Skopiowano', description: 'Link do prywatnego wydarzenia został skopiowany do schowka.' });
                            }}
                            title="Kopiuj link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

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

            {/* Registration Embed Config */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" />
                  Zapisy przez iframe (embed)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Włącz widget do osadzenia</Label>
                    <p className="text-sm text-muted-foreground">Partnerzy mogą umieścić formularz zapisów na swojej stronie</p>
                  </div>
                  <Switch checked={embedEnabled} onCheckedChange={setEmbedEnabled} />
                </div>
                {embedEnabled && (
                  <div className="space-y-4 pt-2 border-t">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Embed aktywny od</Label>
                        <Input type="date" value={embedStartDate} onChange={e => setEmbedStartDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Embed aktywny do</Label>
                        <Input type="date" value={embedEndDate} onChange={e => setEmbedEndDate(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Kod do osadzenia</Label>
                      <div className="relative">
                        <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                          {`<iframe src="${window.location.origin}/events/${name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : 'slug'}/embed" width="100%" height="500" frameborder="0"></iframe>`}
                        </pre>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : 'slug';
                            navigator.clipboard.writeText(`<iframe src="${window.location.origin}/events/${slug}/embed" width="100%" height="500" frameborder="0"></iframe>`);
                            toast({ title: 'Skopiowano', description: 'Kod iframe został skopiowany do schowka.' });
                          }}
                        >
                          <Copy className="h-3 w-3 mr-1" /> Kopiuj
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Registration Form Config */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-primary" />
                  Konfiguracja formularza zapisów
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Wybierz, które dane chcesz zbierać od uczestników podczas rejestracji.</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { key: 'collectPhone' as const, label: 'Numer telefonu' },
                    { key: 'collectClub' as const, label: 'Nazwa klubu' },
                    { key: 'collectBirthDate' as const, label: 'Data urodzenia' },
                    { key: 'collectTeam' as const, label: 'Rejestracja drużynowa' },
                    { key: 'collectInsurance' as const, label: 'Ubezpieczenie NNW' },
                    { key: 'collectMerchandise' as const, label: 'Gadżety przy rejestracji' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-3 p-3 rounded-lg border">
                      <Checkbox
                        id={`fc-${key}`}
                        checked={formConfig[key]}
                        onCheckedChange={(checked) => setFormConfig(prev => ({ ...prev, [key]: checked === true }))}
                      />
                      <Label htmlFor={`fc-${key}`} className="cursor-pointer">{label}</Label>
                    </div>
                  ))}
                </div>

                {/* Custom fields */}
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" className="w-full justify-between">
                      Pola niestandardowe ({formConfig.customFields.length})
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-3">
                    {formConfig.customFields.map((field, idx) => (
                      <div key={field.id} className="flex items-start gap-2 p-3 rounded-lg border">
                        <div className="flex-1 grid sm:grid-cols-3 gap-2">
                          <Input
                            placeholder="Nazwa pola"
                            value={field.label}
                            onChange={e => {
                              const updated = [...formConfig.customFields];
                              updated[idx] = { ...updated[idx], label: e.target.value };
                              setFormConfig(prev => ({ ...prev, customFields: updated }));
                            }}
                          />
                          <Select
                            value={field.type}
                            onValueChange={(v: 'text' | 'select' | 'checkbox') => {
                              const updated = [...formConfig.customFields];
                              updated[idx] = { ...updated[idx], type: v };
                              setFormConfig(prev => ({ ...prev, customFields: updated }));
                            }}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Tekst</SelectItem>
                              <SelectItem value="select">Lista wyboru</SelectItem>
                              <SelectItem value="checkbox">Checkbox</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={field.required}
                              onCheckedChange={(checked) => {
                                const updated = [...formConfig.customFields];
                                updated[idx] = { ...updated[idx], required: checked === true };
                                setFormConfig(prev => ({ ...prev, customFields: updated }));
                              }}
                            />
                            <Label className="text-sm">Wymagane</Label>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setFormConfig(prev => ({
                              ...prev,
                              customFields: prev.customFields.filter((_, i) => i !== idx),
                            }));
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormConfig(prev => ({
                          ...prev,
                          customFields: [...prev.customFields, {
                            id: `cf-${Date.now()}`,
                            label: '',
                            type: 'text',
                            required: false,
                          }],
                        }));
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Dodaj pole
                    </Button>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>

            {/* Display Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-primary" />
                  Opcje wyświetlania
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Ustawienia wpływające na wyświetlanie listy startowej i danych uczestników.</p>
                <div className="space-y-2">
                  <Label>Domyślne sortowanie listy startowej</Label>
                  <Select
                    value={displayOptions.defaultSort}
                    onValueChange={(v: EventDisplayOptions['defaultSort']) =>
                      setDisplayOptions(prev => ({ ...prev, defaultSort: v }))
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Imię i nazwisko</SelectItem>
                      <SelectItem value="bib">Numer startowy</SelectItem>
                      <SelectItem value="date">Data rejestracji</SelectItem>
                      <SelectItem value="distance">Dystans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label>Wielkie litery w nazwiskach</Label>
                    <p className="text-xs text-muted-foreground">Wyświetlaj imiona i nazwiska WIELKIMI LITERAMI</p>
                  </div>
                  <Switch
                    checked={displayOptions.uppercaseNames}
                    onCheckedChange={(checked) => setDisplayOptions(prev => ({ ...prev, uppercaseNames: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label>Ukryj nieopłaconych</Label>
                    <p className="text-xs text-muted-foreground">Uczestnicy z nieopłaconymi zapisami nie będą widoczni na liście startowej</p>
                  </div>
                  <Switch
                    checked={displayOptions.hideUnpaid}
                    onCheckedChange={(checked) => setDisplayOptions(prev => ({ ...prev, hideUnpaid: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
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

        {/* Step 2: Categories & Distances */}
        {step === 2 && (
          <div className="space-y-6">
            {/* ===== EVENT-LEVEL CATEGORIES ===== */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Kategorie uczestników</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Zdefiniuj kategorie dla całego wydarzenia. W poszczególnych dystansach możesz wyłączyć wybrane kategorie.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Age Categories */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Kategorie wiekowe ({ageCategories.length})</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={applyStandardTemplate}
                    >
                      <ListPlus className="mr-2 h-4 w-4" /> Załaduj szablon standardowy
                    </Button>
                  </div>

                  {ageCategories.length > 0 && (
                    <div className="space-y-2">
                      <div className="hidden md:grid md:grid-cols-[1fr_80px_100px_100px_40px] gap-2 text-xs text-muted-foreground font-medium px-1">
                        <span>Nazwa</span>
                        <span>Płeć</span>
                        <span>Rok od</span>
                        <span>Rok do</span>
                        <span></span>
                      </div>
                      {ageCategories.map((cat, catIdx) => (
                        <div key={cat.id} className="grid grid-cols-2 md:grid-cols-[1fr_80px_100px_100px_40px] gap-2 items-center">
                          <Input
                            value={cat.name}
                            onChange={e => updateAgeCategory(catIdx, 'name', e.target.value)}
                            placeholder="np. K18-29"
                            className="h-9"
                          />
                          <Select
                            value={cat.gender}
                            onValueChange={(v: 'K' | 'M') => updateAgeCategory(catIdx, 'gender', v)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="K">K</SelectItem>
                              <SelectItem value="M">M</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            value={cat.birthYearFrom}
                            onChange={e => updateAgeCategory(catIdx, 'birthYearFrom', parseInt(e.target.value) || 0)}
                            placeholder="1990"
                            className="h-9"
                          />
                          <Input
                            type="number"
                            value={cat.birthYearTo}
                            onChange={e => updateAgeCategory(catIdx, 'birthYearTo', parseInt(e.target.value) || 0)}
                            placeholder="2000"
                            className="h-9"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-destructive hover:text-destructive"
                            onClick={() => removeAgeCategory(catIdx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addAgeCategory}
                    className="text-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Dodaj kategorię wiekową
                  </Button>
                </div>

                {/* Special Categories */}
                <div className="space-y-3 border-t pt-4">
                  <Label className="text-base font-medium">Kategorie specjalne ({specialCategories.length})</Label>

                  {specialCategories.length > 0 && (
                    <div className="space-y-2">
                      <div className="hidden md:grid md:grid-cols-[1fr_1fr_40px] gap-2 text-xs text-muted-foreground font-medium px-1">
                        <span>Nazwa</span>
                        <span>Opis (opcjonalnie)</span>
                        <span></span>
                      </div>
                      {specialCategories.map((cat, catIdx) => (
                        <div key={cat.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_40px] gap-2 items-center">
                          <Input
                            value={cat.name}
                            onChange={e => updateSpecialCategory(catIdx, 'name', e.target.value)}
                            placeholder="np. Mieszkaniec Warszawy"
                            className="h-9"
                          />
                          <Input
                            value={cat.description || ''}
                            onChange={e => updateSpecialCategory(catIdx, 'description', e.target.value)}
                            placeholder="np. Osoby zameldowane w Warszawie"
                            className="h-9"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-destructive hover:text-destructive"
                            onClick={() => removeSpecialCategory(catIdx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addSpecialCategory}
                    className="text-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Dodaj kategorię specjalną
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ===== DISTANCES ===== */}
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

                  {/* Per-distance category toggles */}
                  {allCategories.length > 0 && (
                    <div className="border-t pt-4 space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        Kategorie w tym dystansie (odznacz, aby wyłączyć)
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {allCategories.map(cat => {
                          const isDisabled = dist.disabledCategoryIds.includes(cat.id);
                          return (
                            <Badge
                              key={cat.id}
                              variant={isDisabled ? 'outline' : 'secondary'}
                              className={`cursor-pointer select-none transition-opacity ${isDisabled ? 'opacity-40 line-through' : ''}`}
                              onClick={() => toggleCategoryForDistance(index, cat.id)}
                            >
                              {cat.name}
                              {cat.type === 'special' && ' ★'}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Route artifacts - Collapsible */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground w-full justify-start border-t pt-4 mt-2 rounded-none">
                        <Map className="h-4 w-4" />
                        Trasa i mapy
                        <ChevronDown className="h-4 w-4 ml-auto transition-transform [[data-state=open]_&]:rotate-180" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">URL mapy trasy</Label>
                          <Input
                            value={dist.routeMapUrl}
                            onChange={e => updateDistance(index, 'routeMapUrl', e.target.value)}
                            placeholder="https://..."
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">URL profilu przewyższeń</Label>
                          <Input
                            value={dist.routeElevationProfile}
                            onChange={e => updateDistance(index, 'routeElevationProfile', e.target.value)}
                            placeholder="https://..."
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">URL pliku GPX</Label>
                          <Input
                            value={dist.routeGpxUrl}
                            onChange={e => updateDistance(index, 'routeGpxUrl', e.target.value)}
                            placeholder="https://..."
                            className="h-9"
                          />
                        </div>
                      </div>

                      {/* Additional files */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Dodatkowe pliki</Label>
                        {dist.routeFiles.map(file => (
                          <div key={file.id} className="grid grid-cols-[1fr_1fr_100px_32px] gap-2 items-center">
                            <Input
                              value={file.name}
                              onChange={e => updateRouteFile(index, file.id, 'name', e.target.value)}
                              placeholder="Nazwa pliku"
                              className="h-9"
                            />
                            <Input
                              value={file.url}
                              onChange={e => updateRouteFile(index, file.id, 'url', e.target.value)}
                              placeholder="URL"
                              className="h-9"
                            />
                            <Select
                              value={file.type}
                              onValueChange={(v) => updateRouteFile(index, file.id, 'type', v)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="map">Mapa</SelectItem>
                                <SelectItem value="elevation">Profil</SelectItem>
                                <SelectItem value="gpx">GPX</SelectItem>
                                <SelectItem value="image">Zdjęcie</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-destructive hover:text-destructive"
                              onClick={() => removeRouteFile(index, file.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addRouteFile(index)}
                          className="text-primary"
                        >
                          <Plus className="mr-2 h-4 w-4" /> Dodaj plik
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
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
                  <p className="text-sm text-muted-foreground mb-2">Kategorie ({allCategories.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {allCategories.map(cat => (
                      <Badge key={cat.id} variant={cat.type === 'special' ? 'outline' : 'secondary'}>
                        {cat.name}{cat.type === 'special' ? ' ★' : ''}
                      </Badge>
                    ))}
                  </div>
                </div>

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
