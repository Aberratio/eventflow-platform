import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { FormFieldAggregatesCard } from '../FormFieldAggregatesCard';
import type { FormFieldAggregate } from '@/types';

const getFormFieldAggregates = vi.fn();

vi.mock('@/api', () => ({
  getFormFieldAggregates: (...args: unknown[]) => getFormFieldAggregates(...args),
}));

const tshirtAggregate: FormFieldAggregate = {
  formFieldId: 'field-1',
  fieldKey: 'tshirt_size',
  label: 'Rozmiar koszulki',
  fieldType: 'single_choice',
  counts: [
    { key: 's', label: 'S', count: 3 },
    { key: 'm', label: 'M', count: 7 },
    { key: 'l', label: 'L', count: 0 },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FormFieldAggregatesCard (E2.5)', () => {
  it('renders the counts it is given for a single_choice field, including the zero-count option', async () => {
    getFormFieldAggregates.mockResolvedValue({ success: true, data: [tshirtAggregate] });

    render(<FormFieldAggregatesCard eventId="event-1" />);

    expect(await screen.findByText('Rozmiar koszulki')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('L')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();

    expect(getFormFieldAggregates).toHaveBeenCalledWith('event-1');
  });

  it('shows an empty-state message when the event has no choice-type fields', async () => {
    getFormFieldAggregates.mockResolvedValue({ success: true, data: [] });

    render(<FormFieldAggregatesCard eventId="event-1" />);

    await waitFor(() =>
      expect(screen.getByText(/nie ma jeszcze pól formularza typu wyboru/i)).toBeInTheDocument(),
    );
  });

  it('shows the multi-select hint for a multi_choice field', async () => {
    getFormFieldAggregates.mockResolvedValue({
      success: true,
      data: [
        {
          formFieldId: 'field-2',
          fieldKey: 'meal',
          label: 'Posiłek',
          fieldType: 'multi_choice',
          counts: [
            { key: 'veg', label: 'Wege', count: 2 },
            { key: 'meat', label: 'Mięso', count: 3 },
          ],
        } satisfies FormFieldAggregate,
      ],
    });

    render(<FormFieldAggregatesCard eventId="event-1" />);

    expect(await screen.findByText('Posiłek')).toBeInTheDocument();
    expect(screen.getByText(/Suma wyborów: 5/)).toBeInTheDocument();
  });
});
