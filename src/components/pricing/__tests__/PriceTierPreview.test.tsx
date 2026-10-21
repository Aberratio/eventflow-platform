import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import { httpAdapter } from '@/api/adapters/http.adapter';
import { PriceTiersEditor } from '@/pages/admin/components/PriceTiersEditor';
import { PriceTierPreview } from '../PriceTierPreview';
import type { Distance } from '@/types';

describe('PriceTierPreview money rendering', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the base price for a numeric basePrice', () => {
    render(<PriceTierPreview basePrice={55} tiers={[]} />);
    expect(screen.getByText(/cena bazowa 55,00 zł/)).toBeInTheDocument();
  });

  it('PriceTiersEditor renders a distance coming out of the http adapter from string DECIMALs', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'e1',
          distances: [
            {
              id: 'd1',
              name: '10 km',
              unit: 'km',
              price: '55.00',
              length: '10.000',
              priceTiers: [],
            },
          ],
        },
      }),
    } as unknown as Response);
    const event = (await httpAdapter.getEventById('e1')).data!;
    render(<PriceTiersEditor distances={event.distances as Distance[]} onChange={() => {}} />);
    expect(screen.getByText(/cena bazowa 55,00 zł/)).toBeInTheDocument();
    expect(screen.getByText(/\(10 km\)/)).toBeInTheDocument();
  });
});
