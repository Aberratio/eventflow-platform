import { disciplineLabels, uploadEventImage, getEventBackgrounds } from '@/api';
import { toast } from 'sonner';
import { safeUrl } from '@/lib/safeUrl';
import { EventSelfServiceSection } from './EventSelfServiceSection';
import {
  EVENT_DOCUMENT_TYPE_LABELS,
  EventDocumentType,
  EventLogisticsInfo,
  PaymentConfigType,
  OrganizerLogoShape,
  EventBackground,
} from '@/types';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DateInput, TimeInput } from '@/components/ui/date-time-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldHelp, HelpLabel } from '@/components/ui/field-help';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Image,
  Upload,
  Trash2,
  Crop,
  Globe,
  CreditCard,
  Building2,
  FileText,
  Lock,
  Copy,
  RefreshCw,
  Code,
  Settings2,
  Monitor,
  ExternalLink,
  Calendar,
  Clock,
  MapPin,
  Info,
  ChevronDown,
  RectangleHorizontal,
  RectangleVertical,
  Square,
  Paperclip,
  Loader2,
  ParkingSquare,
  ShirtIcon,
  Briefcase,
  Toilet,
  Coffee,
  Utensils,
  HeartPulse,
  ShowerHead,
  ShoppingBag,
  Package,
  Plus,
  Link2,
  ClipboardList,
  Timer,
  Trophy,
  AlertCircle,
} from 'lucide-react';
import { ImageCropper } from '@/components/ImageCropper';
import { DisciplineIcon } from '@/components/icons/DisciplineIcon';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import type { EventFormState, SubStep } from '../hooks/useEventFormState';
import { EventFormOrganizerSection } from './EventFormOrganizerSection';
import { DisciplineMultiSelect } from './DisciplineMultiSelect';

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="flex items-center gap-1 text-xs text-destructive">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  ) : null;

const inputError = (hasError: boolean) =>
  hasError
    ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20'
    : '';

interface EventFormStep1Props {
  form: EventFormState;
  activeSubStep?: string;
}

interface EventImageUploadFieldProps {
  label: string;
  description: string;
  recommendedSize: string;
  value: string;
  onChange: (url: string) => void;
  originalValue: string;
  onOriginalChange: (url: string) => void;
  aspectRatio: number;
  outputWidth: number;
  cropTitle: string;
  showPreview?: boolean;
  previewClassName?: string;
  previewImageClassName?: string;
}

const resizeToBlob = (file: File, maxWidth: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.naturalWidth);
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('no-ctx'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob-failed'))),
        'image/jpeg',
        0.92,
      );
    };
    img.onerror = () => reject(new Error('img-load-failed'));
    img.src = url;
  });

const isSupportedImageFile = (file: File) =>
  ['image/jpeg', 'image/png', 'image/webp'].includes(file.type.toLowerCase()) ||
  (file.type === '' && /\.(jpe?g|png|webp)$/i.test(file.name));

const EventImageUploadField = ({
  label,
  description,
  recommendedSize,
  value,
  onChange,
  originalValue,
  onOriginalChange,
  aspectRatio,
  outputWidth,
  cropTitle,
  showPreview = true,
  previewClassName,
  previewImageClassName = 'object-cover',
}: EventImageUploadFieldProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalFileRef = useRef<File | null>(null);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('event-image');
  const [showCropper, setShowCropper] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (selectedPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(selectedPreviewUrl);
    };
  }, [selectedPreviewUrl]);

  const handleFileChange = (file?: File) => {
    if (!file) return;
    if (!isSupportedImageFile(file)) {
      toast.error('Nieprawidłowy plik', {
        description: 'Wybierz obraz w formacie JPG, PNG albo WebP.',
      });
      return;
    }

    if (selectedPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(selectedPreviewUrl);
    originalFileRef.current = file;
    setSelectedFileName(file.name.replace(/\.[^.]+$/, '') || 'event-image');
    setSelectedPreviewUrl(URL.createObjectURL(file));
    setShowCropper(true);
  };

  const handleRemove = () => {
    if (selectedPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(selectedPreviewUrl);
    if (fileInputRef.current) fileInputRef.current.value = '';
    originalFileRef.current = null;
    setSelectedPreviewUrl('');
    setShowCropper(false);
    onChange('');
    onOriginalChange('');
  };

  const handleRecrop = () => {
    if (!originalValue) return;
    if (selectedPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(selectedPreviewUrl);
    setSelectedFileName('event-image');
    setSelectedPreviewUrl(originalValue);
    setShowCropper(true);
  };

  const handleUpload = async (_crop: unknown, croppedBlob?: Blob) => {
    if (!croppedBlob) {
      toast.error('Nie udało się przyciąć obrazu', {
        description: 'Spróbuj wybrać plik ponownie.',
      });
      return;
    }

    setIsUploading(true);
    try {
      const originalFile = originalFileRef.current;
      if (originalFile) {
        const [croppedResponse, originalResponse] = await Promise.all([
          uploadEventImage(
            new File([croppedBlob], `${selectedFileName}.jpg`, { type: 'image/jpeg' }),
          ),
          resizeToBlob(originalFile, 3000).then((blob) =>
            uploadEventImage(
              new File([blob], `${selectedFileName}-original.jpg`, { type: 'image/jpeg' }),
            ),
          ),
        ]);
        onChange(croppedResponse.data.url);
        onOriginalChange(originalResponse.data.url);
        originalFileRef.current = null;
      } else {
        const response = await uploadEventImage(
          new File([croppedBlob], `${selectedFileName}.jpg`, { type: 'image/jpeg' }),
        );
        onChange(response.data.url);
      }
      toast.success('Obraz zapisany', { description: 'Wgrano i sformatowano obraz wydarzenia.' });
    } catch (error) {
      toast.error('Nie udało się wgrać obrazu', {
        description: error instanceof Error ? error.message : 'Spróbuj ponownie.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <HelpLabel description={description}>{label}</HelpLabel>
      <p className="text-sm text-muted-foreground">{recommendedSize}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" asChild disabled={isUploading}>
          <label className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            {value ? 'Zmień obraz' : 'Wgraj obraz'}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                handleFileChange(event.target.files?.[0]);
                event.currentTarget.value = '';
              }}
            />
          </label>
        </Button>
        {value && (
          <>
            <Button type="button" variant="outline" onClick={handleRecrop} disabled={isUploading}>
              <Crop className="mr-2 h-4 w-4" />
              Zmień przycięcie
            </Button>
            <Button
              aria-label="Usuń plik"
              type="button"
              variant="outline"
              size="icon"
              onClick={handleRemove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      {showPreview && value && (
        <div
          className={`overflow-hidden rounded-md border bg-muted ${previewClassName ?? ''}`}
          style={{ aspectRatio }}
        >
          <img src={value} alt="" className={`h-full w-full ${previewImageClassName}`} />
        </div>
      )}
      {selectedPreviewUrl && (
        <ImageCropper
          imageUrl={selectedPreviewUrl}
          open={showCropper}
          onOpenChange={setShowCropper}
          aspectRatio={aspectRatio}
          outputWidth={outputWidth}
          title={cropTitle}
          onCrop={handleUpload}
        />
      )}
    </div>
  );
};

const DOCUMENT_TYPES: EventDocumentType[] = [
  'regulamin',
  'harmonogram',
  'mapa',
  'informacje',
  'wyniki',
  'inne',
];

const ACCEPTED_DOCUMENT_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.webp';

const DocumentsUploadSection = ({ form }: { form: EventFormState }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingType, setPendingType] = useState<EventDocumentType>('regulamin');
  const [pendingName, setPendingName] = useState('');
  const [uploadError, setUploadError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = '';
    if (!file) return;
    setUploadError('');
    try {
      await form.addDocumentFile(file, pendingType, pendingName.trim());
      setPendingName('');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Błąd podczas wgrywania pliku.');
    }
  };

  return (
    <div className="space-y-3">
      <HelpLabel description="Wgraj pliki powiązane z wydarzeniem — regulamin, harmonogram, mapę trasy itp. Uczestnicy będą mogli je pobrać lub podejrzeć na stronie wydarzenia.">
        Załączniki
      </HelpLabel>

      {form.documents.length > 0 && (
        <div className="space-y-2">
          {form.documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
              <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <Input
                  value={doc.name}
                  onChange={(e) => form.updateDocument(doc.id, 'name', e.target.value)}
                  className="h-7 border-0 bg-transparent p-0 text-sm font-medium shadow-none focus-visible:ring-0"
                  placeholder="Nazwa dokumentu"
                />
                <div className="flex items-center gap-2">
                  <Select
                    value={doc.type}
                    onValueChange={(v) =>
                      form.updateDocument(doc.id, 'type', v as EventDocumentType)
                    }
                  >
                    <SelectTrigger className="h-6 w-auto border-0 bg-transparent p-0 text-xs text-muted-foreground shadow-none focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="text-xs">
                          {EVENT_DOCUMENT_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="truncate text-xs text-muted-foreground">{doc.fileName}</span>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => form.removeDocument(doc.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Nazwa (opcjonalna)</Label>
          <Input
            value={pendingName}
            onChange={(e) => setPendingName(e.target.value)}
            placeholder="np. Regulamin biegu 2025"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Typ</Label>
          <Select value={pendingType} onValueChange={(v) => setPendingType(v as EventDocumentType)}>
            <SelectTrigger className="h-8 w-40 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="text-sm">
                  {EVENT_DOCUMENT_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 shrink-0"
          disabled={form.isUploadingDocument}
          onClick={() => fileInputRef.current?.click()}
        >
          {form.isUploadingDocument ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="mr-1.5 h-3.5 w-3.5" />
          )}
          {form.isUploadingDocument ? 'Wgrywanie…' : 'Wgraj plik'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_DOCUMENT_TYPES}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
      <p className="text-xs text-muted-foreground">
        Obsługiwane formaty: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG, WebP. Maks. 5 MB.
      </p>
    </div>
  );
};

interface EventImagesPlacementPreviewProps {
  form: EventFormState;
}

const logoShapeOptions: Array<{
  value: OrganizerLogoShape;
  label: string;
  description: string;
  icon: typeof Square;
}> = [
  {
    value: 'square',
    label: 'Kwadrat',
    description: 'Dla symboli i znaków o równych bokach.',
    icon: Square,
  },
  {
    value: 'landscape',
    label: 'Poziom',
    description: 'Dla szerokich logotypów z tekstem.',
    icon: RectangleHorizontal,
  },
  {
    value: 'portrait',
    label: 'Pion',
    description: 'Dla wysokich herbów i znaków pionowych.',
    icon: RectangleVertical,
  },
];

const getLogoShapeConfig = (shape: OrganizerLogoShape = 'square') => {
  switch (shape) {
    case 'landscape':
      return {
        aspectRatio: 16 / 9,
        outputWidth: 800,
        previewClassName: 'max-w-36',
        heroClassName: 'h-11 w-20 sm:h-14 sm:w-28 md:h-16 md:w-32',
        placeholderClassName: 'h-11 w-20 sm:h-14 sm:w-28 md:h-16 md:w-32',
      };
    case 'portrait':
      return {
        aspectRatio: 3 / 4,
        outputWidth: 600,
        previewClassName: 'max-w-20',
        heroClassName: 'h-16 w-12 sm:h-20 sm:w-[3.75rem] md:h-24 md:w-[4.5rem]',
        placeholderClassName: 'h-16 w-12 sm:h-20 sm:w-[3.75rem] md:h-24 md:w-[4.5rem]',
      };
    case 'square':
    default:
      return {
        aspectRatio: 1,
        outputWidth: 600,
        previewClassName: 'max-w-28',
        heroClassName: 'h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20',
        placeholderClassName: 'h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20',
      };
  }
};

const EmptyImagePreview = ({ label, className }: { label: string; className?: string }) => (
  <div
    className={`flex items-center justify-center bg-muted text-center text-xs text-muted-foreground ${className ?? ''}`}
  >
    {label}
  </div>
);

const MainEventImagePlacementPreview = ({ form }: EventImagesPlacementPreviewProps) => {
  const eventName = form.name || 'Nazwa wydarzenia';
  const eventDate = form.date || 'Data wydarzenia';
  const eventCity = form.isVirtual ? 'Wydarzenie wirtualne' : form.city || 'Miasto';

  return (
    <div className="max-w-xl rounded-md border bg-black/10 p-2.5">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Image className="h-3.5 w-3.5" />
        Glowny obraz poza hero
      </div>
      <div className="flex gap-3">
        <div className="h-14 w-20 shrink-0 overflow-hidden rounded bg-muted">
          {form.imageUrl ? (
            <img src={form.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <EmptyImagePreview label="glowny obraz" className="h-full px-2" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-sm font-medium">{eventName}</div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {eventDate}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {eventCity}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const EventImagesPlacementPreview = ({ form }: EventImagesPlacementPreviewProps) => {
  const heroImageUrl = form.bannerUrl;
  const eventName = form.name || 'Nazwa wydarzenia';
  const logoShape = getLogoShapeConfig(form.organizerLogoShape);

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold">Podgląd umiejscowienia obrazów</h4>
          <p className="text-xs text-muted-foreground">
            Tak baner i logo będą łączone na publicznej stronie wydarzenia.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px]">
          Podglad
        </Badge>
      </div>

      <div className="overflow-hidden rounded-md border bg-background">
        <div className="relative aspect-[16/7] overflow-hidden bg-muted">
          {heroImageUrl ? (
            <img
              src={heroImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <EmptyImagePreview
              label="Baner strony wydarzenia (brak — dodaj poniżej)"
              className="absolute inset-0 px-4"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent" />
          {form.organizerLogoUrl ? (
            <img
              src={form.organizerLogoUrl}
              alt=""
              className={`absolute right-3 top-3 rounded-lg border-2 border-background bg-background/90 object-contain p-1 shadow-md ${logoShape.heroClassName}`}
            />
          ) : (
            <div
              className={`absolute right-3 top-3 flex items-center justify-center rounded-lg border-2 border-background bg-background/80 text-center text-[9px] leading-tight text-muted-foreground shadow-md ${logoShape.placeholderClassName}`}
            >
              logo
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {form.disciplines.map((d) => (
                <Badge key={d} className="bg-background/85 text-[10px] backdrop-blur-sm">
                  <DisciplineIcon discipline={d} size="sm" className="mr-1 h-3 w-3" />
                  {disciplineLabels[d]}
                </Badge>
              ))}
              {form.isVirtual && (
                <Badge variant="outline" className="bg-background/80 text-[10px]">
                  <Globe className="mr-1 h-3 w-3" />
                  Wirtualne
                </Badge>
              )}
            </div>
            <div className="line-clamp-1 text-base font-bold sm:text-lg">{eventName}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Organizator:{' '}
              {form.organizers.find((o) => o.id === form.selectedOrganizerId)?.companyName ||
                form.organizers.find((o) => o.id === form.selectedOrganizerId)?.name ||
                'organizator'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type LogisticsFieldStatus = 'yes' | 'no' | null;
type LogisticsKey = keyof EventLogisticsInfo;

interface LogisticsLocation {
  id: string;
  label: string;
  mapsUrl?: string;
  address?: string;
  date?: string;
  openFrom?: string;
  openTo?: string;
  note?: string;
}

interface LogisticsRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  locationLabel?: string;
  status: LogisticsFieldStatus;
  onStatusChange: (s: LogisticsFieldStatus) => void;
  infoHtml: string | undefined;
  onInfoChange: (html: string) => void;
  locations?: LogisticsLocation[];
  onAddLocation?: () => void;
  onRemoveLocation?: (id: string) => void;
  onUpdateLocation?: (id: string, updates: Partial<LogisticsLocation>) => void;
  locationMode?: 'standard' | 'office';
}

const LogisticsRow = ({
  icon,
  label,
  description,
  locationLabel = 'Lokalizację',
  status,
  onStatusChange,
  infoHtml,
  onInfoChange,
  locations,
  onAddLocation,
  onRemoveLocation,
  onUpdateLocation,
  locationMode = 'standard',
}: LogisticsRowProps) => (
  <div className="space-y-3 rounded-lg border bg-card p-4">
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0 text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-sm font-medium">{label}</span>
          <div className="flex items-center gap-1 rounded-full border bg-muted/50 p-0.5">
            {(['yes', 'no', null] as LogisticsFieldStatus[]).map((val) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => onStatusChange(val)}
                className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors ${
                  status === val
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {val === 'yes' ? 'Tak' : val === 'no' ? 'Nie' : 'Brak info'}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>

    {status === 'yes' && (
      <div className="space-y-3 sm:pl-7">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            Dodatkowe informacje (opcjonalnie)
          </Label>
          <RichTextEditor
            value={infoHtml || ''}
            onChange={onInfoChange}
            placeholder="Wpisz szczegółowe informacje dla uczestników..."
            minHeight="80px"
            ariaLabel={`${label} — dodatkowe informacje`}
          />
        </div>

        {onAddLocation && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Lokalizacje na mapie (opcjonalnie)
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddLocation}
                className="h-7 gap-1 text-xs"
              >
                <Plus className="h-3 w-3" /> Dodaj {locationLabel.toLowerCase()}
              </Button>
            </div>
            {(locations || []).map((loc, idx) => (
              <div key={loc.id} className="space-y-2 rounded-md border bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {locationLabel} {idx + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveLocation?.(loc.id)}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {locationMode === 'office' && (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" /> Data
                      </Label>
                      <DateInput
                        value={loc.date || ''}
                        onValueChange={(date) => onUpdateLocation?.(loc.id, { date })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3" /> Od
                      </Label>
                      <TimeInput
                        value={loc.openFrom || ''}
                        onValueChange={(openFrom) => onUpdateLocation?.(loc.id, { openFrom })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3" /> Do
                      </Label>
                      <TimeInput
                        value={loc.openTo || ''}
                        onValueChange={(openTo) => onUpdateLocation?.(loc.id, { openTo })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Nazwa / opis</Label>
                    <Input
                      value={loc.label}
                      onChange={(e) => onUpdateLocation?.(loc.id, { label: e.target.value })}
                      placeholder={`np. ${locationLabel} przy stadionie`}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="flex items-center gap-1 text-xs">
                      <Link2 className="h-3 w-3" /> Link Google Maps
                    </Label>
                    <Input
                      value={loc.mapsUrl || ''}
                      onChange={(e) => onUpdateLocation?.(loc.id, { mapsUrl: e.target.value })}
                      placeholder="https://maps.google.com/..."
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center gap-1 text-xs">
                    <MapPin className="h-3 w-3" /> Adres (opcjonalnie)
                  </Label>
                  <Input
                    value={loc.address || ''}
                    onChange={(e) => onUpdateLocation?.(loc.id, { address: e.target.value })}
                    placeholder="np. ul. Sportowa 1, 00-000 Warszawa"
                    className="h-8 text-sm"
                  />
                </div>
                {locationMode === 'office' && (
                  <div className="space-y-1">
                    <Label className="text-xs">Uwagi do godzin / miejsca (opcjonalnie)</Label>
                    <Input
                      value={loc.note || ''}
                      onChange={(e) => onUpdateLocation?.(loc.id, { note: e.target.value })}
                      placeholder="np. tylko odbiór pakietów dla dystansu 10 km"
                      className="h-8 text-sm"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
);

const LOGISTICS_FIELDS: {
  key: LogisticsKey;
  icon: React.ReactNode;
  label: string;
  description: string;
  locationLabel?: string;
  withLocations?: boolean;
  locationMode?: 'standard' | 'office';
}[] = [
  {
    key: 'parking',
    icon: <ParkingSquare className="h-4 w-4" />,
    label: 'Parkingi',
    description: 'Czy w pobliżu startu/mety są parkingi dla uczestników?',
    locationLabel: 'Parking',
    withLocations: true,
  },
  {
    key: 'changingRooms',
    icon: <ShirtIcon className="h-4 w-4" />,
    label: 'Szatnie',
    description: 'Czy na miejscu są szatnie / miejsca do przebrania się?',
    locationLabel: 'Szatnia',
    withLocations: true,
  },
  {
    key: 'luggage',
    icon: <Briefcase className="h-4 w-4" />,
    label: 'Przechowywanie bagażu / depozyty',
    description: 'Czy dostępna jest możliwość zostawienia rzeczy?',
  },
  {
    key: 'toilets',
    icon: <Toilet className="h-4 w-4" />,
    label: 'Toalety',
    description: 'Czy na trasie / na starcie są toalety?',
    locationLabel: 'Punkt toaletowy',
    withLocations: true,
  },
  {
    key: 'buffet',
    icon: <Coffee className="h-4 w-4" />,
    label: 'Bufet / napoje na punktach',
    description: 'Czy na trasie są punkty z napojami lub przekąskami?',
    locationLabel: 'Punkt odżywczy',
    withLocations: true,
  },
  {
    key: 'meals',
    icon: <Utensils className="h-4 w-4" />,
    label: 'Posiłki / catering',
    description: 'Czy po zawodach lub na mecie serwowany jest posiłek?',
  },
  {
    key: 'medicalPoint',
    icon: <HeartPulse className="h-4 w-4" />,
    label: 'Punkt medyczny',
    description: 'Czy na miejscu jest obsługa medyczna lub ratownicza?',
    locationLabel: 'Punkt medyczny',
    withLocations: true,
  },
  {
    key: 'showers',
    icon: <ShowerHead className="h-4 w-4" />,
    label: 'Prysznice',
    description: 'Czy po zawodach dostępne są prysznice?',
    locationLabel: 'Punkt z prysznicami',
    withLocations: true,
  },
  {
    key: 'merchandise',
    icon: <ShoppingBag className="h-4 w-4" />,
    label: 'Strefa gadżetów / merchandise',
    description: 'Czy na miejscu dostępne są gadżety lub pamiątki z imprezy?',
  },
  {
    key: 'baggage',
    icon: <Package className="h-4 w-4" />,
    label: 'Pakiety startowe',
    description: 'Czy i kiedy wydawane są pakiety startowe (numer, koszulka itd.)?',
    locationLabel: 'Punkt odbioru',
    withLocations: true,
  },
  {
    key: 'raceOffice',
    icon: <ClipboardList className="h-4 w-4" />,
    label: 'Biuro zawodów',
    description:
      'Podaj dni, godziny i miejsca działania biura zawodów. Możesz dodać kilka punktów lub dni.',
    locationLabel: 'Termin biura',
    withLocations: true,
    locationMode: 'office',
  },
  {
    key: 'timeMeasurement',
    icon: <Timer className="h-4 w-4" />,
    label: 'Pomiar czasu',
    description: 'Informacje o sposobie pomiaru czasu, chipach, numerach lub wynikach live.',
  },
  {
    key: 'awardsClassifications',
    icon: <Trophy className="h-4 w-4" />,
    label: 'Nagrody i klasyfikacje',
    description: 'Informacje o klasyfikacjach, dekoracjach, nagrodach i kategoriach nagradzanych.',
  },
  {
    key: 'additionalInfo',
    icon: <Info className="h-4 w-4" />,
    label: 'Dodatkowe informacje',
    description: 'Pozostałe informacje organizacyjne, które uczestnik powinien znać przed startem.',
  },
];

const LogisticsSection = ({ form }: { form: EventFormState }) => {
  const info = form.logisticsInfo;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-4 pb-3 sm:p-6">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" /> Logistyka zawodów
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
          <p className="text-sm text-muted-foreground">
            Zaznacz co będzie dostępne na zawodach. Uczestnicy zobaczą te informacje na stronie
            wydarzenia. Wybierz <strong>Tak</strong> (dostępne), <strong>Nie</strong> (niedostępne)
            lub <strong>Brak info</strong> (nie wyświetlaj).
          </p>
          {LOGISTICS_FIELDS.map((f) => (
            <LogisticsRow
              key={f.key}
              icon={f.icon}
              label={f.label}
              description={f.description}
              locationLabel={f.locationLabel}
              status={(info[f.key]?.status ?? null) as LogisticsFieldStatus}
              onStatusChange={(s) => form.updateLogisticsFieldStatus(f.key, s)}
              infoHtml={info[f.key]?.infoHtml}
              onInfoChange={(html) => form.updateLogisticsField(f.key, { infoHtml: html })}
              locations={
                f.withLocations ? (info[f.key]?.locations as LogisticsLocation[]) : undefined
              }
              onAddLocation={f.withLocations ? () => form.addLogisticsLocation(f.key) : undefined}
              locationMode={f.locationMode}
              onRemoveLocation={
                f.withLocations ? (id) => form.removeLogisticsLocation(f.key, id) : undefined
              }
              onUpdateLocation={
                f.withLocations
                  ? (id, updates) => form.updateLogisticsLocation(f.key, id, updates)
                  : undefined
              }
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

const EventBackgroundPicker = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) => {
  const { data } = useQuery({
    queryKey: ['event-backgrounds'],
    queryFn: () => getEventBackgrounds().then((r) => r.data as EventBackground[]),
  });
  const backgrounds = data ?? [];

  if (backgrounds.length === 0) return null;

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium">
          Tło strony wydarzenia <span className="text-destructive">*</span>
        </Label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Tło widoczne na stronie wydarzenia. Wybierz jedno z dostępnych.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {backgrounds.map((bg) => (
          <button
            key={bg.id}
            type="button"
            onClick={() => onChange(bg.id)}
            className={`group relative overflow-hidden rounded-lg border-2 transition-all ${
              value === bg.id
                ? 'border-primary shadow-md'
                : 'border-transparent hover:border-primary/40'
            }`}
          >
            <img
              src={bg.thumbnailUrl ?? bg.imageUrl}
              alt={bg.name}
              className="aspect-video w-full object-cover"
            />
            {value === bg.id && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                <div className="rounded-full bg-primary p-1">
                  <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M10 3L5 8.5 2 5.5l-1 1L5 10.5l6-7-1-0.5z" />
                  </svg>
                </div>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-1">
              <span className="truncate text-xs text-white">{bg.name}</span>
            </div>
          </button>
        ))}
      </div>
      {!value && <p className="text-xs text-destructive">Wybierz tło strony wydarzenia.</p>}
    </div>
  );
};

export const EventFormStep1 = ({ form, activeSubStep = 'basic' }: EventFormStep1Props) => {
  const isEmbedRegistration = form.registrationMode === 'external_embed';
  const showValidation = form.shownValidationSubSteps.includes(activeSubStep as SubStep);
  const fe = showValidation ? form.fieldValidationErrors : {};
  const [registrationTypeOpen, setRegistrationTypeOpen] = useState(false);
  const logoShapeConfig = getLogoShapeConfig(form.organizerLogoShape);
  const registrationTypeLabel = isEmbedRegistration
    ? 'Zewnętrzny formularz embed'
    : 'Formularz Zmierzymy Czas';
  const registrationTypeSummary = isEmbedRegistration
    ? 'Zapisy po stronie organizatora lub zewnętrznego systemu'
    : 'Zapisy po stronie Zmierzymy Czas';

  return (
    <div className="space-y-6">
      {/* ── registration: Typ zawodów ── */}
      {activeSubStep === 'registration' && (
        <Card>
          <Collapsible open={registrationTypeOpen} onOpenChange={setRegistrationTypeOpen}>
            <CardHeader className="p-4 pb-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Code className="h-5 w-5 text-primary" /> Typ zawodow
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="group flex w-full items-center gap-3 rounded-md border bg-muted/30 px-3 py-2 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      <span>{registrationTypeSummary}</span>
                      <Badge
                        variant={isEmbedRegistration ? 'outline' : 'secondary'}
                        className="text-[10px]"
                      >
                        {registrationTypeLabel}
                      </Badge>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-4">
                <RadioGroup
                  value={form.registrationMode}
                  onValueChange={(value) =>
                    form.setRegistrationMode(value as 'internal' | 'external_embed')
                  }
                  className="grid gap-3 md:grid-cols-2"
                >
                  <div
                    className={`relative flex items-start gap-3 rounded-lg border p-4 transition-colors ${form.registrationMode === 'internal' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}`}
                  >
                    <RadioGroupItem value="internal" id="registration_internal" className="mt-1" />
                    <div className="min-w-0 flex-1">
                      <Label
                        htmlFor="registration_internal"
                        className="flex cursor-pointer flex-wrap items-center gap-2 font-medium"
                      >
                        <Settings2 className="h-4 w-4 text-primary" /> Formularz Zmierzymy Czas
                        <Badge variant="secondary" className="text-[10px]">
                          najczęstszy wybór
                        </Badge>
                      </Label>
                      <FieldHelp description="Zapisy są obsługiwane przez formularz i płatności w systemie Zmierzymy Czas." />
                      <p className="mt-1 text-sm text-muted-foreground">
                        Uczestnik zapisuje się bezpośrednio w biurze zawodów.
                      </p>
                    </div>
                  </div>
                  <div
                    className={`relative flex items-start gap-3 rounded-lg border p-4 transition-colors ${form.registrationMode === 'external_embed' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}`}
                  >
                    <RadioGroupItem
                      value="external_embed"
                      id="registration_external"
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <Label
                        htmlFor="registration_external"
                        className="flex cursor-pointer flex-wrap items-center gap-2 font-medium"
                      >
                        <ExternalLink className="h-4 w-4 text-primary" /> Zewnetrzny formularz embed
                      </Label>
                      <FieldHelp description="Na stronie wydarzenia pokazujemy ramke Zmierzymy Czas, a w środku osadzamy formularz zapisów z podanego linku." />
                      <p className="mt-1 text-sm text-muted-foreground">
                        Zmierzymy Czas nie dostarcza formularza zapisów w tym wariancie. Zapisy,
                        płatności i lista uczestników są w całości po stronie organizatora lub
                        zewnętrznego systemu.
                      </p>
                    </div>
                  </div>
                </RadioGroup>

                {isEmbedRegistration && (
                  <Alert className="border-primary/30 bg-primary/5">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Embed: zapisy są po stronie organizatora</AlertTitle>
                    <AlertDescription>
                      Dla zawodów typu embed nie pokazujemy konfiguracji formularza rejestracji, pól
                      płatności ani opcji publicznej listy uczestników. Zmierzymy Czas pokazuje
                      tylko osadzony formularz z podanego linku.
                    </AlertDescription>
                  </Alert>
                )}

                {form.registrationMode === 'external_embed' && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <HelpLabel
                        htmlFor="externalRegistrationUrl"
                        description="Pełny adres strony lub formularza zapisów, który ma zostać osadzony w widoku wydarzenia."
                      >
                        Link do zewnętrznego formularza *
                      </HelpLabel>
                      <Input
                        id="externalRegistrationUrl"
                        value={form.externalRegistrationUrl}
                        onChange={(e) => form.setExternalRegistrationUrl(e.target.value)}
                        placeholder="https://partner.pl/zapisy/nazwa-wydarzenia"
                        className={inputError(!!fe['externalRegistrationUrl'])}
                      />
                      <FieldError message={fe['externalRegistrationUrl']} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <HelpLabel description="Opcjonalny początek dostępności osadzonego formularza zapisów na stronie wydarzenia.">
                          Data rozpoczęcia (opcjonalnie)
                        </HelpLabel>
                        <DateInput
                          value={form.embedStartDate}
                          onValueChange={form.setEmbedStartDate}
                        />
                      </div>
                      <div className="space-y-2">
                        <HelpLabel description="Opcjonalny koniec dostępności osadzonego formularza zapisów na stronie wydarzenia.">
                          Data zakończenia (opcjonalnie)
                        </HelpLabel>
                        <DateInput value={form.embedEndDate} onValueChange={form.setEmbedEndDate} />
                      </div>
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </CardContent>
          </Collapsible>
        </Card>
      )}

      {/* ── basic: Podstawowe informacje ── */}
      {activeSubStep === 'basic' && (
        <Card>
          <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-2">
            <CardTitle className="text-xl">Podstawowe informacje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-5 sm:pt-0">
            <div className="grid gap-4 md:grid-cols-2">
              {form.canChooseOrganizer && (
                <div className="space-y-2 md:col-span-2">
                  <HelpLabel
                    htmlFor="organizer"
                    description="Wskazuje konto organizatora, do którego zostanie przypisane wydarzenie, limit wydarzeń i późniejsze zarządzanie."
                  >
                    Organizator *
                  </HelpLabel>
                  <Select
                    value={form.selectedOrganizerId}
                    onValueChange={form.setSelectedOrganizerId}
                  >
                    <SelectTrigger id="organizer">
                      <SelectValue placeholder="Wybierz organizatora" />
                    </SelectTrigger>
                    <SelectContent>
                      {form.organizers.map((organizer) => (
                        <SelectItem key={organizer.id} value={organizer.id}>
                          {organizer.companyName || organizer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.organizersLoadError && <FieldError message={form.organizersLoadError} />}
                </div>
              )}
              <div className="md:col-span-2">
                <p
                  className={
                    form.eventLimitError ||
                    (form.selectedEventLimit && form.selectedEventLimit.available <= 0)
                      ? 'text-sm text-destructive'
                      : 'text-sm text-muted-foreground'
                  }
                >
                  {form.eventLimitError
                    ? form.eventLimitError
                    : form.selectedEventLimit
                      ? `Limit wydarzeń: wykorzystano ${form.selectedEventLimit.used} z ${form.selectedEventLimit.limit}. Dostępne: ${form.selectedEventLimit.available}.`
                      : 'Ładowanie limitu wydarzeń...'}
                </p>
              </div>
              <div className="space-y-2">
                <HelpLabel
                  htmlFor="name"
                  description="Publiczna nazwa wydarzenia widoczna na listach, stronie szczegółów, w rejestracji i komunikacji z uczestnikami."
                >
                  Nazwa wydarzenia *
                </HelpLabel>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => form.setName(e.target.value)}
                  placeholder="np. Warsaw Marathon 2025"
                  className={inputError(!!fe['name'])}
                />
                <FieldError message={fe['name']} />
              </div>
              <DisciplineMultiSelect selected={form.disciplines} onChange={form.setDisciplines} />
            </div>

            <div className="space-y-2">
              <HelpLabel
                htmlFor="date"
                description="Główna data startu wydarzenia pokazywana uczestnikom w kalendarzu, listach wydarzeń i szczegółach zawodów."
              >
                Data wydarzenia *
              </HelpLabel>
              <DateInput
                id="date"
                value={form.date}
                onValueChange={form.setDate}
                className={inputError(!!fe['date'])}
                aria-invalid={!!fe['date']}
              />
              <FieldError message={fe['date']} />
            </div>

            <div className="space-y-3 rounded-md border bg-white/[0.025] p-3">
              <HelpLabel description="Określ kiedy otwierają i zamykają się zapisy. Data otwarcia jest opcjonalna — jeśli jej nie podasz, zapisy będą aktywne od razu po opublikowaniu wydarzenia.">
                Terminy rejestracji
              </HelpLabel>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-open-date" className="text-sm text-muted-foreground">
                    Otwarcie zapisów (opcjonalne)
                  </Label>
                  <DateInput
                    id="reg-open-date"
                    value={form.registrationOpenDate}
                    onValueChange={form.setRegistrationOpenDate}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="deadline" className="text-sm text-muted-foreground">
                    Zamknięcie zapisów *
                  </Label>
                  <DateInput
                    id="deadline"
                    value={form.registrationUntilEventStart ? form.date : form.registrationDeadline}
                    onValueChange={form.setRegistrationDeadline}
                    disabled={form.registrationUntilEventStart}
                    className={
                      form.registrationUntilEventStart
                        ? 'opacity-40'
                        : inputError(!!fe['registrationDeadline'])
                    }
                    aria-invalid={!!fe['registrationDeadline']}
                  />
                  <FieldError message={fe['registrationDeadline']} />
                </div>
              </div>

              <div
                className="flex cursor-pointer items-center gap-2 pt-0.5"
                onClick={() => {
                  const next = !form.registrationUntilEventStart;
                  form.setRegistrationUntilEventStart(next);
                  if (next && form.date) {
                    form.setRegistrationDeadline(form.date);
                  }
                }}
              >
                <Checkbox
                  id="reg-until-start"
                  checked={form.registrationUntilEventStart}
                  onCheckedChange={(c) => {
                    const next = c === true;
                    form.setRegistrationUntilEventStart(next);
                    if (next && form.date) {
                      form.setRegistrationDeadline(form.date);
                    }
                  }}
                />
                <Label htmlFor="reg-until-start" className="cursor-pointer text-sm">
                  Zapisy otwarte aż do dnia rozpoczęcia zawodów
                </Label>
              </div>
            </div>

            <EventSelfServiceSection
              enabled={form.selfServiceEnabled}
              onEnabledChange={form.setSelfServiceEnabled}
              deadline={form.selfServiceDeadline}
              onDeadlineChange={form.setSelfServiceDeadline}
              eventDate={form.date}
            />

            {/* Virtual event toggle */}
            <div className="space-y-3 rounded-md border bg-white/[0.025] p-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="isVirtual"
                  checked={form.isVirtual}
                  onCheckedChange={(checked) => {
                    form.setIsVirtual(checked === true);
                    if (checked) {
                      form.setLocation('Wydarzenie wirtualne');
                      form.setCity('Cały świat');
                    } else {
                      form.setLocation('');
                      form.setCity('');
                    }
                  }}
                />
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Globe className="h-4 w-4 shrink-0 text-primary" />
                  <Label htmlFor="isVirtual" className="cursor-pointer font-medium">
                    Wydarzenie wirtualne
                  </Label>
                  <FieldHelp description="Włączenie tej opcji oznacza, ze uczestnik realizuje aktywność samodzielnie poza jedna fizyczna lokalizacja i może podać wynik w określonym oknie." />
                </div>
              </div>
              {form.isVirtual && (
                <p className="text-sm text-muted-foreground sm:pl-7">
                  Uczestnicy wykonują aktywność samodzielnie w dowolnym miejscu i wprowadzają swoje
                  wyniki po zakończeniu okna czasowego.
                </p>
              )}
            </div>

            {form.isVirtual && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <HelpLabel
                    htmlFor="startDate"
                    description="Pierwszy dzień, od którego uczestnicy wydarzenia wirtualnego mogą wykonywać aktywność i przesyłać wynik."
                  >
                    Data rozpoczęcia okna *
                  </HelpLabel>
                  <DateInput
                    id="startDate"
                    value={form.startDate}
                    onValueChange={form.setStartDate}
                    className={inputError(!!fe['startDate'])}
                    aria-invalid={!!fe['startDate']}
                  />
                  <FieldError message={fe['startDate']} />
                </div>
                <div className="space-y-2">
                  <HelpLabel
                    htmlFor="endDate"
                    description="Ostatni dzień okna wirtualnego. Po tej dacie uczestnicy nie powinni już dodawać nowych wyników dla tego wydarzenia."
                  >
                    Data zakończenia okna *
                  </HelpLabel>
                  <DateInput
                    id="endDate"
                    value={form.endDate}
                    onValueChange={form.setEndDate}
                    className={inputError(!!fe['endDate'])}
                    aria-invalid={!!fe['endDate']}
                  />
                  <FieldError message={fe['endDate']} />
                </div>
              </div>
            )}

            {/* Private event toggle */}
            <div className="space-y-3 rounded-md border bg-white/[0.025] p-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="isPrivate"
                  checked={form.isPrivate}
                  onCheckedChange={(checked) => {
                    const val = checked === true;
                    form.setIsPrivate(val);
                    if (val && !form.accessCode) form.setAccessCode(form.generateAccessCode());
                  }}
                />
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Lock className="h-4 w-4 shrink-0 text-primary" />
                  <Label htmlFor="isPrivate" className="cursor-pointer font-medium">
                    Wydarzenie prywatne
                  </Label>
                  <FieldHelp description="Ukrywa wydarzenie z publicznych list. Dostęp maja tylko osoby, które otrzymają specjalny link z kodem dostępu." />
                </div>
              </div>
              {form.isPrivate && (
                <div className="space-y-3 sm:pl-7">
                  <p className="text-sm text-muted-foreground">
                    Prywatne wydarzenie nie będzie widoczne publicznie. Uczestnicy mogą dołączyć
                    tylko przez specjalny link.
                  </p>
                  <div className="space-y-2">
                    <HelpLabel
                      htmlFor="accessCode"
                      description="Kod dodawany do prywatnego linku wydarzenia. Pozwala uczestnikom wejść na stronę wydarzenia mimo braku widoczności publicznej."
                    >
                      Kod dostępu
                    </HelpLabel>
                    <div className="space-y-1">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
                        <Input
                          id="accessCode"
                          value={form.accessCode}
                          onChange={(e) => form.setAccessCode(e.target.value)}
                          placeholder="np. abc123xyz"
                          className={`min-w-0 font-mono ${inputError(!!fe['accessCode'])}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => form.setAccessCode(form.generateAccessCode())}
                          title="Wygeneruj nowy kod"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const slug = form.name ? form.generateSlug(form.name) : 'wydarzenie';
                            const url = `${window.location.origin}/events/${slug}?access=${form.accessCode}`;
                            navigator.clipboard.writeText(url);
                            toast.success('Skopiowano', {
                              description:
                                'Link do prywatnego wydarzenia został skopiowany do schowka.',
                            });
                          }}
                          title="Kopiuj link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <FieldError message={fe['accessCode']} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Biuro Zawodów (BZ) integration toggle — pasted organization
                token/identifier. The platform never creates a BZ
                organization itself: the organizer sets one up in BZ beforehand
                and pastes its token here. Distinct from the "Biuro zawodów"
                logistics info elsewhere in this form (race-day office hours) —
                this is the external systems integration. */}
            <div className="space-y-3 rounded-md border bg-white/[0.025] p-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="bzIntegrationEnabled"
                  checked={form.bzIntegrationEnabled}
                  onCheckedChange={(checked) => form.setBzIntegrationEnabled(checked === true)}
                />
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Link2 className="h-4 w-4 shrink-0 text-primary" />
                  <Label htmlFor="bzIntegrationEnabled" className="cursor-pointer font-medium">
                    Integracja z Biurem Zawodów (BZ)
                  </Label>
                  <FieldHelp description="Włącza synchronizacje tego Wydarzenia z istniejąca organizacja w Biurze Zawodów. Platforma nie zakłada organizacji w BZ automatycznie — założenie jej leży po stronie organizatora, poza tym systemem." />
                </div>
              </div>
              {form.bzIntegrationEnabled && (
                <div className="space-y-2 sm:pl-7">
                  <p className="text-sm text-muted-foreground">
                    Wklej identyfikator/token organizacji, która założyłeś wcześniej w Biurze
                    Zawodow.
                  </p>
                  <HelpLabel
                    htmlFor="bzOrganizationToken"
                    description="Token/identyfikator organizacji w Biurze Zawodów. Wymagany do włączenia integracji — bez niego platforma nie wie, do której organizacji w BZ przypisać to Wydarzenie."
                  >
                    Token organizacji BZ *
                  </HelpLabel>
                  <Input
                    id="bzOrganizationToken"
                    value={form.bzOrganizationToken}
                    onChange={(e) => form.setBzOrganizationToken(e.target.value)}
                    placeholder="np. bz-org-1234abcd"
                    className={`font-mono ${inputError(!!fe['bzOrganizationToken'])}`}
                    aria-invalid={!!fe['bzOrganizationToken']}
                  />
                  <FieldError message={fe['bzOrganizationToken']} />
                </div>
              )}
            </div>

            {!form.isVirtual && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <HelpLabel
                      htmlFor="location"
                      description="Dokladne miejsce startu lub centrum wydarzenia, np. stadion, park, hala albo adres punktu zbiorczego."
                    >
                      Lokalizacja (miejsce startu) *
                    </HelpLabel>
                    <Input
                      id="location"
                      value={form.location}
                      onChange={(e) => form.setLocation(e.target.value)}
                      placeholder="np. Stadion Narodowy"
                      className={inputError(!!fe['location'])}
                    />
                    <FieldError message={fe['location']} />
                  </div>
                  <div className="space-y-2">
                    <HelpLabel
                      htmlFor="city"
                      description="Miasto wykorzystywane w filtrach, listach wydarzeń i skróconych informacjach o lokalizacji."
                    >
                      Miasto *
                    </HelpLabel>
                    <Input
                      id="city"
                      value={form.city}
                      onChange={(e) => form.setCity(e.target.value)}
                      placeholder="np. Warszawa"
                      className={inputError(!!fe['city'])}
                    />
                    <FieldError message={fe['city']} />
                  </div>
                </div>
                <div className="space-y-2">
                  <HelpLabel
                    htmlFor="locationMapsUrl"
                    description="Link do pinezki w Google Maps, który pojawi się przy lokalizacji i ułatwi uczestnikom nawigację do miejsca startu. Skopiuj go z maps.google.com → Udostępnij → Kopiuj link."
                  >
                    Link do Google Maps (opcjonalnie)
                  </HelpLabel>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="locationMapsUrl"
                      value={form.locationMapsUrl}
                      onChange={(e) => form.setLocationMapsUrl(e.target.value)}
                      placeholder="https://maps.google.com/..."
                      className="pl-9"
                    />
                  </div>
                  {form.locationMapsUrl && (
                    <a
                      href={safeUrl(form.locationMapsUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Sprawdź link w nowej karcie
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <HelpLabel
                htmlFor="description"
                description="Sformatowany opis widoczny na stronie wydarzenia. Warto opisać trasę, charakter zawodów, atrakcje i najważniejsze informacje dla uczestnika."
              >
                Opis wydarzenia
              </HelpLabel>
              <RichTextEditor
                value={form.description}
                onChange={form.setDescription}
                placeholder="Opisz szczegóły wydarzenia, trasę, atrakcje..."
                minHeight="140px"
                ariaLabel="Opis wydarzenia"
              />
            </div>

            <EventImageUploadField
              label="Glowny obraz wydarzenia"
              description="Obraz używany w widokach publicznych, kartach i materiałach promocyjnych w aplikacji."
              recommendedSize="Zalecany format 16:9. Po wgraniu dopasujesz kadr przed zapisem."
              value={form.imageUrl}
              onChange={form.setImageUrl}
              originalValue={form.originalImageUrl}
              onOriginalChange={form.setOriginalImageUrl}
              aspectRatio={16 / 9}
              outputWidth={1200}
              cropTitle="Dopasuj glowny obraz wydarzenia"
              showPreview={false}
            />
            <MainEventImagePlacementPreview form={form} />

            {form.canManageFeatured && (
              <div className="flex items-start gap-2">
                <Checkbox
                  id="featured"
                  checked={form.featured}
                  onCheckedChange={(checked) => form.setFeatured(checked === true)}
                />
                <Label htmlFor="featured" className="cursor-pointer leading-5">
                  Wyróżnij wydarzenie na stronie głównej
                </Label>
                <FieldHelp description="Oznacza wydarzenie jako promowane. Może pojawić się wyżej lub w specjalnych sekcjach strony głównej." />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── media: Zdjęcia i media ── */}
      {activeSubStep === 'media' && (
        <Card>
          <CardHeader className="p-4 pb-3 sm:p-6">
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" /> Zdjęcia i media
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <EventImageUploadField
                  label="Baner wydarzenia (zdjęcie w tle)"
                  description="Widoczny jako duże zdjęcie w tle na stronie wydarzenia. Najlepiej sprawdza się dynamiczne, marketingowe zdjęcie z atmosferą zawodów — np. tłum startujących, meta, krajobraz trasy z poprzedniej edycji. Przyciąga uwagę i buduje wizerunek imprezy. Główny obraz wydarzenia nie jest tu używany jako zastępstwo — jeśli nie dodasz baneru, tło pozostanie puste."
                  recommendedSize="Zalecany format 16:9, minimum 1200 px szerokości."
                  value={form.bannerUrl}
                  onChange={(url) => {
                    form.setBannerUrl(url);
                    form.setBannerCropArea(undefined);
                  }}
                  originalValue={form.originalBannerUrl}
                  onOriginalChange={form.setOriginalBannerUrl}
                  aspectRatio={16 / 9}
                  outputWidth={1600}
                  cropTitle="Dopasuj baner wydarzenia"
                  previewClassName="max-w-64"
                />
                <div className="space-y-4">
                  <div className="space-y-3">
                    <HelpLabel description="Wybierz układ najbliższy realnym proporcjom logo. Ten wybór wpływa na kadrowanie, podgląd i wyświetlanie na stronie wydarzenia.">
                      Typ logo organizatora
                    </HelpLabel>
                    <RadioGroup
                      value={form.organizerLogoShape}
                      onValueChange={(value) =>
                        form.setOrganizerLogoShape(value as OrganizerLogoShape)
                      }
                      className="grid gap-2 sm:grid-cols-3"
                    >
                      {logoShapeOptions.map((option) => {
                        const Icon = option.icon;
                        const id = `organizer-logo-shape-${option.value}`;

                        return (
                          <div
                            key={option.value}
                            className={`relative flex items-start gap-2 rounded-lg border p-3 transition-colors ${
                              form.organizerLogoShape === option.value
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-muted-foreground/50'
                            }`}
                          >
                            <RadioGroupItem value={option.value} id={id} className="mt-1" />
                            <Label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
                              <span className="flex items-center gap-1.5 text-sm font-medium">
                                <Icon className="h-4 w-4 text-primary" />
                                {option.label}
                              </span>
                              <span className="mt-1 block text-xs font-normal leading-4 text-muted-foreground">
                                {option.description}
                              </span>
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </div>

                  <EventImageUploadField
                    label="Logo organizatora"
                    description="Logo wyświetlane przy wydarzeniu jako identyfikacja organizatora lub marki zawodów."
                    recommendedSize="Wybierz typ logo powyżej, a po wgraniu dopasujesz kadr do wybranych proporcji."
                    value={form.organizerLogoUrl}
                    onChange={form.setOrganizerLogoUrl}
                    originalValue={form.originalOrganizerLogoUrl}
                    onOriginalChange={form.setOriginalOrganizerLogoUrl}
                    aspectRatio={logoShapeConfig.aspectRatio}
                    outputWidth={logoShapeConfig.outputWidth}
                    cropTitle="Dopasuj logo organizatora"
                    previewClassName={logoShapeConfig.previewClassName}
                    previewImageClassName="bg-background object-contain p-1"
                  />
                </div>
              </div>
              <EventBackgroundPicker value={form.backgroundId} onChange={form.setBackgroundId} />

              <div className="mt-6">
                <EventImagesPlacementPreview form={form} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── payment: Płatności ── */}
      {activeSubStep === 'payment' && !form.canEditPayments && (
        <Alert className="border-muted bg-muted/50">
          <Info className="h-4 w-4" />
          <AlertTitle>Płatności ustawia właściciel wydarzenia</AlertTitle>
          <AlertDescription>
            Konfigurację płatności może zmieniać tylko właściciel wydarzenia. Pozostałe ustawienia
            możesz edytować i zapisać.
          </AlertDescription>
        </Alert>
      )}
      {activeSubStep === 'payment' && form.canEditPayments && (
        <Card>
          <CardHeader className="p-4 pb-3 sm:p-6">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" /> Płatności
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="space-y-4">
              {isEmbedRegistration ? (
                <Alert className="border-muted bg-muted/50">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Płatności poza Zmierzymy Czas</AlertTitle>
                  <AlertDescription>
                    Przy embedzie organizator sam ustala sposób przyjmowania opłat i rozlicza
                    uczestników poza tym systemem. Dlatego nie wymagamy danych bramki, konta
                    bankowego ani tytułu przelewu.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Wybierz sposób przyjmowania płatności od uczestników
                  </p>
                  <RadioGroup
                    value={form.paymentConfigType}
                    onValueChange={(value: PaymentConfigType) => form.setPaymentConfigType(value)}
                    className="space-y-4"
                  >
                    <div
                      className={`relative flex items-start gap-3 rounded-lg border p-4 transition-colors ${form.paymentConfigType === 'admin_gateway' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}`}
                    >
                      <RadioGroupItem value="admin_gateway" id="admin_gateway" className="mt-1" />
                      <div className="min-w-0 flex-1">
                        <Label
                          htmlFor="admin_gateway"
                          className="flex cursor-pointer flex-wrap items-center gap-2 font-medium"
                        >
                          <CreditCard className="h-4 w-4 text-primary" /> Bramka płatnicza
                          (automatyczna)
                        </Label>
                        <FieldHelp description="Płatności są obsługiwane przez bramkę administratora serwisu. Organizator nie musi ręcznie potwierdzać przelewów." />
                        <p className="mt-1 text-sm text-muted-foreground">
                          Płatności są przetwarzane automatycznie przez bramkę płatniczą
                          administratora serwisu.
                        </p>
                      </div>
                    </div>
                    <div
                      className={`relative flex items-start gap-3 rounded-lg border p-4 transition-colors ${form.paymentConfigType === 'organizer_bank' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}`}
                    >
                      <RadioGroupItem value="organizer_bank" id="organizer_bank" className="mt-1" />
                      <div className="min-w-0 flex-1">
                        <Label
                          htmlFor="organizer_bank"
                          className="flex cursor-pointer flex-wrap items-center gap-2 font-medium"
                        >
                          <Building2 className="h-4 w-4 text-primary" /> Przelew bankowy (ręczny)
                        </Label>
                        <FieldHelp description="Uczestnik dostaje dane do przelewu na konto organizatora, a status płatności trzeba później potwierdzać ręcznie." />
                        <p className="mt-1 text-sm text-muted-foreground">
                          Uczestnicy wpłacają na Twoje konto bankowe. Musisz ręcznie potwierdzać
                          otrzymane wpłaty.
                        </p>
                        {form.paymentConfigType === 'organizer_bank' && (
                          <div className="mt-4 space-y-4 border-t border-dashed pt-4">
                            <div className="space-y-2">
                              <HelpLabel
                                htmlFor="bankAccountNumber"
                                description="Numer rachunku, na który uczestnicy będą wysyłać opłaty startowe przy płatności przelewem bankowym."
                              >
                                Numer konta bankowego *
                              </HelpLabel>
                              <Input
                                id="bankAccountNumber"
                                value={form.bankAccountNumber}
                                onChange={(e) => form.setBankAccountNumber(e.target.value)}
                                placeholder="PL 00 0000 0000 0000 0000 0000 0000"
                                className={inputError(!!fe['bankAccountNumber'])}
                              />
                              <FieldError message={fe['bankAccountNumber']} />
                              <p className="text-xs text-muted-foreground">
                                Podaj pełny numer konta w formacie IBAN
                              </p>
                            </div>
                            <div className="space-y-2">
                              <HelpLabel
                                htmlFor="bankAccountHolder"
                                description="Nazwa odbiorcy przelewu widoczna dla uczestnika w instrukcji płatności."
                              >
                                Właściciel konta *
                              </HelpLabel>
                              <Input
                                id="bankAccountHolder"
                                value={form.bankAccountHolder}
                                onChange={(e) => form.setBankAccountHolder(e.target.value)}
                                placeholder="Nazwa firmy lub Imię Nazwisko"
                                className={inputError(!!fe['bankAccountHolder'])}
                              />
                              <FieldError message={fe['bankAccountHolder']} />
                            </div>
                            <div className="space-y-2">
                              <HelpLabel
                                htmlFor="transferTitle"
                                description="Szablon tytułu przelewu pokazywany uczestnikowi. Zmienne zostaną podstawione danymi wydarzenia, dystansu i uczestnika."
                              >
                                Wzór tytułu przelewu
                              </HelpLabel>
                              <Input
                                id="transferTitle"
                                value={form.transferTitle}
                                onChange={(e) => form.setTransferTitle(e.target.value)}
                                placeholder="Opłata za {eventName} - {participantName}"
                              />
                              <p className="text-xs text-muted-foreground">
                                Dostępne zmienne: {'{eventName}'}, {'{participantName}'},{' '}
                                {'{distanceName}'}, {'{birthDate}'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </RadioGroup>

                  <div className="mt-6 space-y-4 border-t pt-4">
                    <div>
                      <Label className="font-medium">Okno płatności</Label>
                      <FieldHelp description="Czas, po którym nieopłacony Zapis wygasa i zwalnia miejsce (oraz tańszy próg cenowy) dla kolejnej osoby. Bramka i przelew maja osobne okna, bo płatność bramka jest natychmiastowa, a przelew księguje się realnie kilka dni." />
                      <p className="mt-1 text-sm text-muted-foreground">
                        Po tym czasie nieopłacony Zapis wygasa i zwalnia miejsce kolejnej osobie.
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <HelpLabel
                          htmlFor="gatewayWindowMinutes"
                          description="Okno płatności dla bramki (Tpay/PayNow) — płatność jest natychmiastowa, więc dłuższe oczekiwanie tylko blokuje tańsza pule innym zapisującym się. Domyślnie 45 minut."
                        >
                          Okno bramki (minuty)
                        </HelpLabel>
                        <Input
                          id="gatewayWindowMinutes"
                          type="number"
                          min={1}
                          value={form.gatewayWindowMinutes}
                          onChange={(e) => form.setGatewayWindowMinutes(e.target.value)}
                          placeholder="45"
                        />
                      </div>
                      <div className="space-y-2">
                        <HelpLabel
                          htmlFor="transferWindowDays"
                          description="Okno płatności dla przelewu tradycyjnego — realny czas księgowania wpłaty. Domyślnie 3 dni robocze."
                        >
                          Okno przelewu (dni)
                        </HelpLabel>
                        <Input
                          id="transferWindowDays"
                          type="number"
                          min={1}
                          value={form.transferWindowDays}
                          onChange={(e) => form.setTransferWindowDays(e.target.value)}
                          placeholder="3"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── content: Treści ── */}
      {activeSubStep === 'content' && (
        <Card>
          <CardHeader className="p-4 pb-3 sm:p-6">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Treści
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="text-sm text-muted-foreground">
              Te pola pozwalają na formatowanie tekstu, dodawanie linków i list.
            </p>
            <div className="space-y-6">
              <DocumentsUploadSection form={form} />
              <div className="space-y-2">
                <HelpLabel description="Treści regulaminowe lub linki do dokumentów, które uczestnik powinien przeczytać przed zapisem.">
                  Regulamin
                </HelpLabel>
                <p className="text-sm text-muted-foreground">
                  Wpisz treść regulaminu lub dodaj linki do plików PDF.
                </p>
                <RichTextEditor
                  value={form.rulesHtml}
                  onChange={form.setRulesHtml}
                  placeholder="Wpisz regulamin lub dodaj linki do dokumentów..."
                  minHeight="72px"
                  ariaLabel="Regulamin"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="requireFinalAcceptance"
                    checked={form.requireFinalAcceptance}
                    onCheckedChange={(checked) => form.setRequireFinalAcceptance(checked === true)}
                  />
                  <Label htmlFor="requireFinalAcceptance" className="cursor-pointer leading-5">
                    Wymagaj dodatkowej akceptacji przy rejestracji
                  </Label>
                  <FieldHelp description="Dodaje do formularza zapisu dodatkowy checkbox z treścią, która uczestnik musi zaakceptować przed wysłaniem rejestracji." />
                </div>
                {form.requireFinalAcceptance && (
                  <div className="space-y-2 sm:pl-7">
                    <HelpLabel description="Treści widoczna przy dodatkowym checkboxie akceptacji w formularzu rejestracji uczestnika.">
                      Tekst akceptacji
                    </HelpLabel>
                    <p className="text-sm text-muted-foreground">
                      Ten tekst pojawi się jako checkbox, który uczestnik musi zaakceptować przy
                      rejestracji.
                    </p>
                    <RichTextEditor
                      value={form.finalAcceptanceHtml}
                      onChange={form.setFinalAcceptanceHtml}
                      placeholder="Oświadczam, że zapoznałem się z regulaminem..."
                      minHeight="100px"
                      ariaLabel="Tekst akceptacji"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── logistics: Logistyka zawodów ── */}
      {activeSubStep === 'logistics' && <LogisticsSection form={form} />}

      {/* ── registration: Formularz i wyświetlanie ── */}
      {activeSubStep === 'registration' && !isEmbedRegistration && (
        <Card>
          <CardHeader className="p-4 pb-3 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="h-5 w-5 text-primary" /> Konfiguracja formularza rejestracji
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="text-sm text-muted-foreground">
              Wybierz, które pola będą widoczne w formularzu rejestracji dla uczestników.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { key: 'collectPhone' as const, label: 'Telefon kontaktowy' },
                { key: 'collectClub' as const, label: 'Klub / organizacja' },
                { key: 'collectBirthDate' as const, label: 'Data urodzenia' },
                { key: 'collectTeam' as const, label: 'Zapis drużynowy' },
                { key: 'collectInsurance' as const, label: 'Ubezpieczenie NNW' },
                { key: 'collectMerchandise' as const, label: 'Gadżety / merchandise' },
              ].map((field) => (
                <div
                  key={field.key}
                  className="flex cursor-pointer items-start gap-2 rounded-md p-2 hover:bg-muted/50"
                >
                  <Checkbox
                    id={field.key}
                    checked={form.formConfig[field.key]}
                    onCheckedChange={(checked) =>
                      form.setFormConfig({ ...form.formConfig, [field.key]: !!checked })
                    }
                  />
                  <Label htmlFor={field.key} className="cursor-pointer text-sm leading-5">
                    {field.label}
                  </Label>
                  <FieldHelp
                    description={
                      {
                        collectPhone:
                          'Włącza pole telefonu kontaktowego w formularzu zapisu uczestnika.',
                        collectClub: 'Włącza pole klubu, drużyny lub organizacji uczestnika.',
                        collectBirthDate:
                          'Włącza pole daty urodzenia potrzebne m.in. do kategorii wiekowych.',
                        collectTeam:
                          'Pozwala uczestnikom podać informacje potrzebne do zapisu drużynowego.',
                        collectInsurance:
                          'Pokazuje uczestnikowi opcje związane z ubezpieczeniem NNW, jeśli są skonfigurowane.',
                        collectMerchandise:
                          'Pokazuje uczestnikowi gadżety lub merchandise dostępne przy rejestracji.',
                      }[field.key]
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Display Options */}
      {activeSubStep === 'registration' && !isEmbedRegistration && (
        <Card>
          <CardHeader className="p-4 pb-3 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Monitor className="h-5 w-5 text-primary" /> Opcje wyświetlania listy uczestników
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="space-y-2">
              <HelpLabel description="Ustala domyślny porządek publicznej listy uczestników wydarzenia. Użytkownik zobaczy listę według tej preferencji.">
                Domyślne sortowanie
              </HelpLabel>
              <Select
                value={form.displayOptions.defaultSort}
                onValueChange={(v) =>
                  form.setDisplayOptions({
                    ...form.displayOptions,
                    defaultSort: v as 'name' | 'bib' | 'date' | 'distance',
                  })
                }
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Po imieniu</SelectItem>
                  <SelectItem value="bib">Po numerze startowym</SelectItem>
                  <SelectItem value="date">Po dacie zapisu</SelectItem>
                  <SelectItem value="distance">Po dystansie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex cursor-pointer items-start gap-2">
              <Checkbox
                id="uppercaseNames"
                checked={form.displayOptions.uppercaseNames}
                onCheckedChange={(checked) =>
                  form.setDisplayOptions({ ...form.displayOptions, uppercaseNames: !!checked })
                }
              />
              <Label htmlFor="uppercaseNames" className="cursor-pointer text-sm leading-5">
                Wymuś wielkie litery w nazwiskach (np. Jan KOWALSKI)
              </Label>
              <FieldHelp description="Formatuje nazwiska na liście uczestników wielkimi literami, aby ułatwić skanowanie list startowych." />
            </div>
            <div className="space-y-2">
              <HelpLabel description="Decyduje, którzy zawodnicy są widoczni na publicznej liście startowej. W panelu organizatora zawsze widoczni są wszyscy.">
                Publiczna lista startowa – kto jest widoczny
              </HelpLabel>
              <Select
                value={form.displayOptions.showParticipants ?? 'paid_only'}
                onValueChange={(v) =>
                  form.setDisplayOptions({
                    ...form.displayOptions,
                    showParticipants: v as 'all' | 'paid_only',
                  })
                }
              >
                <SelectTrigger className="w-full sm:w-72">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid_only">Tylko opłaceni zawodnicy</SelectItem>
                  <SelectItem value="all">Wszyscy zapisani (też nieopłaceni)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex cursor-pointer items-start gap-2">
              <Checkbox
                id="showFreeSlots"
                checked={form.displayOptions.showFreeSlots ?? true}
                onCheckedChange={(checked) =>
                  form.setDisplayOptions({ ...form.displayOptions, showFreeSlots: !!checked })
                }
              />
              <Label htmlFor="showFreeSlots" className="cursor-pointer text-sm leading-5">
                Pokazuj licznik wolnych miejsc na stronie wydarzenia
              </Label>
              <FieldHelp description="Domyślnie widoczny jako narzędzie sprzedażowe ('zostało 30 miejsc'). Wyłącz, jeśli słaba frekwencja byłaby niekorzystnym sygnałem." />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── organizer: Organizator i sponsorzy ── */}
      {activeSubStep === 'organizer' && <EventFormOrganizerSection form={form} />}
    </div>
  );
};
