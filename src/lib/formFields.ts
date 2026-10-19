import type { FormField, FormFieldAnswerValue, FormFieldState, FormFieldType } from '@/types';

/** Label shown to the Zawodnik: the organizer's override, else the catalogue label. */
export const SYSTEM_FIELD_LABELS: Record<string, string> = {
  first_name: 'Imię',
  last_name: 'Nazwisko',
  contact_email: 'E-mail kontaktowy',
  birth_date: 'Data urodzenia',
  gender: 'Płeć',
  anonymization: 'Anonimizacja',
  country: 'Kraj',
  city: 'Miejscowość',
  postal_code: 'Kod pocztowy',
  voivodeship: 'Województwo',
  address: 'Adres',
  phone: 'Telefon',
  club: 'Klub',
};

export const FORM_FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  short_text: 'Tekst krótki',
  long_text: 'Tekst długi',
  number: 'Liczba',
  date: 'Data',
  single_choice: 'Wybór jednokrotny',
  multi_choice: 'Wybór wielokrotny',
  consent: 'Zgoda (checkbox)',
};

export const FORM_FIELD_STATE_LABELS: Record<FormFieldState, string> = {
  hidden: 'Nie',
  shown: 'Pokaż',
  required: 'Wymagany',
};

export const formFieldLabel = (field: FormField): string =>
  field.labelOverride?.trim() || SYSTEM_FIELD_LABELS[field.fieldKey] || field.fieldKey;

/**
 * States the organizer may pick for a system position. Mirrors
 * FormFieldCatalog::allowedStates() on the server (which stays authoritative and answers 422):
 * locked and age-driven positions are always `required`, anonymization is Nie/Pokaż only.
 */
export const allowedSystemStates = (fieldKey: string): FormFieldState[] => {
  if (['first_name', 'last_name', 'contact_email', 'birth_date', 'gender'].includes(fieldKey)) {
    return ['required'];
  }
  if (fieldKey === 'anonymization') return ['hidden', 'shown'];
  return ['hidden', 'shown', 'required'];
};

/** Custom, not hidden fields in the order the server returned them. */
export const visibleCustomFields = (fields: FormField[] | undefined): FormField[] =>
  (fields ?? []).filter((f) => f.kind === 'custom' && f.state !== 'hidden');

export const isAnswerEmpty = (value: FormFieldAnswerValue | undefined): boolean =>
  value === undefined ||
  value === null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0);

/**
 * Client-side mirror of FormFieldType::validateAnswer() — only the cheap checks, so a
 * required field blocks the step before the request. The server stays authoritative.
 */
export const validateFormFieldAnswer = (
  field: FormField,
  value: FormFieldAnswerValue | undefined,
): string | null => {
  const required = field.state === 'required';
  if (field.fieldType === 'consent') {
    if (required && value !== true) return 'Ta zgoda jest wymagana.';
    return null;
  }
  if (isAnswerEmpty(value)) return required ? 'To pole jest wymagane.' : null;

  const cfg = field.validationConfig ?? {};
  if (field.fieldType === 'short_text' || field.fieldType === 'long_text') {
    const max = Number(cfg.maxLength ?? 0);
    if (max > 0 && String(value).length > max) return `Tekst może mieć maksymalnie ${max} znaków.`;
  }
  if (field.fieldType === 'number') {
    const n = Number(value);
    if (Number.isNaN(n)) return 'Wartość musi być liczbą.';
    if (cfg.min !== undefined && cfg.min !== '' && n < Number(cfg.min)) {
      return `Wartość nie może być mniejsza niż ${cfg.min}.`;
    }
    if (cfg.max !== undefined && cfg.max !== '' && n > Number(cfg.max)) {
      return `Wartość nie może być większa niż ${cfg.max}.`;
    }
  }
  return null;
};

export const validateFormFieldAnswers = (
  fields: FormField[],
  answers: Record<string, FormFieldAnswerValue>,
): Record<string, string> => {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const message = validateFormFieldAnswer(field, answers[field.id]);
    if (message) errors[field.id] = message;
  }
  return errors;
};

/**
 * Answers worth sending: the visible custom fields the Zawodnik actually filled in, plus a
 * consent that was explicitly given. Empty optional fields are not stored at all.
 */
export const answersToSubmit = (
  fields: FormField[],
  answers: Record<string, FormFieldAnswerValue>,
): Record<string, FormFieldAnswerValue> => {
  const result: Record<string, FormFieldAnswerValue> = {};
  for (const field of visibleCustomFields(fields)) {
    const value = answers[field.id];
    if (field.fieldType === 'consent') {
      if (value === true) result[field.id] = true;
      continue;
    }
    if (field.fieldType === 'number' && !isAnswerEmpty(value)) {
      result[field.id] = Number(value);
      continue;
    }
    if (!isAnswerEmpty(value)) result[field.id] = value as FormFieldAnswerValue;
  }
  return result;
};

/** Sorted-by-the-server list, moved one slot; returns the ids to PUT to /reorder. */
export const moveFieldId = (
  fields: FormField[],
  id: string,
  direction: -1 | 1,
): string[] | null => {
  const ids = fields.map((f) => f.id);
  const index = ids.indexOf(id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= ids.length) return null;
  [ids[index], ids[target]] = [ids[target], ids[index]];
  return ids;
};
