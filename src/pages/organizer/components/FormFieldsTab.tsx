import { useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { moveFieldId } from '@/lib/formFields';
import type { FormField } from '@/types';
import { CreateFieldDialog } from './form-fields/CreateFieldDialog';
import { DeleteFieldDialog } from './form-fields/DeleteFieldDialog';
import { EditFieldDialog } from './form-fields/EditFieldDialog';
import { FormFieldRow } from './form-fields/FormFieldRow';
import { EVENT_SCOPE, useFormFields } from './form-fields/useFormFields';

interface FormFieldsTabProps {
  eventId: string;
  /** When given (and not empty) the form can be configured per distance as well. */
  distances?: Array<{ id: string; name: string }>;
}

/**
 * The organizer's configuration of the registration form — the 13 system
 * positions (Nie / Pokaż / Wymagany, within what the server allows for each) and the custom
 * fields, in one ordered list. The server is authoritative: every rule we mirror here only
 * saves a round trip, a 422 text is always shown next to the field it came from.
 *
 * The scope selector switches between the whole event and one distance. A distance shows
 * the event form as inherited; a position can be overridden there (a copy the organizer edits),
 * reset to inherit again, and distance-only fields can be added.
 */
export const FormFieldsTab = ({ eventId, distances = [] }: FormFieldsTabProps) => {
  const [editing, setEditing] = useState<FormField | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<FormField | null>(null);
  const {
    scope,
    setScope,
    distanceId,
    fields,
    isLoading,
    rowErrors,
    update,
    reorder,
    override,
    resetOverride,
    remove,
    refreshAfterCreate,
  } = useFormFields(eventId, () => setDeleting(null));

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
        {distances.length > 0 && (
          <div className="space-y-1 pb-2">
            <Label htmlFor="ff-scope">Formularz dla</Label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger id="ff-scope" className="max-w-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EVENT_SCOPE}>Całe wydarzenie</SelectItem>
                {distances.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    Dystans: {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {distanceId && (
              <p className="text-xs text-muted-foreground">
                Pola odziedziczone z wydarzenia możesz nadpisać tylko dla tego dystansu albo dodać
                pola widoczne wyłącznie na nim.
              </p>
            )}
          </div>
        )}
        {isLoading && <p className="text-sm text-muted-foreground">Ładowanie...</p>}
        {fields.map((field, index) => (
          <FormFieldRow
            key={field.id}
            field={field}
            index={index}
            count={fields.length}
            distanceId={distanceId}
            error={rowErrors[field.id]}
            reorderPending={reorder.isPending}
            overridePending={override.isPending}
            resetPending={resetOverride.isPending}
            onMove={(direction) => {
              const ids = moveFieldId(fields, field.id, direction);
              if (ids) reorder.mutate(ids);
            }}
            onSetState={(state) => void update(field, { state })}
            onEdit={() => setEditing(field)}
            onOverride={() => override.mutate(field)}
            onResetOverride={() => resetOverride.mutate(field)}
            onDelete={() => setDeleting(field)}
          />
        ))}
      </CardContent>

      {creating && (
        <CreateFieldDialog
          eventId={eventId}
          distanceId={distanceId}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            refreshAfterCreate();
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
      <DeleteFieldDialog
        field={deleting}
        pending={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={(field) => remove.mutate(field)}
      />
    </Card>
  );
};
