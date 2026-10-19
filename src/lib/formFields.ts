import type {
  FormField,
  FormFieldAnswerValue,
  FormFieldState,
  FormFieldType,
  RegistrationFormFieldAnswer,
  RegistrationFormFieldError,
  RegistrationIdentityPayload,
} from '@/types';

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

/** Closed list of 16 voivodeships — identical to FormFieldCatalog::voivodeships() on the server. */
export const VOIVODESHIPS = [
  'dolnośląskie',
  'kujawsko-pomorskie',
  'lubelskie',
  'lubuskie',
  'łódzkie',
  'małopolskie',
  'mazowieckie',
  'opolskie',
  'podkarpackie',
  'podlaskie',
  'pomorskie',
  'śląskie',
  'świętokrzyskie',
  'warmińsko-mazurskie',
  'wielkopolskie',
  'zachodniopomorskie',
] as const;

/** Identity-section system positions the registration form renders, keyed to the `identity` payload key. */
export const IDENTITY_PAYLOAD_KEYS = {
  phone: 'phone',
  club: 'club',
  country: 'country',
  city: 'city',
  postal_code: 'postalCode',
  voivodeship: 'voivodeship',
  address: 'address',
  anonymization: 'isAnonymized',
} as const satisfies Record<string, keyof RegistrationIdentityPayload>;

type IdentityFieldKey = keyof typeof IDENTITY_PAYLOAD_KEYS;

export const isIdentityFieldKey = (fieldKey: string): fieldKey is IdentityFieldKey =>
  Object.prototype.hasOwnProperty.call(IDENTITY_PAYLOAD_KEYS, fieldKey);

/** Identity system positions that are not hidden (tri-state: hidden => absent, shown, required). */
export const visibleIdentityFields = (fields: FormField[] | undefined): FormField[] =>
  (fields ?? []).filter(
    (f) => f.kind === 'system' && isIdentityFieldKey(f.fieldKey) && f.state !== 'hidden',
  );

/** Everything the "Formularz" step renders: identity positions plus custom fields. */
export const formStepFields = (fields: FormField[] | undefined): FormField[] => [
  ...visibleIdentityFields(fields),
  ...visibleCustomFields(fields),
];

/**
 * The `identity` object for POST /registrations: only visible positions the Zawodnik filled in
 * (values are read from the answers map by form-field id). Hidden positions are never sent.
 */
export const identityToSubmit = (
  fields: FormField[],
  answers: Record<string, FormFieldAnswerValue>,
): RegistrationIdentityPayload | undefined => {
  const identity: Record<string, string | boolean> = {};
  for (const field of visibleIdentityFields(fields)) {
    const key = IDENTITY_PAYLOAD_KEYS[field.fieldKey as IdentityFieldKey];
    const value = answers[field.id];
    if (key === 'isAnonymized') {
      if (typeof value === 'boolean') identity[key] = value;
      continue;
    }
    if (typeof value === 'string' && value.trim() !== '') identity[key] = value.trim();
  }
  return Object.keys(identity).length > 0 ? (identity as RegistrationIdentityPayload) : undefined;
};

/** The `formFieldAnswers` array for POST /registrations from the id => value map. */
export const answersToPayload = (
  answers: Record<string, FormFieldAnswerValue> | undefined,
): RegistrationFormFieldAnswer[] | undefined => {
  const entries = Object.entries(answers ?? {});
  return entries.length > 0 ? entries.map(([fieldId, value]) => ({ fieldId, value })) : undefined;
};

/**
 * Maps the server's per-field 422 entries onto the rendered fields (by `fieldId`, falling back
 * to `fieldKey`): messages keyed by form-field id, plus the entries that match no field.
 */
export const mapServerFieldErrors = (
  fields: FormField[],
  errors: RegistrationFormFieldError[],
): { byFieldId: Record<string, string>; unmatched: RegistrationFormFieldError[] } => {
  const byFieldId: Record<string, string> = {};
  const unmatched: RegistrationFormFieldError[] = [];
  for (const error of errors) {
    const field =
      fields.find((f) => f.id === error.fieldId) ??
      fields.find((f) => error.fieldKey !== '' && f.fieldKey === error.fieldKey);
    if (field) byFieldId[field.id] ??= error.message;
    else unmatched.push(error);
  }
  return { byFieldId, unmatched };
};

/**
 * Preview-only sum of the variant prices picked in single/multi choice fields. Never sent and
 * never trusted: the server's `settlementItems` (basis `modifier`) are the truth.
 */
export const modifierPreviewTotal = (
  fields: FormField[],
  answers: Record<string, FormFieldAnswerValue>,
): number => {
  let total = 0;
  for (const field of fields) {
    if (field.fieldType !== 'single_choice' && field.fieldType !== 'multi_choice') continue;
    const value = answers[field.id];
    const picked = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
    for (const option of field.options ?? []) {
      if (picked.includes(option.key)) total += Number(option.price) || 0;
    }
  }
  return total;
};
