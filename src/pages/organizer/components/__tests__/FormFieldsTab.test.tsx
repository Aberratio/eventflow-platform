import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { render, resetQueryClient } from '@/test/test-utils';
import { FormFieldsTab } from '../FormFieldsTab';
import { ApiRequestError } from '@/api/errors';
import type { FormField } from '@/types';

const api = vi.hoisted(() => ({
  getFormFields: vi.fn(),
  getDistanceFormFields: vi.fn(),
  createDistanceFormField: vi.fn(),
  overrideFormField: vi.fn(),
  resetFormFieldOverride: vi.fn(),
  createFormField: vi.fn(),
  updateFormField: vi.fn(),
  deleteFormField: vi.fn(),
  reorderFormFields: vi.fn(),
}));
vi.mock('@/api', () => api);

const field = (over: Partial<FormField>): FormField => ({
  id: 'x',
  eventId: 'e1',
  distanceId: null,
  kind: 'system',
  fieldKey: 'phone',
  storageLocation: 'competitor',
  state: 'hidden',
  sortOrder: 1,
  labelOverride: null,
  tooltipOverride: null,
  publicListVisible: false,
  visibleToBz: false,
  isConfidential: false,
  fieldType: null,
  validationConfig: null,
  options: null,
  ...over,
});

const list: FormField[] = [
  field({ id: 's1', fieldKey: 'first_name', state: 'required', storageLocation: 'competitor' }),
  field({ id: 's2', fieldKey: 'phone' }),
  field({ id: 's3', fieldKey: 'anonymization' }),
  field({
    id: 'c1',
    kind: 'custom',
    fieldKey: 'custom_size',
    labelOverride: 'Rozmiar koszulki',
    fieldType: 'single_choice',
    state: 'shown',
    options: [{ key: 'm', label: 'M', price: -5 }],
  }),
];

Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', { value: () => false });
Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', { value: () => undefined });
Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', { value: () => undefined });
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { value: () => undefined });

beforeEach(() => {
  vi.clearAllMocks();
  resetQueryClient();
  api.getFormFields.mockResolvedValue({ success: true, data: list });
});

describe('FormFieldsTab (E1.13)', () => {
  it('lists system and custom fields and locks the states the catalogue does not allow', async () => {
    render(<FormFieldsTab eventId="e1" />);
    expect(await screen.findByText('Rozmiar koszulki')).toBeInTheDocument();

    const firstName = screen.getByRole('group', { name: 'Stan pola: Imię' });
    expect(firstName.querySelectorAll('button:disabled')).toHaveLength(3);

    const anonymization = screen.getByRole('group', { name: 'Stan pola: Anonimizacja' });
    expect(screen.getByText(/M \(-5 zł\)/)).toBeInTheDocument();
    expect(
      Array.from(anonymization.querySelectorAll('button')).map((b) => [b.textContent, b.disabled]),
    ).toEqual([
      ['Nie', false],
      ['Pokaż', false],
      ['Wymagany', true],
    ]);
  });

  it('changes the tri-state of a free system position and shows the server message on error', async () => {
    api.updateFormField.mockResolvedValueOnce({
      success: true,
      data: { ...list[1], state: 'required' },
    });
    render(<FormFieldsTab eventId="e1" />);
    const group = await screen.findByRole('group', { name: 'Stan pola: Telefon' });
    await userEvent.click(
      Array.from(group.querySelectorAll('button')).find((b) => b.textContent === 'Wymagany')!,
    );
    expect(api.updateFormField).toHaveBeenCalledWith('e1', 's2', { state: 'required' });

    api.updateFormField.mockRejectedValueOnce(
      new Error('Ta pozycja dopuszcza wyłącznie stany: required.'),
    );
    await userEvent.click(
      Array.from(group.querySelectorAll('button')).find((b) => b.textContent === 'Pokaż')!,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('dopuszcza wyłącznie stany');
  });

  it('reorders with the up/down buttons, sending the whole id list', async () => {
    api.reorderFormFields.mockResolvedValue({ success: true, data: list });
    render(<FormFieldsTab eventId="e1" />);
    await userEvent.click(await screen.findByLabelText('Przesuń w górę: Telefon'));
    expect(api.reorderFormFields).toHaveBeenCalledWith('e1', ['s2', 's1', 's3', 'c1']);
  });

  it('adds a custom text field', async () => {
    api.createFormField.mockResolvedValue({ success: true, data: list[3] });
    render(<FormFieldsTab eventId="e1" />);
    await userEvent.click(await screen.findByRole('button', { name: /Dodaj pole/ }));

    // Type stays on the default (short text) first; label + required are enough for it.
    await userEvent.type(screen.getByLabelText('Etykieta'), 'Notatka');
    await userEvent.click(screen.getByLabelText('Pole wymagane'));
    await userEvent.click(screen.getByRole('button', { name: 'Dodaj pole' }));

    await waitFor(() => expect(api.createFormField).toHaveBeenCalledTimes(1));
    expect(api.createFormField).toHaveBeenCalledWith(
      'e1',
      expect.objectContaining({
        fieldType: 'short_text',
        label: 'Notatka',
        state: 'required',
        isConfidential: false,
      }),
    );
  });

  it('adds a single-choice field with a signed variant price', async () => {
    api.createFormField.mockResolvedValue({ success: true, data: list[3] });
    render(<FormFieldsTab eventId="e1" />);
    await userEvent.click(await screen.findByRole('button', { name: /Dodaj pole/ }));
    await userEvent.click(screen.getByLabelText('Typ pola'));
    await userEvent.click(await screen.findByRole('option', { name: 'Wybór jednokrotny' }));
    await userEvent.type(screen.getByLabelText('Etykieta'), 'Losowanie');
    await userEvent.type(screen.getByLabelText('Wariant 1'), 'Bez losowania');
    await userEvent.type(screen.getByLabelText('Cena wariantu 1'), '-5');
    await userEvent.click(screen.getByRole('button', { name: 'Dodaj pole' }));
    await waitFor(() => expect(api.createFormField).toHaveBeenCalledTimes(1));
    expect(api.createFormField).toHaveBeenCalledWith(
      'e1',
      expect.objectContaining({
        fieldType: 'single_choice',
        options: [{ label: 'Bez losowania', price: -5 }],
      }),
    );
  });

  it('edits the variants of a custom field in place, keeping the keys of existing ones (B-02)', async () => {
    api.updateFormField.mockResolvedValue({ success: true, data: list[3] });
    render(<FormFieldsTab eventId="e1" />);
    await userEvent.click(await screen.findByRole('button', { name: 'Edytuj: Rozmiar koszulki' }));
    const price = screen.getByLabelText('Cena wariantu 1');
    await userEvent.clear(price);
    await userEvent.type(price, '-7');
    await userEvent.click(screen.getByRole('button', { name: /Dodaj wariant/ }));
    await userEvent.type(screen.getByLabelText('Wariant 2'), 'XL');
    await userEvent.type(screen.getByLabelText('Cena wariantu 2'), '3');
    await userEvent.click(screen.getByRole('button', { name: 'Zapisz' }));
    await waitFor(() => expect(api.updateFormField).toHaveBeenCalledTimes(1));
    const [, id, patch] = api.updateFormField.mock.calls[0];
    expect(id).toBe('c1');
    expect(patch.options).toEqual([
      { key: 'm', label: 'M', price: -7 },
      { label: 'XL', price: 3 },
    ]);
    expect(patch).not.toHaveProperty('fieldType');
  });

  it('changes the type of a custom field in place (B-02)', async () => {
    api.updateFormField.mockResolvedValue({ success: true, data: list[3] });
    render(<FormFieldsTab eventId="e1" />);
    await userEvent.click(await screen.findByRole('button', { name: 'Edytuj: Rozmiar koszulki' }));
    await userEvent.click(screen.getByLabelText('Typ pola'));
    await userEvent.click(await screen.findByRole('option', { name: 'Wybór wielokrotny' }));
    await userEvent.click(screen.getByRole('button', { name: 'Zapisz' }));
    await waitFor(() => expect(api.updateFormField).toHaveBeenCalledTimes(1));
    expect(api.updateFormField.mock.calls[0][2]).toMatchObject({
      fieldType: 'multi_choice',
      options: [{ key: 'm', label: 'M', price: -5 }],
    });
  });

  it('explains a 409 when the type of a field with answers is changed (B-02)', async () => {
    api.updateFormField.mockRejectedValue(
      new ApiRequestError('Nie można zmienić typu.', 'form_field_has_answers', 409),
    );
    render(<FormFieldsTab eventId="e1" />);
    await userEvent.click(await screen.findByRole('button', { name: 'Edytuj: Rozmiar koszulki' }));
    await userEvent.click(screen.getByLabelText('Typ pola'));
    await userEvent.click(await screen.findByRole('option', { name: 'Tekst krótki' }));
    await userEvent.click(screen.getByRole('button', { name: 'Zapisz' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('ma już odpowiedzi');
    expect(screen.getByRole('button', { name: 'Zapisz' })).toBeInTheDocument();
  });

  it('explains a 409 when a used variant is removed (B-02)', async () => {
    api.updateFormField.mockRejectedValue(
      new ApiRequestError('Nie można usunąć wariantu: m.', 'form_field_option_in_use', 409),
    );
    render(<FormFieldsTab eventId="e1" />);
    await userEvent.click(await screen.findByRole('button', { name: 'Edytuj: Rozmiar koszulki' }));
    await userEvent.click(screen.getByRole('button', { name: 'Zapisz' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('wybrali już zawodnicy');
  });

  it('shows a 422 from the server inside the create dialog', async () => {
    api.createFormField.mockRejectedValue(new Error('Nieznany typ pola własnego.'));
    render(<FormFieldsTab eventId="e1" />);
    await userEvent.click(await screen.findByRole('button', { name: /Dodaj pole/ }));
    await userEvent.type(screen.getByLabelText('Etykieta'), 'Cokolwiek');
    await userEvent.click(screen.getByRole('button', { name: 'Dodaj pole' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Nieznany typ pola własnego.');
  });

  it('deletes a custom field after confirmation and offers no delete for system ones', async () => {
    api.deleteFormField.mockResolvedValue({ success: true, data: { deleted: true } });
    render(<FormFieldsTab eventId="e1" />);
    await screen.findByText('Rozmiar koszulki');
    expect(screen.queryByLabelText('Usuń: Telefon')).not.toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Usuń: Rozmiar koszulki'));
    await userEvent.click(screen.getByRole('button', { name: 'Usuń pole' }));
    await waitFor(() => expect(api.deleteFormField).toHaveBeenCalledWith('e1', 'c1'));
  });
});

describe('FormFieldsTab per distance (R-04)', () => {
  const distances = [{ id: 'd1', name: '10 km' }];
  const effective: FormField[] = [
    { ...list[1], source: 'event' },
    {
      ...list[3],
      id: 'o1',
      distanceId: 'd1',
      source: 'override',
      labelOverride: 'Rozmiar (10 km)',
    },
    field({
      id: 'x1',
      kind: 'custom',
      fieldKey: 'custom_only',
      labelOverride: 'Tylko 10 km',
      fieldType: 'short_text',
      state: 'shown',
      distanceId: 'd1',
      source: 'distance',
    }),
  ];

  const openDistance = async () => {
    api.getDistanceFormFields.mockResolvedValue({ success: true, data: effective });
    render(<FormFieldsTab eventId="e1" distances={distances} />);
    await userEvent.click(await screen.findByLabelText('Formularz dla'));
    await userEvent.click(await screen.findByRole('option', { name: 'Dystans: 10 km' }));
    await screen.findByText('Tylko 10 km');
  };

  it('has no selector without distances', async () => {
    render(<FormFieldsTab eventId="e1" />);
    await screen.findByText('Rozmiar koszulki');
    expect(screen.queryByLabelText('Formularz dla')).not.toBeInTheDocument();
  });

  it('marks inherited, overridden and distance-only fields and locks the inherited one', async () => {
    await openDistance();
    expect(api.getDistanceFormFields).toHaveBeenCalledWith('e1', 'd1');
    expect(screen.getByText('Odziedziczone')).toBeInTheDocument();
    expect(screen.getByText('Nadpisane na dystansie')).toBeInTheDocument();
    expect(screen.getByText('Tylko ten dystans')).toBeInTheDocument();
    const inherited = screen.getByRole('group', { name: 'Stan pola: Telefon' });
    expect(inherited.querySelectorAll('button:disabled')).toHaveLength(3);
    expect(screen.getByLabelText('Edytuj: Telefon')).toBeDisabled();
    expect(screen.getByLabelText('Przesuń w górę: Telefon')).toBeDisabled();
  });

  it('overrides an inherited field and resets an overridden one', async () => {
    api.overrideFormField.mockResolvedValue({ success: true, data: {} });
    api.resetFormFieldOverride.mockResolvedValue({ success: true, data: { reset: true } });
    await openDistance();

    await userEvent.click(screen.getByLabelText('Nadpisz na dystansie: Telefon'));
    await waitFor(() => expect(api.overrideFormField).toHaveBeenCalledWith('e1', 'd1', 's2'));

    await userEvent.click(screen.getByLabelText('Przywróć dziedziczenie: Rozmiar (10 km)'));
    await waitFor(() => expect(api.resetFormFieldOverride).toHaveBeenCalledWith('e1', 'd1', 'o1'));
  });

  it('adds a distance-only field through the distance endpoint', async () => {
    api.createDistanceFormField.mockResolvedValue({ success: true, data: effective[2] });
    await openDistance();
    await userEvent.click(screen.getByRole('button', { name: /Dodaj pole/ }));
    await userEvent.type(screen.getByLabelText('Etykieta'), 'Notatka');
    await userEvent.click(screen.getByRole('button', { name: 'Dodaj pole' }));

    await waitFor(() => expect(api.createDistanceFormField).toHaveBeenCalledTimes(1));
    expect(api.createDistanceFormField).toHaveBeenCalledWith(
      'e1',
      'd1',
      expect.objectContaining({ label: 'Notatka' }),
    );
    expect(api.createFormField).not.toHaveBeenCalled();
  });
});
