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
import {
  CHOICE_FIELD_TYPES,
  FORM_FIELD_TYPE_LABELS,
  formFieldLabel,
  toDraftOptions,
  toPayloadOptions,
  type DraftOption,
} from '@/lib/formFields';
import type { FormField, FormFieldType, UpdateFormFieldPayload } from '@/types';
import { OptionsEditor } from './OptionsEditor';

export const EditFieldDialog = ({
  field,
  onClose,
  onSave,
  error,
}: {
  field: FormField;
  onClose: () => void;
  onSave: (patch: UpdateFormFieldPayload) => Promise<boolean>;
  error?: string;
}) => {
  const [label, setLabel] = useState(field.labelOverride ?? '');
  const [tooltip, setTooltip] = useState(field.tooltipOverride ?? '');
  const [publicList, setPublicList] = useState(field.publicListVisible);
  const [bz, setBz] = useState(field.visibleToBz);
  const [fieldType, setFieldType] = useState<FormFieldType | null>(field.fieldType);
  const [options, setOptions] = useState<DraftOption[]>(() => toDraftOptions(field));
  const [saving, setSaving] = useState(false);

  const isCustom = field.kind === 'custom' && field.fieldType !== null;
  const usesOptions = fieldType !== null && CHOICE_FIELD_TYPES.includes(fieldType);

  const save = async () => {
    setSaving(true);
    const definition: UpdateFormFieldPayload = {};
    if (isCustom && fieldType !== null) {
      // Type / variants edited in place — only what changed, variants keep their keys.
      if (fieldType !== field.fieldType) definition.fieldType = fieldType;
      if (usesOptions) definition.options = toPayloadOptions(options);
    }
    await onSave({
      label: label.trim() || null,
      tooltip: tooltip.trim() || null,
      publicListVisible: publicList,
      ...(field.kind === 'custom' ? { visibleToBz: bz } : {}),
      ...definition,
    });
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edytuj: {formFieldLabel(field)}</DialogTitle>
          <DialogDescription>
            Zmiana etykiety nie zmienia klucza pola, więc integracje zewnętrzne działają dalej.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ef-label">Etykieta</Label>
            <Input id="ef-label" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ef-tooltip">Podpowiedź</Label>
            <Input id="ef-tooltip" value={tooltip} onChange={(e) => setTooltip(e.target.value)} />
          </div>
          {isCustom && fieldType !== null && (
            <div className="space-y-2">
              <Label htmlFor="ef-type">Typ pola</Label>
              <Select value={fieldType} onValueChange={(v) => setFieldType(v as FormFieldType)}>
                <SelectTrigger id="ef-type">
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
              <p className="text-xs text-muted-foreground">
                Typ można zmienić, dopóki nikt nie odpowiedział na to pole. Wariantów użytych w
                odpowiedziach nie da się usunąć, ale możesz zmienić ich nazwę i cenę.
              </p>
            </div>
          )}
          {isCustom && usesOptions && <OptionsEditor options={options} setOptions={setOptions} />}
          <div className="flex items-center justify-between">
            <Label htmlFor="ef-public">Widoczne na publicznej liście startowej</Label>
            <Switch
              id="ef-public"
              checked={publicList}
              disabled={field.isConfidential}
              onCheckedChange={setPublicList}
            />
          </div>
          {field.kind === 'custom' && (
            <div className="flex items-center justify-between">
              <Label htmlFor="ef-bz">Widoczne dla Biura Zawodów</Label>
              <Switch
                id="ef-bz"
                checked={bz}
                disabled={field.isConfidential}
                onCheckedChange={setBz}
              />
            </div>
          )}
          {field.isConfidential && (
            <p className="text-xs text-muted-foreground">
              Pole poufne nie może być widoczne publicznie ani dla Biura Zawodów.
            </p>
          )}
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
          <Button onClick={save} disabled={saving}>
            Zapisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
