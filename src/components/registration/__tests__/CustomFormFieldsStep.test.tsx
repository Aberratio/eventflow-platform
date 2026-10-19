import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { CustomFormFieldsStep } from '../CustomFormFieldsStep';
import type { FormField } from '@/types';

const base: FormField = {
  id: 'f1',
  eventId: 'e1',
  distanceId: null,
  kind: 'custom',
  fieldKey: 'custom_a',
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
};

describe('CustomFormFieldsStep', () => {
  it('marks required fields and reports typed values', async () => {
    const onChange = vi.fn();
    render(
      <CustomFormFieldsStep
        fields={[{ ...base, state: 'required', labelOverride: 'Rozmiar koszulki' }]}
        answers={{}}
        errors={{ f1: 'To pole jest wymagane.' }}
        onChange={onChange}
      />,
    );
    expect(screen.getByText(/Rozmiar koszulki/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/Rozmiar koszulki/), 'M');
    expect(onChange).toHaveBeenCalledWith('f1', 'M');
  });

  it('shows variant prices (signed) and reports the chosen option key', async () => {
    const onChange = vi.fn();
    render(
      <CustomFormFieldsStep
        fields={[
          {
            ...base,
            fieldType: 'single_choice',
            labelOverride: 'Posiłek',
            options: [
              { key: 'veg', label: 'Wegetariański', price: 5 },
              { key: 'draw', label: 'Bez losowania', price: -5 },
              { key: 'std', label: 'Standard', price: 0 },
            ],
          },
        ]}
        answers={{}}
        errors={{}}
        onChange={onChange}
      />,
    );
    expect(screen.getByText(/Wegetariański \(\+5,00/)).toBeInTheDocument();
    expect(screen.getByText(/Bez losowania \(-5,00/)).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText(/Wegetariański/));
    expect(onChange).toHaveBeenCalledWith('f1', 'veg');
  });

  it('toggles a consent and a multi choice', async () => {
    const onChange = vi.fn();
    render(
      <CustomFormFieldsStep
        fields={[
          {
            ...base,
            id: 'c1',
            fieldType: 'consent',
            state: 'required',
            labelOverride: 'Zgoda RODO',
          },
          {
            ...base,
            id: 'm1',
            fieldType: 'multi_choice',
            labelOverride: 'Dodatki',
            options: [
              { key: 'a', label: 'Alfa', price: 0 },
              { key: 'b', label: 'Beta', price: 0 },
            ],
          },
        ]}
        answers={{ m1: ['a'] }}
        errors={{}}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByLabelText(/Zgoda RODO/));
    expect(onChange).toHaveBeenCalledWith('c1', true);
    await userEvent.click(screen.getByLabelText('Beta'));
    expect(onChange).toHaveBeenCalledWith('m1', ['a', 'b']);
  });
});
