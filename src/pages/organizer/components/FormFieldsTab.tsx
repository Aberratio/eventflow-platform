import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ClipboardList, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  createFormField,
  deleteFormField,
  getFormFields,
  reorderFormFields,
  updateFormField,
} from '@/api';
import {
  FORM_FIELD_STATE_LABELS,
  FORM_FIELD_TYPE_LABELS,
  allowedSystemStates,
  formFieldLabel,
  moveFieldId,
} from '@/lib/formFields';
import type {
  CreateFormFieldPayload,
  FormField,
  FormFieldState,
  FormFieldType,
  UpdateFormFieldPayload,
} from '@/types';

const STATES: FormFieldState[] = ['hidden', 'shown', 'required'];
const CHOICE_TYPES: FormFieldType[] = ['single_choice', 'multi_choice'];
const TEXT_TYPES: FormFieldType[] = ['short_text', 'long_text'];

const errorText = (error: unknown): string =>
  error instanceof Error ? error.message : 'Nie udało się zapisać zmiany.';

interface FormFieldsTabProps {
  eventId: string;
}

/**
 * E1.13 (ticket 10): the organizer's configuration of the registration form — the 13 system
 * positions (Nie / Pokaż / Wymagany, within what the server allows for each) and the custom
 * fields, in one ordered list. The server is authoritative: every rule we mirror here only
 * saves a round trip, a 422 text is always shown next to the field it came from.
 */
export const FormFieldsTab = ({ eventId }: FormFieldsTabProps) => {
  const queryClient = useQueryClient();
  const queryKey = ['form-fields', 'manage', eventId];
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<FormField | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<FormField | null>(null);

  const { data: fields = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => getFormFields(eventId),
    select: (r) => r.data ?? [],
  });

  const refreshPublic = () =>
    queryClient.invalidateQueries({ queryKey: ['form-fields', 'public', eventId] });
  const replaceField = (saved: FormField) => {
    queryClient.setQueryData(queryKey, (old: { data?: FormField[] } | undefined) =>
      old ? { ...old, data: (old.data ?? []).map((f) => (f.id === saved.id ? saved : f)) } : old,
    );
    void refreshPublic();
  };

  const update = async (field: FormField, patch: UpdateFormFieldPayload) => {
    setRowErrors((prev) => ({ ...prev, [field.id]: '' }));
    try {
      const response = await updateFormField(eventId, field.id, patch);
      replaceField(response.data);
      return true;
    } catch (error) {
      setRowErrors((prev) => ({ ...prev, [field.id]: errorText(error) }));
      return false;
    }
  };

  const reorder = useMutation({
    mutationFn: (orderedIds: string[]) => reorderFormFields(eventId, orderedIds),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKey, { success: true, data: response.data });
      void refreshPublic();
    },
    onError: (error) => toast.error(errorText(error)),
  });

  const remove = useMutation({
    mutationFn: (field: FormField) => deleteFormField(eventId, field.id),
    onSuccess: () => {
      setDeleting(null);
      void queryClient.invalidateQueries({ queryKey });
      void refreshPublic();
      toast.success('Pole zostało usunięte.');
    },
    onError: (error) => toast.error(errorText(error)),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-primary" />
            Formularz zapisów
          </CardTitle>
          <CardDescription>
            Ustaw, które dane zbierasz od zawodników, i dodaj własne pytania. Kolejność z tej listy
            obowiązuje w formularzu zapisu i na liście startowej.
          </CardDescription>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" /> Dodaj pole
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground">Ładowanie...</p>}
        {fields.map((field, index) => {
          const allowed = field.kind === 'system' ? allowedSystemStates(field.fieldKey) : STATES;
          const locked = field.kind === 'system' && allowed.length === 1;
          return (
            <div
              key={field.id}
              data-testid={`form-field-row-${field.fieldKey}`}
              className="space-y-2 rounded-lg border p-3"
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    aria-label={`Przesuń w górę: ${formFieldLabel(field)}`}
                    disabled={index === 0 || reorder.isPending}
                    onClick={() => {
                      const ids = moveFieldId(fields, field.id, -1);
                      if (ids) reorder.mutate(ids);
                    }}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    aria-label={`Przesuń w dół: ${formFieldLabel(field)}`}
                    disabled={index === fields.length - 1 || reorder.isPending}
                    onClick={() => {
                      const ids = moveFieldId(fields, field.id, 1);
                      if (ids) reorder.mutate(ids);
                    }}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>

                <div className="min-w-[10rem] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{formFieldLabel(field)}</span>
                    {field.kind === 'system' ? (
                      <Badge variant="secondary">Systemowe</Badge>
                    ) : (
                      <Badge variant="outline">
                        {field.fieldType ? FORM_FIELD_TYPE_LABELS[field.fieldType] : 'Własne'}
                      </Badge>
                    )}
                    {field.isConfidential && (
                      <Badge variant="destructive" className="gap-1">
                        <Lock className="h-3 w-3" /> Poufne
                      </Badge>
                    )}
                  </div>
                  {field.tooltipOverride && (
                    <p className="text-xs text-muted-foreground">{field.tooltipOverride}</p>
                  )}
                </div>

                <div
                  role="group"
                  aria-label={`Stan pola: ${formFieldLabel(field)}`}
                  className="inline-flex rounded-md border"
                >
                  {STATES.map((state) => {
                    const selectable = allowed.includes(state);
                    return (
                      <Button
                        key={state}
                        type="button"
                        size="sm"
                        variant={field.state === state ? 'default' : 'ghost'}
                        className="rounded-none first:rounded-l-md last:rounded-r-md"
                        aria-pressed={field.state === state}
                        disabled={!selectable || locked}
                        title={
                          !selectable ? 'Ten stan jest niedostępny dla tej pozycji.' : undefined
                        }
                        onClick={() => {
                          if (field.state !== state) void update(field, { state });
                        }}
                      >
                        {FORM_FIELD_STATE_LABELS[state]}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edytuj: ${formFieldLabel(field)}`}
                  onClick={() => setEditing(field)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                {field.kind === 'custom' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Usuń: ${formFieldLabel(field)}`}
                    onClick={() => setDeleting(field)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              {field.kind === 'custom' && field.options && field.options.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Warianty:{' '}
                  {field.options
                    .map(
                      (o) =>
                        `${o.label}${o.price ? ` (${o.price > 0 ? '+' : ''}${o.price} zł)` : ''}`,
                    )
                    .join(', ')}
                </p>
              )}
              {rowErrors[field.id] && (
                <p role="alert" className="text-sm text-destructive">
                  {rowErrors[field.id]}
                </p>
              )}
            </div>
          );
        })}
      </CardContent>

      {creating && (
        <CreateFieldDialog
          eventId={eventId}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            void queryClient.invalidateQueries({ queryKey });
            void refreshPublic();
          }}
        />
      )}
      {editing && (
        <EditFieldDialog
          field={editing}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            const ok = await update(editing, patch);
            if (ok) setEditing(null);
            return ok;
          }}
          error={rowErrors[editing.id]}
        />
      )}
      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usunąć pole?</DialogTitle>
            <DialogDescription>
              Pole „{deleting ? formFieldLabel(deleting) : ''}" zniknie z formularza razem z
              zebranymi odpowiedziami. Tej operacji nie można cofnąć.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Anuluj
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => deleting && remove.mutate(deleting)}
            >
              Usuń pole
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// ─── Create ──────────────────────────────────────────────────────────────

interface DraftOption {
  label: string;
  price: string;
}

const CreateFieldDialog = ({
  eventId,
  onClose,
  onCreated,
}: {
  eventId: string;
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

  const usesOptions = CHOICE_TYPES.includes(fieldType);

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
        price: o.price.trim() === '' ? 0 : Number(o.price.replace(',', '.')),
      }));
    }
    if (TEXT_TYPES.includes(fieldType) && Number(maxLength) > 0) {
      payload.validationConfig = { maxLength: Number(maxLength) };
    }
    setSaving(true);
    try {
      await createFormField(eventId, payload);
      onCreated();
    } catch (e) {
      setError(errorText(e));
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
            Typ pola, warianty i poufność ustalasz teraz; później możesz zmienić etykietę,
            podpowiedź i widoczność.
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
          {TEXT_TYPES.includes(fieldType) && (
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
          {usesOptions && (
            <div className="space-y-2">
              <Label>Warianty</Label>
              <p className="text-xs text-muted-foreground">
                Cena wariantu jest opcjonalna i może być ujemna (np. -5 przy rezygnacji z
                losowania).
              </p>
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    aria-label={`Wariant ${index + 1}`}
                    placeholder="Nazwa wariantu"
                    value={option.label}
                    onChange={(e) =>
                      setOptions((prev) =>
                        prev.map((o, i) => (i === index ? { ...o, label: e.target.value } : o)),
                      )
                    }
                  />
                  <Input
                    aria-label={`Cena wariantu ${index + 1}`}
                    placeholder="Cena, zł"
                    type="number"
                    step="0.01"
                    className="w-32"
                    value={option.price}
                    onChange={(e) =>
                      setOptions((prev) =>
                        prev.map((o, i) => (i === index ? { ...o, price: e.target.value } : o)),
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Usuń wariant ${index + 1}`}
                    disabled={options.length === 1}
                    onClick={() => setOptions((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOptions((prev) => [...prev, { label: '', price: '' }])}
              >
                <Plus className="mr-2 h-4 w-4" /> Dodaj wariant
              </Button>
            </div>
          )}
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

// ─── Edit ────────────────────────────────────────────────────────────────

const EditFieldDialog = ({
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
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave({
      label: label.trim() || null,
      tooltip: tooltip.trim() || null,
      publicListVisible: publicList,
      ...(field.kind === 'custom' ? { visibleToBz: bz } : {}),
    });
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
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
