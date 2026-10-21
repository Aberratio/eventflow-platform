import { ArrowDown, ArrowUp, Lock, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FORM_FIELD_STATES,
  FORM_FIELD_STATE_LABELS,
  FORM_FIELD_TYPE_LABELS,
  allowedSystemStates,
  formFieldLabel,
} from '@/lib/formFields';
import type { FormField, FormFieldState } from '@/types';

interface FormFieldRowProps {
  field: FormField;
  index: number;
  count: number;
  /** Null for the event-wide form. */
  distanceId: string | null;
  error?: string;
  reorderPending: boolean;
  overridePending: boolean;
  resetPending: boolean;
  onMove: (direction: -1 | 1) => void;
  onSetState: (state: FormFieldState) => void;
  onEdit: () => void;
  onOverride: () => void;
  onResetOverride: () => void;
  onDelete: () => void;
}

export const FormFieldRow = ({
  field,
  index,
  count,
  distanceId,
  error,
  reorderPending,
  overridePending,
  resetPending,
  onMove,
  onSetState,
  onEdit,
  onOverride,
  onResetOverride,
  onDelete,
}: FormFieldRowProps) => {
  const allowed = field.kind === 'system' ? allowedSystemStates(field.fieldKey) : FORM_FIELD_STATES;
  const inherited = distanceId !== null && field.source === 'event';
  const locked = (field.kind === 'system' && allowed.length === 1) || inherited;
  return (
    <div
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
            disabled={distanceId !== null || index === 0 || reorderPending}
            onClick={() => onMove(-1)}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            aria-label={`Przesuń w dół: ${formFieldLabel(field)}`}
            disabled={distanceId !== null || index === count - 1 || reorderPending}
            onClick={() => onMove(1)}
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
            {inherited && <Badge variant="outline">Odziedziczone</Badge>}
            {field.source === 'override' && <Badge>Nadpisane na dystansie</Badge>}
            {field.source === 'distance' && <Badge>Tylko ten dystans</Badge>}
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
          {FORM_FIELD_STATES.map((state) => {
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
                title={!selectable ? 'Ten stan jest niedostępny dla tej pozycji.' : undefined}
                onClick={() => {
                  if (field.state !== state) onSetState(state);
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
          disabled={inherited}
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        {inherited && (
          <Button
            variant="outline"
            size="sm"
            aria-label={`Nadpisz na dystansie: ${formFieldLabel(field)}`}
            disabled={overridePending}
            onClick={onOverride}
          >
            Nadpisz na dystansie
          </Button>
        )}
        {field.source === 'override' && (
          <Button
            variant="outline"
            size="sm"
            aria-label={`Przywróć dziedziczenie: ${formFieldLabel(field)}`}
            disabled={resetPending}
            onClick={onResetOverride}
          >
            <RotateCcw className="mr-1 h-4 w-4" /> Przywróć dziedziczenie
          </Button>
        )}
        {field.kind === 'custom' && (distanceId === null || field.source === 'distance') && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Usuń: ${formFieldLabel(field)}`}
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
      {field.kind === 'custom' && field.options && field.options.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Warianty:{' '}
          {field.options
            .map((o) => `${o.label}${o.price ? ` (${o.price > 0 ? '+' : ''}${o.price} zł)` : ''}`)
            .join(', ')}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};
