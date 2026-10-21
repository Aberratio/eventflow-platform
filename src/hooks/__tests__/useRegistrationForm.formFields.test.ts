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
    id: 'sys-phone',
    kind: 'system',
    fieldKey: 'phone',
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

describe('useRegistrationForm with an organizer-configured form (E1.13)', () => {
  it('adds a Formularz step with only the custom, non-hidden fields', async () => {
    const { result } = renderHook(() => useRegistrationForm(event), { wrapper });
    await waitFor(() => expect(result.current.customFormFields).toHaveLength(2));
    expect(result.current.activeSteps.map((s) => s.name)).toEqual([
      'Dystans',
      'Dane',
      'Formularz',
      'Drużyna',
      'Rabat',
      'Podsumowanie',
    ]);
  });

  it('blocks the step until the required custom field is answered, then sends the answers', async () => {
    const { result } = renderHook(() => useRegistrationForm(event), { wrapper });
    await waitFor(() => expect(result.current.customFormFields).toHaveLength(2));

    act(() => {
      result.current.setSelectedDistanceId('d1');
      result.current.setBirthYear('1990');
      result.current.setBirthMonth('01');
      result.current.setBirthDay('01');
      result.current.setSelectedCategory('OPEN');
    });
    act(() => result.current.handleNext());
    act(() => result.current.handleNext());
    expect(result.current.step).toBe(26);
    expect(result.current.canProceed()).toBe(false);
    expect(result.current.formFieldErrors['f-size']).toBe('To pole jest wymagane.');

    act(() => {
      result.current.setFormFieldAnswer('f-size', 'M');
      result.current.setFormFieldAnswer('f-meal', 'veg');
    });
    expect(result.current.canProceed()).toBe(true);

    act(() => result.current.setAgreedToTerms(true));
    expect(result.current.buildSubmitData()?.formFieldAnswers).toEqual({
      'f-size': 'M',
      'f-meal': 'veg',
    });
  });

  it('loads the form of the chosen distance (R-04)', async () => {
    const { getPublicFormFields } = await import('@/api');
    const { result } = renderHook(() => useRegistrationForm(event), { wrapper });
    await waitFor(() => expect(getPublicFormFields).toHaveBeenCalledWith('e1', undefined));

    act(() => result.current.setSelectedDistanceId('d1'));

    await waitFor(() => expect(getPublicFormFields).toHaveBeenCalledWith('e1', 'd1'));
  });
});
