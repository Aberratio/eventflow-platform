import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/test-utils';
import { AddDiscountCodeDialog } from '../AddDiscountCodeDialog';
import type { Distance } from '@/types';

Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
  value: () => false,
});
Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
  value: () => undefined,
});
Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
  value: () => undefined,
});
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: () => undefined,
});

const distances: Distance[] = [
  {
    id: 'd-5k',
    name: '5 km',
    length: 5,
    unit: 'km',
    categories: ['Open'],
    registeredCount: 0,
    price: 50,
  },
  {
    id: 'd-10k',
    name: '10 km',
    length: 10,
    unit: 'km',
    categories: ['Open'],
    registeredCount: 0,
    price: 80,
  },
];

describe('AddDiscountCodeDialog', () => {
  it('warns organizer when fixed discount is higher than affected distance price', async () => {
    const user = userEvent.setup();

    render(<AddDiscountCodeDialog discountCodes={[]} distances={distances} onAdd={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Dodaj kod/i }));
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: /Kwotowa/i }));
    const valueInput = screen.getByPlaceholderText('50,00');
    await user.clear(valueInput);
    await user.type(valueInput, '60,50');

    expect(screen.getByText(/Rabat jest wyższy niż cena/i)).toBeInTheDocument();
    expect(screen.getByText(/5 km \(50,00 zł\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Uczestnik zapłaci 0,00 zł/i)).toBeInTheDocument();
  });
});
