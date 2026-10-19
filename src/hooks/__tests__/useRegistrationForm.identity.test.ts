import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRegistrationForm } from '@/hooks/useRegistrationForm';
import { AuthProvider } from '@/contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import type { Event, FormField } from '@/types';

vi.mock('@/contexts/AuthContext', async () => {
  const actual =
    await vi.importActual<typeof import('@/contexts/AuthContext')>('@/contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: { id: 'u1', name: 'Jan Kowalski', email: 'jan@example.com', role: 'participant' },
      isAuthenticated: true,
    }),
  };
});

const field = (over: Partial<FormField>): FormField => ({
  id: 'f1',
  eventId: 'e1',
  distanceId: null,
  kind: 'custom',
  fieldKey: 'custom_x',
  storageLocation: 'registration',
  state: 'shown',
  sortOrder: 1,
  labelOverride: 'Pole',
  tooltipOverride: null,
  publicListVisible: false,
  visibleToBz: false,
  isConfidential: false,
  fieldType: 'short_text',
  validationConfig: null,
  options: null,
  ...over,
});

const publicFields: FormField[] = [
  field({
    id: 'sys-city',
    kind: 'system',
    fieldKey: 'city',
    state: 'hidden',
    labelOverride: null,
    fieldType: null,
  }),
  field({
    id: 'sys-phone',
    kind: 'system',
    fieldKey: 'phone',
    state: 'required',
    labelOverride: null,
    fieldType: null,
  }),
  field({
    id: 'f-size',
    fieldKey: 'custom_size',
    labelOverride: 'Rozmiar koszulki',
    state: 'required',
  }),
  field({
    id: 'f-meal',
    fieldKey: 'custom_meal',
    labelOverride: 'Posiłek',
    fieldType: 'single_choice',
    options: [{ key: 'veg', label: 'Wegetariański', price: 5 }],
  }),
];

vi.mock('@/api', async () => {
  const actual = await vi.importActual<typeof import('@/api')>('@/api');
  return {
    ...actual,
    getPublicFormFields: vi.fn(async () => ({ success: true, data: publicFields })),
    getRegistrationsByEvent: vi.fn().mockResolvedValue({ data: [], success: true }),
  };
});

const event = {
  id: 'e1',
  name: 'Test Event',
  slug: 'test-event',
  date: '2030-06-15',
  distances: [
    {
      id: 'd1',
      name: '10 km',
      length: 10,
      unit: 'km',
      price: 80,
      ageCategories: [{ id: 'open', name: 'OPEN', minAge: 18, maxAge: 99 }],
      registeredCount: 0,
    },
  ],
  discountCodes: [],
  enableMerchandiseInRegistration: false,
} as unknown as Event;

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(BrowserRouter, null, React.createElement(AuthProvider, null, children)),
  );
};

describe('useRegistrationForm identity section and server errors (B-07)', () => {
  it('lists identity positions by tri-state, validates the required one and sends only visible values', async () => {
    const { result } = renderHook(() => useRegistrationForm(event), { wrapper });
    await waitFor(() => expect(result.current.identityFormFields).toHaveLength(1));
    expect(result.current.stepFormFields.map((f) => f.fieldKey)).toEqual([
      'phone',
      'custom_size',
      'custom_meal',
    ]);
    expect(result.current.formFieldErrors['sys-phone']).toBe('To pole jest wymagane.');

    act(() => {
      result.current.setFormFieldAnswer('sys-phone', ' 600 100 200 ');
      result.current.setFormFieldAnswer('sys-city', 'Ukryte');
      result.current.setFormFieldAnswer('f-size', 'M');
      result.current.setFormFieldAnswer('f-meal', 'veg');
      result.current.setSelectedDistanceId('d1');
      result.current.setAgreedToTerms(true);
    });
    const data = result.current.buildSubmitData();
    expect(data?.identity).toEqual({ phone: '600 100 200' });
    expect(data?.formFieldAnswers).toEqual({ 'f-size': 'M', 'f-meal': 'veg' });
    // display-only preview of the picked variant; the server's settlement is the truth
    expect(result.current.modifiersTotal).toBe(5);
  });

  it('puts a 422 per-field error next to the field and returns to the Formularz step', async () => {
    const { result } = renderHook(() => useRegistrationForm(event), { wrapper });
    await waitFor(() => expect(result.current.customFormFields).toHaveLength(2));

    let unmatched: unknown[] = [];
    act(() => {
      unmatched = result.current.applyServerFieldErrors([
        {
          fieldId: 'f-size',
          fieldKey: 'custom_size',
          code: 'invalid_value',
          message: 'Zły rozmiar.',
        },
        { fieldId: '', fieldKey: 'phone', code: 'required', message: 'Podaj telefon.' },
        { fieldId: 'x', fieldKey: 'nope', code: 'unknown_field', message: 'Nieznane.' },
      ]);
    });
    expect(result.current.step).toBe(26);
    expect(result.current.serverFieldErrors).toEqual({
      'f-size': 'Zły rozmiar.',
      'sys-phone': 'Podaj telefon.',
    });
    expect(unmatched).toHaveLength(1);

    act(() => result.current.setFormFieldAnswer('f-size', 'L'));
    expect(result.current.serverFieldErrors).toEqual({ 'sys-phone': 'Podaj telefon.' });
  });
});
