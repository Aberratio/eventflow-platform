import { describe, it, expect } from 'vitest';
import { simulateDelay } from '../client';

describe('api/client', () => {
  describe('simulateDelay', () => {
    it('returns a promise that resolves', async () => {
      const result = await simulateDelay();
      expect(result).toBeUndefined();
    });

    it('delays between 150-300ms', async () => {
      const start = Date.now();
      await simulateDelay();
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(140); // small tolerance
      expect(elapsed).toBeLessThan(400);
    });
  });
});
