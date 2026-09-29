import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DisciplineMultiSelect } from '../DisciplineMultiSelect';

vi.mock('@/api', () => ({
  disciplineLabels: { running: 'Bieganie', cycling: 'Kolarstwo' },
}));

describe('DisciplineMultiSelect', () => {
  it('has no button nested inside a button', () => {
    const { container } = render(
      <DisciplineMultiSelect selected={['running', 'cycling']} onChange={vi.fn()} />,
    );
    expect(container.querySelectorAll('button button').length).toBe(0);
  });

  it('exposes the trigger as a combobox named "Dyscyplina"', () => {
    render(<DisciplineMultiSelect selected={[]} onChange={vi.fn()} />);
    expect(screen.getByRole('combobox', { name: /Dyscyplina/ })).toBeInTheDocument();
  });

  it('removes a discipline via its chip button when more than one is selected, without opening the popover', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DisciplineMultiSelect selected={['running', 'cycling']} onChange={onChange} />);

    const removeButton = screen.getByRole('button', { name: 'Usuń dyscyplinę: Kolarstwo' });
    await user.click(removeButton);

    expect(onChange).toHaveBeenCalledWith(['running']);
    expect(screen.getByRole('combobox', { name: /Dyscyplina/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('renders no remove button when only one discipline is selected', () => {
    render(<DisciplineMultiSelect selected={['running']} onChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Usuń dyscyplinę/ })).not.toBeInTheDocument();
  });
});
