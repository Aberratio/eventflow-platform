import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { CustomFormFieldsStep } from '../CustomFormFieldsStep';
import { formStepFields } from '@/lib/formFields';
import type { FormField } from '@/types';

const sys = (key: string, state: FormField['state']): FormField => ({
  id: `s-${key}`,
  eventId: 'e1',
  distanceId: null,
  kind: 'system',
  fieldKey: key,
  storageLocation: 'competitor',
  state,
  sortOrder: 1,
  labelOverride: null,
  tooltipOverride: null,
  publicListVisible: false,
  visibleToBz: false,
  isConfidential: false,
  fieldType: null,
  validationConfig: null,
  options: null,
});

describe('CustomFormFieldsStep identity section', () => {
  it('renders non-hidden identity positions by tri-state with the right controls', async () => {
    const onChange = vi.fn();
    const all = [
      sys('phone', 'required'),
      sys('club', 'shown'),
      sys('city', 'hidden'),
      sys('voivodeship', 'shown'),
      sys('anonymization', 'shown'),
    ];
    render(
      <CustomFormFieldsStep
        fields={formStepFields(all)}
        answers={{}}
        errors={{}}
        onChange={onChange}
      />,
    );
    expect(screen.getByLabelText(/Telefon/)).toHaveAttribute('type', 'tel');
    expect(screen.getByText('Telefon').textContent).toContain('*');
    expect(screen.getByText('Klub').textContent).not.toContain('*');
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.queryByTestId('form-field-city')).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/Telefon/), '6');
    expect(onChange).toHaveBeenCalledWith('s-phone', '6');
    await userEvent.click(screen.getByLabelText('Anonimizacja'));
    expect(onChange).toHaveBeenCalledWith('s-anonymization', true);
  });

  it('shows a server error next to its field before the user typed anything', () => {
    render(
      <CustomFormFieldsStep
        fields={[sys('phone', 'required')]}
        answers={{}}
        errors={{}}
        serverErrors={{ 's-phone': 'Podaj telefon.' }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId('form-field-phone')).toHaveTextContent('Podaj telefon.');
  });
});
