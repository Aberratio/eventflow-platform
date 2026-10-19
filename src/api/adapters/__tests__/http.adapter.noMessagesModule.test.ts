import { describe, expect, it } from 'vitest';
import { httpAdapter } from '../http.adapter';

/** R-11: the write side and single-message read of the messages module are not in the contract. */
describe('httpAdapter dead messages module (R-11)', () => {
  it.each(['getMessage', 'sendMessage', 'markAsRead'])('does not expose %s', (name) => {
    expect(httpAdapter).not.toHaveProperty(name);
  });
});
