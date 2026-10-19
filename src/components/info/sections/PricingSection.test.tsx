import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PricingSection } from './PricingSection';
import type { InfoPageSection } from '@/types';

describe('PricingSection price (D-03)', () => {
  it('formats the price with formatMoney', () => {
    render(
      <PricingSection
        section={
          {
            id: 's',
            type: 'pricing',
            title: 'Cennik',
            items: [{ id: 'i1', title: 'Pakiet', price: 49.5 }],
          } as unknown as InfoPageSection
        }
      />,
    );
    expect(screen.getByText('49,50 zł')).toBeInTheDocument();
  });
});
