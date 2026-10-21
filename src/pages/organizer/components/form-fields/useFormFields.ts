import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteFormField,
  getDistanceFormFields,
  getFormFields,
  overrideFormField,
  reorderFormFields,
  resetFormFieldOverride,
  updateFormField,
} from '@/api';
import { apiErrorCode } from '@/api/errors';
import { formFieldErrorText } from '@/lib/formFields';
import type { FormField, UpdateFormFieldPayload } from '@/types';

export const EVENT_SCOPE = '__event__';

/** Data and mutations behind the form-fields tab, for the whole event or one distance. */
export const useFormFields = (eventId: string, onDeleted: () => void) => {
  const queryClient = useQueryClient();
  const [scope, setScope] = useState(EVENT_SCOPE);
  const distanceId = scope === EVENT_SCOPE ? null : scope;
  const queryKey = ['form-fields', 'manage', eventId, scope];
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const { data: fields = [], isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      distanceId ? getDistanceFormFields(eventId, distanceId) : getFormFields(eventId),
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
      setRowErrors((prev) => ({ ...prev, [field.id]: formFieldErrorText(error) }));
      return false;
    }
  };

  const reorder = useMutation({
    mutationFn: (orderedIds: string[]) => reorderFormFields(eventId, orderedIds),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKey, { success: true, data: response.data });
      void refreshPublic();
    },
    onError: (error) => toast.error(formFieldErrorText(error)),
  });

  const override = useMutation({
    mutationFn: (field: FormField) => overrideFormField(eventId, distanceId ?? '', field.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      void refreshPublic();
      toast.success('Pole jest teraz nadpisane na tym dystansie.');
    },
    onError: (error) => toast.error(formFieldErrorText(error)),
  });

  const resetOverride = useMutation({
    mutationFn: (field: FormField) => resetFormFieldOverride(eventId, distanceId ?? '', field.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      void refreshPublic();
      toast.success('Dystans znów dziedziczy to pole z wydarzenia.');
    },
    onError: (error) =>
      toast.error(
        apiErrorCode(error) === 'form_field_has_answers'
          ? 'Nie można przywrócić dziedziczenia, bo zapisy mają już odpowiedzi w tym polu.'
          : formFieldErrorText(error),
      ),
  });

  const remove = useMutation({
    mutationFn: (field: FormField) => deleteFormField(eventId, field.id),
    onSuccess: () => {
      onDeleted();
      void queryClient.invalidateQueries({ queryKey });
      void refreshPublic();
      toast.success('Pole zostało usunięte.');
    },
    onError: (error) => toast.error(formFieldErrorText(error)),
  });

  /** After a field was created: refetch the list and the public form. */
  const refreshAfterCreate = () => {
    void queryClient.invalidateQueries({ queryKey });
    void refreshPublic();
  };

  return {
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
  };
};
