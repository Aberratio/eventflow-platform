import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { disciplineLabels } from '@/data/mockData';
import { SportDiscipline, PaymentConfigType, RegistrationFormConfig, CustomRegistrationField, EventDisplayOptions, BannerCropArea } from '@/types';
import {
  Globe, Lock, RefreshCw, Copy, CreditCard, Building2,
  FileText, Image, Crop, Code, Settings2, Monitor,
  Plus, Trash2, ChevronDown,
} from 'lucide-react';
import { ImageCropper } from '@/components/ImageCropper';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useToast } from '@/hooks/use-toast';

interface EventFormStep1Props {
  name: string;
  setName: (v: string) => void;
  discipline: SportDiscipline;
  setDiscipline: (v: SportDiscipline) => void;
  date: string;
  setDate: (v: string) => void;
  registrationDeadline: string;
  setRegistrationDeadline: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  imageUrl: string;
  setImageUrl: (v: string) => void;
  featured: boolean;
  setFeatured: (v: boolean) => void;
  isVirtual: boolean;
  setIsVirtual: (v: boolean) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  isPrivate: boolean;
  setIsPrivate: (v: boolean) => void;
  accessCode: string;
  setAccessCode: (v: string) => void;
  bannerUrl: string;
  setBannerUrl: (v: string) => void;
  bannerCropArea: BannerCropArea | undefined;
  setBannerCropArea: (v: BannerCropArea | undefined) => void;
  organizerLogoUrl: string;
  setOrganizerLogoUrl: (v: string) => void;
  paymentConfigType: PaymentConfigType;
  setPaymentConfigType: (v: PaymentConfigType) => void;
  bankAccountNumber: string;
  setBankAccountNumber: (v: string) => void;
  bankAccountHolder: string;
  setBankAccountHolder: (v: string) => void;
  transferTitle: string;
  setTransferTitle: (v: string) => void;
  organizersHtml: string;
  setOrganizersHtml: (v: string) => void;
  rulesHtml: string;
  setRulesHtml: (v: string) => void;
  requireFinalAcceptance: boolean;
  setRequireFinalAcceptance: (v: boolean) => void;
  finalAcceptanceHtml: string;
  setFinalAcceptanceHtml: (v: string) => void;
  embedEnabled: boolean;
  setEmbedEnabled: (v: boolean) => void;
  embedStartDate: string;
  setEmbedStartDate: (v: string) => void;
  embedEndDate: string;
  setEmbedEndDate: (v: string) => void;
  formConfig: RegistrationFormConfig;
  setFormConfig: (fn: (prev: RegistrationFormConfig) => RegistrationFormConfig) => void;
  displayOptions: EventDisplayOptions;
  setDisplayOptions: (fn: (prev: EventDisplayOptions) => EventDisplayOptions) => void;
  generateAccessCode: () => string;
  generateSlug: (name: string) => string;
}

const FORM_CONFIG_FIELDS: { key: keyof Pick<RegistrationFormConfig, 'collectPhone' | 'collectClub' | 'collectBirthDate' | 'collectTeam' | 'collectInsurance' | 'collectMerchandise'>; label: string }[] = [
  { key: 'collectPhone', label: 'Numer telefonu' },
  { key: 'collectClub', label: 'Nazwa klubu' },
  { key: 'collectBirthDate', label: 'Data urodzenia' },
  { key: 'collectTeam', label: 'Rejestracja drużynowa' },
  { key: 'collectInsurance', label: 'Ubezpieczenie NNW' },
  { key: 'collectMerchandise', label: 'Gadżety przy rejestracji' },
];

export const EventFormStep1 = (props: EventFormStep1Props) => {
  const { toast } = useToast();
  const [showBannerCropper, setShowBannerCropper] = useState(false);

  const handleVirtualToggle = (checked: boolean) => {
    props.setIsVirtual(checked);
    if (checked) {
      props.setLocation('Wydarzenie wirtualne');
      props.setCity('Cały świat');
    } else {
      props.setLocation('');
      props.setCity('');
    }
  };

  const handlePrivateToggle = (checked: boolean) => {
    props.setIsPrivate(checked);
    if (checked && !props.accessCode) {
      props.setAccessCode(props.generateAccessCode());
    }
  };

  const handleCopyPrivateLink = () => {
    const slug = props.name ? props.generateSlug(props.name) : 'wydarzenie';
    const url = `${window.location.origin}/events/${slug}?access=${props.accessCode}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Skopiowano', description: 'Link do prywatnego wydarzenia został skopiowany do schowka.' });
  };

  const handleCopyEmbed = () => {
    const slug = props.name ? props.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : 'slug';
    navigator.clipboard.writeText(`<iframe src="${window.location.origin}/events/${slug}/embed" width="100%" height="500" frameborder="0"></iframe>`);
    toast({ title: 'Skopiowano', description: 'Kod iframe został skopiowany do schowka.' });
  };

  const addCustomField = () => {
    props.setFormConfig(prev => ({
      ...prev,
      customFields: [...prev.customFields, { id: `cf-${Date.now()}`, label: '', type: 'text', required: false }],
    }));
  };

  const updateCustomField = (idx: number, updates: Partial<CustomRegistrationField>) => {
    props.setFormConfig(prev => ({
      ...prev,
      customFields: prev.customFields.map((f, i) => i === idx ? { ...f, ...updates } : f),
    }));
  };

  const removeCustomField = (idx: number) => {
    props.setFormConfig(prev => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== idx),
    }));
  };

  return (
    <>
      <Card>
        <CardHeader><CardTitle>Podstawowe informacje</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa wydarzenia *</Label>
              <Input id="name" value={props.name} onChange={e => props.setName(e.target.value)} placeholder="np. Warsaw Marathon 2025" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discipline">Dyscyplina *</Label>
              <Select value={props.discipline} onValueChange={(v: SportDiscipline) => props.setDiscipline(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Input id="date" type="date" value={props.date} onChange={e => props.setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Termin rejestracji *</Label>
              <Input id="deadline" type="date" value={props.registrationDeadline} onChange={e => props.setRegistrationDeadline(e.target.value)} />
            </div>
          </div>

          {/* Virtual event */}
          <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox id="isVirtual" checked={props.isVirtual} onCheckedChange={(c) => handleVirtualToggle(c === true)} />
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <Label htmlFor="isVirtual" className="cursor-pointer font-medium">Wydarzenie wirtualne</Label>
              </div>
            </div>
            {props.isVirtual && (
              <p className="text-sm text-muted-foreground pl-6">
                Uczestnicy wykonują aktywność samodzielnie w dowolnym miejscu i wprowadzają swoje wyniki po zakończeniu okna czasowego.
              </p>
            )}
          </div>

          {props.isVirtual && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data rozpoczęcia okna *</Label>
                <Input id="startDate" type="date" value={props.startDate} onChange={e => props.setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data zakończenia okna *</Label>
                <Input id="endDate" type="date" value={props.endDate} onChange={e => props.setEndDate(e.target.value)} />
              </div>
            </div>
          )}

          {/* Private event */}
          <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox id="isPrivate" checked={props.isPrivate} onCheckedChange={(c) => handlePrivateToggle(c === true)} />
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <Label htmlFor="isPrivate" className="cursor-pointer font-medium">Wydarzenie prywatne</Label>
              </div>
            </div>
            {props.isPrivate && (
              <div className="pl-6 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Prywatne wydarzenie nie będzie widoczne publicznie. Uczestnicy mogą dołączyć tylko przez specjalny link.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="accessCode">Kod dostępu</Label>
                  <div className="flex gap-2">
                    <Input id="accessCode" value={props.accessCode} onChange={e => props.setAccessCode(e.target.value)} placeholder="np. abc123xyz" className="font-mono" />
                    <Button type="button" variant="outline" size="icon" onClick={() => props.setAccessCode(props.generateAccessCode())} title="Wygeneruj nowy kod">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="icon" onClick={handleCopyPrivateLink} title="Kopiuj link">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Location */}
          {!props.isVirtual && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Lokalizacja (miejsce startu) *</Label>
                <Input id="location" value={props.location} onChange={e => props.setLocation(e.target.value)} placeholder="np. Stadion Narodowy" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Miasto *</Label>
                <Input id="city" value={props.city} onChange={e => props.setCity(e.target.value)} placeholder="np. Warszawa" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Opis wydarzenia</Label>
            <Textarea id="description" value={props.description} onChange={e => props.setDescription(e.target.value)} placeholder="Opisz szczegóły wydarzenia, trasę, atrakcje..." rows={4} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL obrazka</Label>
            <Input id="imageUrl" value={props.imageUrl} onChange={e => props.setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="featured" checked={props.featured} onCheckedChange={(c) => props.setFeatured(c === true)} />
            <Label htmlFor="featured" className="cursor-pointer">Wyróżnij wydarzenie na stronie głównej</Label>
          </div>

          {/* Media */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" /> Media wydarzenia (opcjonalne)
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Baner wydarzenia</Label>
                <p className="text-sm text-muted-foreground">Pionowy obrazek w tle (zalecane 800x1200px)</p>
                <Input placeholder="URL banera" value={props.bannerUrl} onChange={(e) => props.setBannerUrl(e.target.value)} />
                {props.bannerUrl && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowBannerCropper(true)}>
                    <Crop className="h-4 w-4 mr-2" /> Przytnij baner
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                <Label>Logo organizatora</Label>
                <p className="text-sm text-muted-foreground">Kwadratowe logo (zalecane 200x200px)</p>
                <Input placeholder="URL logo" value={props.organizerLogoUrl} onChange={(e) => props.setOrganizerLogoUrl(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" /> Konfiguracja płatności
            </h3>
            <p className="text-sm text-muted-foreground mb-4">Wybierz sposób przyjmowania płatności od uczestników</p>
            <RadioGroup value={props.paymentConfigType} onValueChange={(v: PaymentConfigType) => props.setPaymentConfigType(v)} className="space-y-4">
              <div className={`relative flex items-start gap-3 p-4 rounded-lg border transition-colors ${props.paymentConfigType === 'admin_gateway' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}`}>
                <RadioGroupItem value="admin_gateway" id="admin_gateway" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="admin_gateway" className="flex items-center gap-2 cursor-pointer font-medium">
                    <CreditCard className="h-4 w-4 text-primary" /> Bramka płatnicza (automatyczna)
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">Płatności są przetwarzane automatycznie przez bramkę płatniczą administratora serwisu.</p>
                </div>
              </div>

              <div className={`relative flex items-start gap-3 p-4 rounded-lg border transition-colors ${props.paymentConfigType === 'organizer_bank' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}`}>
                <RadioGroupItem value="organizer_bank" id="organizer_bank" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="organizer_bank" className="flex items-center gap-2 cursor-pointer font-medium">
                    <Building2 className="h-4 w-4 text-primary" /> Przelew bankowy (ręczny)
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">Uczestnicy wpłacają na Twoje konto bankowe. Musisz ręcznie potwierdzać otrzymane wpłaty.</p>
                  {props.paymentConfigType === 'organizer_bank' && (
                    <div className="mt-4 pt-4 border-t border-dashed space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bankAccountNumber">Numer konta bankowego *</Label>
                        <Input id="bankAccountNumber" value={props.bankAccountNumber} onChange={(e) => props.setBankAccountNumber(e.target.value)} placeholder="PL 00 0000 0000 0000 0000 0000 0000" />
                        <p className="text-xs text-muted-foreground">Podaj pełny numer konta w formacie IBAN</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankAccountHolder">Właściciel konta *</Label>
                        <Input id="bankAccountHolder" value={props.bankAccountHolder} onChange={(e) => props.setBankAccountHolder(e.target.value)} placeholder="Nazwa firmy lub Imię Nazwisko" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="transferTitle">Wzór tytułu przelewu</Label>
                        <Input id="transferTitle" value={props.transferTitle} onChange={(e) => props.setTransferTitle(e.target.value)} placeholder="Opłata za {eventName} - {participantName}" />
                        <p className="text-xs text-muted-foreground">Dostępne zmienne: {'{eventName}'}, {'{participantName}'}, {'{distanceName}'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Rich text fields */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Dodatkowe informacje (opcjonalne)
            </h3>
            <p className="text-sm text-muted-foreground mb-4">Te pola pozwalają na formatowanie tekstu, dodawanie linków i list.</p>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Organizatorzy</Label>
                <p className="text-sm text-muted-foreground">Możesz wpisać wielu organizatorów, sponsorów z linkami do ich stron.</p>
                <RichTextEditor value={props.organizersHtml} onChange={props.setOrganizersHtml} placeholder="Wpisz informacje o organizatorach..." minHeight="100px" />
              </div>
              <div className="space-y-2">
                <Label>Regulamin</Label>
                <p className="text-sm text-muted-foreground">Wpisz treść regulaminu lub dodaj linki do plików PDF.</p>
                <RichTextEditor value={props.rulesHtml} onChange={props.setRulesHtml} placeholder="Wpisz regulamin lub dodaj linki do dokumentów..." minHeight="120px" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox id="requireFinalAcceptance" checked={props.requireFinalAcceptance} onCheckedChange={(c) => props.setRequireFinalAcceptance(c === true)} />
                  <Label htmlFor="requireFinalAcceptance" className="cursor-pointer">Wymagaj dodatkowej akceptacji przy rejestracji</Label>
                </div>
                {props.requireFinalAcceptance && (
                  <div className="space-y-2 pl-6">
                    <Label>Tekst akceptacji</Label>
                    <p className="text-sm text-muted-foreground">Ten tekst pojawi się jako checkbox, który uczestnik musi zaakceptować przy rejestracji.</p>
                    <RichTextEditor value={props.finalAcceptanceHtml} onChange={props.setFinalAcceptanceHtml} placeholder="Oświadczam, że zapoznałem się z regulaminem..." minHeight="100px" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Embed config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" /> Zapisy przez iframe (embed)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Włącz widget do osadzenia</Label>
              <p className="text-sm text-muted-foreground">Partnerzy mogą umieścić formularz zapisów na swojej stronie</p>
            </div>
            <Switch checked={props.embedEnabled} onCheckedChange={props.setEmbedEnabled} />
          </div>
          {props.embedEnabled && (
            <div className="space-y-4 pt-2 border-t">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Embed aktywny od</Label>
                  <Input type="date" value={props.embedStartDate} onChange={e => props.setEmbedStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Embed aktywny do</Label>
                  <Input type="date" value={props.embedEndDate} onChange={e => props.setEmbedEndDate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Kod do osadzenia</Label>
                <div className="relative">
                  <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                    {`<iframe src="${window.location.origin}/events/${props.name ? props.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : 'slug'}/embed" width="100%" height="500" frameborder="0"></iframe>`}
                  </pre>
                  <Button type="button" variant="outline" size="sm" className="absolute top-2 right-2" onClick={handleCopyEmbed}>
                    <Copy className="h-3 w-3 mr-1" /> Kopiuj
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registration form config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" /> Konfiguracja formularza zapisów
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Wybierz, które dane chcesz zbierać od uczestników podczas rejestracji.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {FORM_CONFIG_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center space-x-3 p-3 rounded-lg border">
                <Checkbox
                  id={`fc-${key}`}
                  checked={props.formConfig[key]}
                  onCheckedChange={(checked) => props.setFormConfig(prev => ({ ...prev, [key]: checked === true }))}
                />
                <Label htmlFor={`fc-${key}`} className="cursor-pointer">{label}</Label>
              </div>
            ))}
          </div>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="w-full justify-between">
                Pola niestandardowe ({props.formConfig.customFields.length})
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              {props.formConfig.customFields.map((field, idx) => (
                <div key={field.id} className="flex items-start gap-2 p-3 rounded-lg border">
                  <div className="flex-1 grid sm:grid-cols-3 gap-2">
                    <Input placeholder="Nazwa pola" value={field.label} onChange={e => updateCustomField(idx, { label: e.target.value })} />
                    <Select value={field.type} onValueChange={(v: 'text' | 'select' | 'checkbox') => updateCustomField(idx, { type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Tekst</SelectItem>
                        <SelectItem value="select">Lista wyboru</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Checkbox checked={field.required} onCheckedChange={(c) => updateCustomField(idx, { required: c === true })} />
                      <Label className="text-sm">Wymagane</Label>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeCustomField(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addCustomField}>
                <Plus className="h-4 w-4 mr-2" /> Dodaj pole
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Display options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" /> Opcje wyświetlania
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Ustawienia wpływające na wyświetlanie listy startowej i danych uczestników.</p>
          <div className="space-y-2">
            <Label>Domyślne sortowanie listy startowej</Label>
            <Select value={props.displayOptions.defaultSort} onValueChange={(v: EventDisplayOptions['defaultSort']) => props.setDisplayOptions(prev => ({ ...prev, defaultSort: v }))}>
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
            <Switch checked={props.displayOptions.uppercaseNames} onCheckedChange={(c) => props.setDisplayOptions(prev => ({ ...prev, uppercaseNames: c }))} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label>Ukryj nieopłaconych</Label>
              <p className="text-xs text-muted-foreground">Uczestnicy z nieopłaconymi zapisami nie będą widoczni na liście startowej</p>
            </div>
            <Switch checked={props.displayOptions.hideUnpaid} onCheckedChange={(c) => props.setDisplayOptions(prev => ({ ...prev, hideUnpaid: c }))} />
          </div>
        </CardContent>
      </Card>

      {props.bannerUrl && (
        <ImageCropper
          imageUrl={props.bannerUrl}
          open={showBannerCropper}
          onOpenChange={setShowBannerCropper}
          aspectRatio={16 / 9}
          title="Przytnij baner wydarzenia"
          onCrop={(crop) => props.setBannerCropArea(crop)}
        />
      )}
    </>
  );
};

import { useState } from 'react';
