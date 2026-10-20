import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor, resetQueryClient } from '@/test/test-utils';
import type { DiscountCodeBatch, DiscountCodeBatchDetail } from '@/types';

const api = vi.hoisted(() => ({
  getDiscountCodeBatches: vi.fn(),
  createDiscountCodeBatch: vi.fn(),
  exportDiscountCodeBatch: vi.fn(),
}));
vi.mock('@/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api')>()),
  ...api,
}));

import { batchToDiscountCodes } from '@/lib/discountBatches';
import { DiscountCodeBatchesPanel } from '../DiscountCodeBatchesPanel';

Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', { value: () => false });
Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', { value: () => undefined });
Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', { value: () => undefined });
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { value: () => undefined });

const existing: DiscountCodeBatch = {
  id: 'b-old',
  eventId: 'event-1',
  label: 'Sponsor Acme',
  prefix: 'ACME',
  count: 20,
  discountType: 'percent',
  discountValue: 15,
  maxUses: 1,
  createdAt: '2026-10-01 10:00:00',
  usedTotal: 3,
  codesTotal: 20,
};

const generated: DiscountCodeBatchDetail = {
  ...existing,
  id: 'b-new',
  label: 'VIP',
  prefix: 'VIP',
  count: 2,
  discountType: 'fixed',
  discountValue: 25.5,
  maxUses: 2,
  validFrom: '2026-05-01',
  validTo: null,
  usedTotal: 0,
  codesTotal: 2,
  codes: [
    { id: 'c1', code: 'VIP-AAAAAAAA', usedCount: 0, active: true },
    { id: 'c2', code: 'VIP-BBBBBBBB', usedCount: 0, active: true },
  ],
};

describe('DiscountCodeBatchesPanel', () => {
  beforeEach(() => {
    resetQueryClient();
    vi.clearAllMocks();
    api.getDiscountCodeBatches.mockResolvedValue({ success: true, data: [existing] });
  });

  it('lists existing batches and downloads the CSV of one', async () => {
    const user = userEvent.setup();
    api.exportDiscountCodeBatch.mockResolvedValue(undefined);
    render(<DiscountCodeBatchesPanel eventId="event-1" onCodesGenerated={vi.fn()} />);

    expect(await screen.findByText('Sponsor Acme')).toBeInTheDocument();
    expect(screen.getByText(/20 kodów, użyto 3/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pobierz CSV partii Sponsor Acme' }));

    expect(api.exportDiscountCodeBatch).toHaveBeenCalledWith('event-1', 'b-old');
  });

  it('generates a batch from the dialog and hands the new codes to the editor', async () => {
    const user = userEvent.setup();
    const onCodesGenerated = vi.fn();
    api.createDiscountCodeBatch.mockResolvedValue({ success: true, data: generated });
    render(<DiscountCodeBatchesPanel eventId="event-1" onCodesGenerated={onCodesGenerated} />);

    await user.click(screen.getByRole('button', { name: /Generuj partię/i }));
    await user.type(screen.getByLabelText(/Prefiks/i), 'vip');
    const count = screen.getByLabelText(/Liczba kodów/i);
    await user.clear(count);
    await user.type(count, '2');
    const maxUses = screen.getByLabelText(/Limit użyć na kod/i);
    await user.clear(maxUses);
    await user.type(maxUses, '2');
    await user.click(screen.getByRole('button', { name: 'Generuj kody' }));

    await waitFor(() => expect(api.createDiscountCodeBatch).toHaveBeenCalledTimes(1));
    expect(api.createDiscountCodeBatch).toHaveBeenCalledWith('event-1', {
      prefix: 'VIP',
      count: 2,
      discountType: 'percent',
      discountValue: 10,
      maxUses: 2,
    });
    await waitFor(() => expect(onCodesGenerated).toHaveBeenCalledTimes(1));
    expect(onCodesGenerated.mock.calls[0][0]).toHaveLength(2);
    await waitFor(() => expect(api.getDiscountCodeBatches).toHaveBeenCalledTimes(2));
  });

  it('blocks an out-of-range count without calling the API', async () => {
    const user = userEvent.setup();
    render(<DiscountCodeBatchesPanel eventId="event-1" onCodesGenerated={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Generuj partię/i }));
    const count = screen.getByLabelText(/Liczba kodów/i);
    await user.clear(count);
    await user.type(count, '1001');
    await user.click(screen.getByRole('button', { name: 'Generuj kody' }));

    expect(api.createDiscountCodeBatch).not.toHaveBeenCalled();
  });

  it('blocks a percent value above 100 and an invalid prefix', async () => {
    const user = userEvent.setup();
    render(<DiscountCodeBatchesPanel eventId="event-1" onCodesGenerated={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Generuj partię/i }));
    const value = screen.getByLabelText(/^Wartość/i);
    await user.clear(value);
    await user.type(value, '101');
    await user.click(screen.getByRole('button', { name: 'Generuj kody' }));
    await user.clear(value);
    await user.type(value, '10');
    await user.type(screen.getByLabelText(/Prefiks/i), 'a b!');
    await user.click(screen.getByRole('button', { name: 'Generuj kody' }));

    expect(api.createDiscountCodeBatch).not.toHaveBeenCalled();
  });

  it('maps a generated batch to editor rows carrying server ids and the batch id', () => {
    expect(batchToDiscountCodes(generated)).toEqual([
      expect.objectContaining({
        id: 'c1',
        code: 'VIP-AAAAAAAA',
        discountType: 'fixed',
        discountValue: 25.5,
        maxUses: 2,
        validFrom: '2026-05-01',
        validTo: undefined,
        usedCount: 0,
        active: true,
        batchId: 'b-new',
      }),
      expect.objectContaining({ id: 'c2', code: 'VIP-BBBBBBBB' }),
    ]);
  });
});
