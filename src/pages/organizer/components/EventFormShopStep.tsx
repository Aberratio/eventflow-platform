import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-time-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { uploadEventImage, uploadEventDocument } from '@/api';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Upload,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Tag,
  FileText,
  Package,
  Hash,
} from 'lucide-react';
import type { EventFormState, GadgetFormData } from '../hooks/useEventFormState';
import type { MerchandiseColor, GadgetDocument, GadgetQuantityMode, GadgetImage } from '@/types';

interface EventFormShopStepProps {
  form: EventFormState;
}

const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const PRESET_COLORS: MerchandiseColor[] = [
  { id: 'black', name: 'Czarny', hex: '#000000' },
  { id: 'white', name: 'Biały', hex: '#FFFFFF' },
  { id: 'navy', name: 'Granatowy', hex: '#1E3A5F' },
  { id: 'red', name: 'Czerwony', hex: '#DC2626' },
  { id: 'green', name: 'Zielony', hex: '#16A34A' },
  { id: 'yellow', name: 'Żółty', hex: '#EAB308' },
  { id: 'gray', name: 'Szary', hex: '#6B7280' },
  { id: 'blue', name: 'Niebieski', hex: '#2563EB' },
];

const QUANTITY_MODES: { value: GadgetQuantityMode; label: string; description: string }[] = [
  {
    value: 'any',
    label: 'Dowolna ilość',
    description: 'Uczestnik może zamówić ile chce sztuk',
  },
  {
    value: 'max',
    label: 'Maksymalna ilość',
    description: 'Uczestnik może zamówić maksymalnie N sztuk',
  },
  {
    value: 'one',
    label: 'Tylko jedna sztuka',
    description: 'Uczestnik może zamówić dokładnie jedną sztukę',
  },
];

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="flex items-center gap-1 text-xs text-destructive">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  ) : null;

const ImageUploadButton = ({ onUploaded }: { onUploaded: (url: string) => void }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const res = await uploadEventImage(file);
      if (res.data?.url) onUploaded(res.data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się wgrać zdjęcia.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        className="border-white/10 bg-white/[0.025] hover:bg-white/[0.06]"
      >
        {uploading ? (
          <span className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Upload className="mr-1.5 h-3.5 w-3.5" />
        )}
        Wgraj zdjęcie
      </Button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </>
  );
};

const DocumentUploadButton = ({
  onUploaded,
}: {
  onUploaded: (doc: Omit<GadgetDocument, 'id'>) => void;
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const res = await uploadEventDocument(file);
      if (res.data?.url) {
        onUploaded({
          name: file.name.replace(/\.[^.]+$/, ''),
          fileUrl: res.data.url,
          fileName: res.data.originalName || file.name,
          mimeType: res.data.mimeType || file.type,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się wgrać pliku.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        className="gap-1.5 text-xs"
      >
        {uploading ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        Wgraj plik
      </Button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </>
  );
};

const GadgetCard = ({
  gadget,
  index,
  distances,
  onUpdate,
  onRemove,
  showValidation,
  minDate,
  maxDate,
}: {
  gadget: GadgetFormData;
  index: number;
  distances: { id: string; name: string }[];
  onUpdate: (patch: Partial<GadgetFormData>) => void;
  onRemove: () => void;
  showValidation: boolean;
  minDate: string;
  maxDate: string;
}) => {
  const [expanded, setExpanded] = useState(true);
  const [customSize, setCustomSize] = useState('');
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#000000');

  const nameError = showValidation && !gadget.name.trim() ? 'Podaj nazwę gadżetu' : undefined;
  const priceError =
    showValidation && (!gadget.price || isNaN(Number(gadget.price))) ? 'Podaj cenę' : undefined;
  const quantityMaxError =
    showValidation &&
    gadget.quantityMode === 'max' &&
    (!gadget.quantityMax || isNaN(Number(gadget.quantityMax)) || Number(gadget.quantityMax) < 1)
      ? 'Podaj maksymalną ilość'
      : undefined;

  const toggleSize = (size: string) => {
    const next = gadget.sizes.includes(size)
      ? gadget.sizes.filter((s) => s !== size)
      : [...gadget.sizes, size];
    onUpdate({ sizes: next });
  };

  const addCustomSize = () => {
    const s = customSize.trim().toUpperCase();
    if (s && !gadget.sizes.includes(s)) {
      onUpdate({ sizes: [...gadget.sizes, s] });
    }
    setCustomSize('');
  };

  const removeSize = (size: string) => onUpdate({ sizes: gadget.sizes.filter((s) => s !== size) });

  const togglePresetColor = (color: MerchandiseColor) => {
    const exists = gadget.colors.some((c) => c.id === color.id);
    const next = exists
      ? gadget.colors.filter((c) => c.id !== color.id)
      : [...gadget.colors, color];
    onUpdate({ colors: next });
  };

  const addCustomColor = () => {
    const name = customColorName.trim();
    if (!name) return;
    onUpdate({
      colors: [...gadget.colors, { id: `custom-${Date.now()}`, name, hex: customColorHex }],
    });
    setCustomColorName('');
    setCustomColorHex('#000000');
  };

  const removeColor = (id: string) =>
    onUpdate({ colors: gadget.colors.filter((c) => c.id !== id) });

  const toggleDistance = (distId: string) => {
    const next = gadget.distanceIds.includes(distId)
      ? gadget.distanceIds.filter((d) => d !== distId)
      : [...gadget.distanceIds, distId];
    onUpdate({ distanceIds: next });
  };

  const setMainImage = (imgId: string) => {
    const img = gadget.images.find((i) => i.id === imgId);
    if (img)
      onUpdate({
        imageUrl: img.url,
        images: [img, ...gadget.images.filter((i) => i.id !== imgId)],
      });
  };

  const addExtraImage = (url: string) => {
    const newImg: GadgetImage = { id: `img-${Date.now()}`, url };
    if (!gadget.imageUrl) {
      onUpdate({ imageUrl: url, images: [newImg] });
    } else {
      onUpdate({ images: [...gadget.images, newImg] });
    }
  };

  const removeImage = (imgId: string) => {
    const newImages = gadget.images.filter((i) => i.id !== imgId);
    const removed = gadget.images.find((i) => i.id === imgId);
    onUpdate({
      images: newImages,
      imageUrl: gadget.imageUrl === removed?.url ? newImages[0]?.url || '' : gadget.imageUrl,
    });
  };

  const updateImageField = (imgId: string, patch: Partial<GadgetImage>) =>
    onUpdate({ images: gadget.images.map((i) => (i.id === imgId ? { ...i, ...patch } : i)) });

  const addDocument = (doc: Omit<GadgetDocument, 'id'>) =>
    onUpdate({ documents: [...gadget.documents, { ...doc, id: `doc-${Date.now()}` }] });

  const removeDocument = (id: string) =>
    onUpdate({ documents: gadget.documents.filter((d) => d.id !== id) });

  const updateDocumentName = (id: string, name: string) =>
    onUpdate({ documents: gadget.documents.map((d) => (d.id === id ? { ...d, name } : d)) });

  return (
    <Card className="overflow-hidden border-white/10 bg-white/[0.025]">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-xs font-bold text-foreground/60">
          {index + 1}
        </div>
        <span className="min-w-0 flex-1 truncate font-medium">
          {gadget.name || <span className="text-foreground/40">Nowy gadżet</span>}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-foreground/50 hover:text-foreground"
          onClick={() => setExpanded((p) => !p)}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        <Button
          aria-label="Usuń"
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-destructive/60 hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {expanded && (
        <CardContent className="space-y-6 p-4 sm:p-5">
          {/* Basic info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`gadget-name-${gadget.id}`}>Nazwa gadżetu *</Label>
              <Input
                id={`gadget-name-${gadget.id}`}
                value={gadget.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder="np. Koszulka biegowa"
                className={nameError ? 'border-destructive' : ''}
              />
              <FieldError message={nameError} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`gadget-brand-${gadget.id}`}>Marka / producent</Label>
              <Input
                id={`gadget-brand-${gadget.id}`}
                value={gadget.brand}
                onChange={(e) => onUpdate({ brand: e.target.value })}
                placeholder="np. Asics, własna produkcja"
              />
            </div>
          </div>

          {/* Description rich text */}
          <div className="space-y-1.5">
            <Label>Opis gadżetu</Label>
            <RichTextEditor
              value={gadget.descriptionHtml}
              onChange={(v) => onUpdate({ descriptionHtml: v })}
              placeholder="Opisz gadżet: materiał, skład, przeznaczenie, tabela rozmiarów..."
              minHeight="120px"
              ariaLabel="Opis gadżetu"
            />
          </div>

          {/* Documents */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Pliki do pobrania
            </Label>
            <p className="text-xs text-muted-foreground">
              Np. tabela rozmiarów w PDF, regulamin, specyfikacja produktu.
            </p>
            {gadget.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.02] p-2"
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <Input
                    value={doc.name}
                    onChange={(e) => updateDocumentName(doc.id, e.target.value)}
                    placeholder="Nazwa pliku"
                    className="h-7 text-xs"
                  />
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {doc.fileName}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-destructive/60 hover:text-destructive"
                  onClick={() => removeDocument(doc.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <DocumentUploadButton onUploaded={addDocument} />
          </div>

          {/* Pricing */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor={`gadget-price-${gadget.id}`}>Cena (PLN) *</Label>
              <Input
                id={`gadget-price-${gadget.id}`}
                type="number"
                min="0"
                step="0.01"
                value={gadget.price}
                onChange={(e) => onUpdate({ price: e.target.value })}
                placeholder="0.00"
                className={priceError ? 'border-destructive' : ''}
              />
              <FieldError message={priceError} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`gadget-orig-price-${gadget.id}`}>Cena przed obniżką</Label>
              <Input
                id={`gadget-orig-price-${gadget.id}`}
                type="number"
                min="0"
                step="0.01"
                value={gadget.originalPrice}
                onChange={(e) => onUpdate({ originalPrice: e.target.value })}
                placeholder="opcjonalnie"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`gadget-stock-${gadget.id}`}>Stan magazynowy</Label>
              <Input
                id={`gadget-stock-${gadget.id}`}
                type="number"
                min="0"
                step="1"
                value={gadget.stockCount}
                onChange={(e) => onUpdate({ stockCount: e.target.value })}
                placeholder="brak limitu"
              />
            </div>
          </div>

          {/* Quantity mode */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5" />
              Ile sztuk może zamówić uczestnik?
            </Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {QUANTITY_MODES.map((mode) => {
                const active = gadget.quantityMode === mode.value;
                return (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() =>
                      onUpdate({
                        quantityMode: mode.value,
                        quantityMax: mode.value !== 'max' ? '' : gadget.quantityMax,
                      })
                    }
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      active
                        ? 'border-primary bg-primary/10'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <p className={`text-sm font-medium ${active ? 'text-primary' : ''}`}>
                      {mode.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{mode.description}</p>
                  </button>
                );
              })}
            </div>
            {gadget.quantityMode === 'max' && (
              <div className="flex items-center gap-2">
                <Label
                  htmlFor={`gadget-qty-max-${gadget.id}`}
                  className="shrink-0 text-sm text-muted-foreground"
                >
                  Maksimum:
                </Label>
                <Input
                  id={`gadget-qty-max-${gadget.id}`}
                  type="number"
                  min="1"
                  step="1"
                  value={gadget.quantityMax}
                  onChange={(e) => onUpdate({ quantityMax: e.target.value })}
                  placeholder="np. 3"
                  className={`w-28 ${quantityMaxError ? 'border-destructive' : ''}`}
                />
                <span className="text-sm text-muted-foreground">sztuk</span>
                <FieldError message={quantityMaxError} />
              </div>
            )}
          </div>

          {/* Availability */}
          <div className="flex items-center gap-3">
            <Switch
              id={`gadget-avail-${gadget.id}`}
              checked={gadget.available}
              onCheckedChange={(v) => onUpdate({ available: v })}
            />
            <Label htmlFor={`gadget-avail-${gadget.id}`} className="cursor-pointer">
              Dostępny do zamówienia
            </Label>
          </div>

          {/* Sale dates */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">Okres sprzedaży</Label>
            <p className="text-xs text-muted-foreground">
              Zostaw puste, żeby gadżet był dostępny przez cały czas trwania zapisów.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label
                  htmlFor={`gadget-sale-from-${gadget.id}`}
                  className="text-xs text-muted-foreground"
                >
                  Dostępny od
                </Label>
                <DateInput
                  id={`gadget-sale-from-${gadget.id}`}
                  value={gadget.saleFrom}
                  min={minDate || undefined}
                  max={gadget.saleTo || maxDate || undefined}
                  onValueChange={(saleFrom) => onUpdate({ saleFrom })}
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor={`gadget-sale-to-${gadget.id}`}
                  className="text-xs text-muted-foreground"
                >
                  Dostępny do
                </Label>
                <DateInput
                  id={`gadget-sale-to-${gadget.id}`}
                  value={gadget.saleTo}
                  min={gadget.saleFrom || minDate || undefined}
                  max={maxDate || undefined}
                  onValueChange={(saleTo) => onUpdate({ saleTo })}
                />
              </div>
            </div>
            {(gadget.saleFrom || gadget.saleTo) && (
              <button
                type="button"
                onClick={() => onUpdate({ saleFrom: '', saleTo: '' })}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Wyczyść daty
              </button>
            )}
          </div>

          {/* Sizes */}
          <div className="space-y-2">
            <Label>Dostępne rozmiary</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_SIZES.map((size) => {
                const active = gadget.sizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`rounded-md border px-3 py-1 text-sm font-medium transition-colors ${
                      active
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-white/10 bg-white/[0.025] text-foreground/60 hover:border-white/20 hover:text-foreground'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            {gadget.sizes.filter((s) => !PRESET_SIZES.includes(s)).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {gadget.sizes
                  .filter((s) => !PRESET_SIZES.includes(s))
                  .map((s) => (
                    <Badge key={s} variant="secondary" className="gap-1">
                      {s}
                      <button type="button" onClick={() => removeSize(s)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                placeholder="Własny rozmiar (np. 42)"
                className="max-w-[180px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomSize();
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addCustomSize}>
                Dodaj
              </Button>
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-2">
            <Label>Dostępne kolory</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => {
                const active = gadget.colors.some((c) => c.id === color.id);
                return (
                  <button
                    key={color.id}
                    type="button"
                    title={color.name}
                    onClick={() => togglePresetColor(color)}
                    className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-white/10 bg-white/[0.025] text-foreground/60 hover:border-white/20 hover:text-foreground'
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-white/20"
                      style={{ backgroundColor: color.hex }}
                    />
                    {color.name}
                  </button>
                );
              })}
            </div>
            {gadget.colors.filter((c) => !PRESET_COLORS.some((p) => p.id === c.id)).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {gadget.colors
                  .filter((c) => !PRESET_COLORS.some((p) => p.id === c.id))
                  .map((c) => (
                    <Badge key={c.id} variant="secondary" className="gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-white/20"
                        style={{ backgroundColor: c.hex }}
                      />
                      {c.name}
                      <button type="button" onClick={() => removeColor(c.id)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
              </div>
            )}
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Własny kolor</p>
                <div className="flex gap-2">
                  <Input
                    value={customColorName}
                    onChange={(e) => setCustomColorName(e.target.value)}
                    placeholder="Nazwa koloru"
                    className="w-32"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomColor();
                      }
                    }}
                  />
                  <input
                    type="color"
                    value={customColorHex}
                    onChange={(e) => setCustomColorHex(e.target.value)}
                    className="h-9 w-10 cursor-pointer rounded border border-white/10 bg-transparent p-0.5"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addCustomColor}>
                    Dodaj
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-3">
            <Label>Zdjęcia gadżetu</Label>
            {gadget.images.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Pierwsze wgrane zdjęcie stanie się głównym.
              </p>
            ) : (
              <div className="space-y-3">
                {gadget.images.map((img) => {
                  const isMain = gadget.imageUrl === img.url;
                  return (
                    <div
                      key={img.id}
                      className={`flex gap-3 rounded-lg border p-3 ${
                        isMain
                          ? 'border-primary/40 bg-primary/[0.06]'
                          : 'border-white/10 bg-white/[0.02]'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="group relative h-20 w-20 shrink-0">
                        <img
                          src={img.url}
                          alt={img.caption || ''}
                          className="h-20 w-20 rounded-md border border-white/10 object-cover"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-md bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                          {!isMain && (
                            <button
                              type="button"
                              onClick={() => setMainImage(img.id)}
                              className="rounded bg-primary/80 px-1.5 py-0.5 text-[10px] font-medium text-white hover:bg-primary"
                            >
                              Główne
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(img.id)}
                            className="rounded bg-destructive/80 p-1 text-white hover:bg-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        {isMain && (
                          <span className="absolute -right-1.5 -top-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white">
                            Główne
                          </span>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Opis / podpis</Label>
                          <Input
                            value={img.caption || ''}
                            onChange={(e) => updateImageField(img.id, { caption: e.target.value })}
                            placeholder="np. Kolor granatowy, tył koszulki..."
                            className="h-8 text-sm"
                          />
                        </div>
                        {gadget.colors.length > 0 && (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">
                              Kolor na zdjęciu
                            </Label>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => updateImageField(img.id, { colorId: undefined })}
                                className={`rounded border px-2 py-0.5 text-xs transition-colors ${
                                  !img.colorId
                                    ? 'border-primary bg-primary/15 text-primary'
                                    : 'border-white/10 text-muted-foreground hover:border-white/25'
                                }`}
                              >
                                Brak
                              </button>
                              {gadget.colors.map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => updateImageField(img.id, { colorId: c.id })}
                                  className={`flex items-center gap-1 rounded border px-2 py-0.5 text-xs transition-colors ${
                                    img.colorId === c.id
                                      ? 'border-primary bg-primary/15 text-primary'
                                      : 'border-white/10 text-muted-foreground hover:border-white/25'
                                  }`}
                                >
                                  <span
                                    className="h-2.5 w-2.5 rounded-full border border-white/20"
                                    style={{ backgroundColor: c.hex }}
                                  />
                                  {c.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <ImageUploadButton onUploaded={addExtraImage} />
          </div>

          {/* Distance linking */}
          {distances.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Dostępny dla dystansów
              </Label>
              <p className="text-xs text-muted-foreground">
                Pozostaw wszystkie odznaczone, aby gadżet był dostępny dla każdego uczestnika.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {distances.map((dist) => (
                  <label
                    key={dist.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 hover:bg-white/[0.04]"
                  >
                    <Checkbox
                      checked={gadget.distanceIds.includes(dist.id)}
                      onCheckedChange={() => toggleDistance(dist.id)}
                    />
                    <span className="text-sm">{dist.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export const EventFormShopStep = ({ form }: EventFormShopStepProps) => {
  const showValidation = form.shownValidationSubSteps.includes('gadgets');

  const distanceOptions = form.distances.map((d) => ({
    id: d.id,
    name: d.noName ? `${d.length} ${d.unit}` : d.name || `${d.length} ${d.unit}`,
  }));

  const today = new Date().toISOString().slice(0, 10);
  const minDate =
    form.registrationOpenDate && form.registrationOpenDate > today
      ? form.registrationOpenDate
      : today;
  const maxDate = form.registrationDeadline || '';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="p-4 pb-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <ShoppingBag className="h-5 w-5 shrink-0" />
            Gadżety do kupienia
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Dodaj gadżety, które uczestnicy będą mogli dokupić podczas rejestracji lub wystawić
            później w sklepie.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          {form.gadgets.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.015] py-10 text-center">
              <Package className="mx-auto mb-3 h-8 w-8 text-foreground/25" />
              <p className="text-sm font-medium text-foreground/60">Brak gadżetów</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Dodaj gadżety, które chcesz zaoferować uczestnikom.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {form.gadgets.map((gadget, index) => (
                <GadgetCard
                  key={gadget.id}
                  gadget={gadget}
                  index={index}
                  distances={distanceOptions}
                  onUpdate={(patch) => {
                    form.updateGadget(gadget.id, patch);
                    form.setHasUnsavedChanges(true);
                  }}
                  onRemove={() => {
                    form.removeGadget(gadget.id);
                    form.setHasUnsavedChanges(true);
                  }}
                  showValidation={showValidation}
                  minDate={minDate}
                  maxDate={maxDate}
                />
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full border-white/10 bg-white/[0.025] hover:bg-white/[0.06]"
            onClick={() => {
              form.addGadget();
              form.setHasUnsavedChanges(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Dodaj gadżet
          </Button>
        </CardContent>
      </Card>

      {form.gadgets.length > 0 && (
        <Card className="border-white/10 bg-white/[0.025]">
          <CardContent className="flex items-start gap-3 p-4">
            <ShoppingBag className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {form.gadgets.length}{' '}
                {form.gadgets.length === 1
                  ? 'gadżet'
                  : form.gadgets.length < 5
                    ? 'gadżety'
                    : 'gadżetów'}
              </span>{' '}
              zostanie zapisanych. Gadżety można później wystawić w sklepie z panelu admina.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
