import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';

const Sample = (props: React.ComponentProps<typeof SelectTrigger> & { placeholder?: string }) => {
  const { placeholder, ...rest } = props;
  return (
    <Select>
      <SelectTrigger {...rest}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="a">A</SelectItem>
      </SelectContent>
    </Select>
  );
};

describe('SelectTrigger accessible name (WCAG 4.1.2)', () => {
  it('falls back to the placeholder when no label is given', () => {
    render(<Sample placeholder="Dyscyplina" />);
    expect(screen.getByRole('combobox', { name: 'Dyscyplina' })).toBeInTheDocument();
  });

  it('prefers an explicit aria-label', () => {
    render(<Sample placeholder="Wszystkie" aria-label="Filtr dyscypliny" />);
    expect(screen.getByRole('combobox', { name: 'Filtr dyscypliny' })).toBeInTheDocument();
  });

  it('is named by an external <label htmlFor>', () => {
    render(
      <>
        <label htmlFor="disc">Dyscyplina</label>
        <Sample id="disc" placeholder="Wybierz" />
      </>,
    );
    expect(screen.getByRole('combobox', { name: 'Dyscyplina' })).toBeInTheDocument();
  });
});
