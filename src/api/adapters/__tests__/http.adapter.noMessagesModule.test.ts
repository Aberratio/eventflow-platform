import { describe, expect, it } from 'vitest';
import { httpAdapter } from '../http.adapter';

/** The messages module (list, single read, write) is not in the contract. */
describe('httpAdapter dead messages module', () => {
  it.each(['getMessages', 'getMessage', 'sendMessage', 'markAsRead'])('does not expose %s', (name) => {
    expect(httpAdapter).not.toHaveProperty(name);
  });
});
