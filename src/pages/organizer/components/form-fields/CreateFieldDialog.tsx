import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createDistanceFormField, createFormField } from '@/api';
import {
  CHOICE_FIELD_TYPES,
  FORM_FIELD_TYPE_LABELS,
  TEXT_FIELD_TYPES,
  formFieldErrorText,
  parsePrice,
  type DraftOption,
} from '@/lib/formFields';
import type { CreateFormFieldPayload, FormFieldType } from '@/types';
import { OptionsEditor } from './OptionsEditor';

export const CreateFieldDialog = ({
  eventId,
  distanceId,
  onClose,
  onCreated,
}: {
  eventId: string;
  distanceId: string | null;
  onClose: () => void;
  onCreated: () => void;
}) => {
  const [fieldType, setFieldType] = useState<FormFieldType>('short_text');
  const [label, setLabel] = useState('');
  const [tooltip, setTooltip] = useState('');
  const [required, setRequired] = useState(false);
  const [confidential, setConfidential] = useState(false);
  const [publicList, setPublicList] = useState(false);
  const [maxLength, setMaxLength] = useState('');
  const [options, setOptions] = useState<DraftOption[]>([{ label: '', price: '' }]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const usesOptions = CHOICE_FIELD_TYPES.includes(fieldType);

  const submit = async () => {
    setError('');
    if (!label.trim()) {
      setError('Podaj etykietę pola.');
      return;
    }
    const filledOptions = options.filter((o) => o.label.trim() !== '');
    if (usesOptions && filledOptions.length === 0) {
      setError('Dodaj co najmniej jeden wariant.');
      return;
    }
    const payload: CreateFormFieldPayload = {
      fieldType,
      label: label.trim(),
      tooltip: tooltip.trim() || null,
      state: required ? 'required' : 'shown',
      isConfidential: confidential,
      publicListVisible: confidential ? false : publicList,
    };
    if (usesOptions) {
      payload.options = filledOptions.map((o) => ({
        label: o.label.trim(),
        price: parsePrice(o.price),
      }));
    }
    if (TEXT_FIELD_TYPES.includes(fieldType) && Number(maxLength) > 0) {
      payload.validationConfig = { maxLength: Number(maxLength) };
    }
    setSaving(true);
    try {
      await (distanceId
        ? createDistanceFormField(eventId, distanceId, payload)
        : createFormField(eventId, payload));
      onCreated();
    } catch (e) {
      setError(formFieldErrorText(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nowe pole formularza</DialogTitle>
          <DialogDescription>
            Poufność ustalasz teraz i nie da się jej później zmienić. Typ i warianty możesz poprawić
            w edycji pola (typ tylko dopóki nie ma odpowiedzi).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ff-type">Typ pola</Label>
            <Select value={fieldType} onValueChange={(v) => setFieldType(v as FormFieldType)}>
              <SelectTrigger id="ff-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(FORM_FIELD_TYPE_LABELS) as FormFieldType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {FORM_FIELD_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ff-label">Etykieta</Label>
            <Input id="ff-label" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ff-tooltip">Podpowiedź (opcjonalnie)</Label>
            <Input id="ff-tooltip" value={tooltip} onChange={(e) => setTooltip(e.target.value)} />
          </div>
          {TEXT_FIELD_TYPES.includes(fieldType) && (
            <div className="space-y-2">
              <Label htmlFor="ff-max">Maksymalna długość (opcjonalnie)</Label>
              <Input
                id="ff-max"
                type="number"
                min={1}
                value={maxLength}
                onChange={(e) => setMaxLength(e.target.value)}
              />
            </div>
          )}
          {usesOptions && <OptionsEditor options={options} setOptions={setOptions} />}
          <div className="flex items-center justify-between">
            <Label htmlFor="ff-required">Pole wymagane</Label>
            <Switch id="ff-required" checked={required} onCheckedChange={setRequired} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ff-confidential">Poufne</Label>
              <p className="text-xs text-muted-foreground">
                Nigdy na publicznej liście, w eksporcie ani u Biura Zawodów. Nie da się zmienić po
                utworzeniu.
              </p>
            </div>
            <Switch
              id="ff-confidential"
              checked={confidential}
              onCheckedChange={(checked) => {
                setConfidential(checked);
                if (checked) setPublicList(false);
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="ff-public">Widoczne na publicznej liście startowej</Label>
            <Switch
              id="ff-public"
              checked={publicList}
              disabled={confidential}
              onCheckedChange={setPublicList}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Anuluj
          </Button>
          <Button onClick={submit} disabled={saving}>
            Dodaj pole
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
