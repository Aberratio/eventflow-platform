import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpAdapter } from '../http.adapter';

function mockJsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

/** The contract for the relay member swap and the roster the captain picks from. */
describe('httpAdapter team member swap', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the roster of a team', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse({ success: true, data: [] }));

    await httpAdapter.getTeamMembers('t 1');

    expect(String(vi.mocked(fetch).mock.calls[0][0])).toMatch(/\/teams\/t%201\/members$/);
  });

  it('POSTs the new person to the swap route', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse({ success: true, data: { id: 'r1', teamId: 't1' } }),
    );

    await httpAdapter.swapTeamMember('t1', 'r1', {
      newPerson: { firstName: 'Ola', lastName: 'Nowak' },
    });

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toMatch(/\/teams\/t1\/members\/r1\/swap$/);
    expect(init).toMatchObject({ method: 'POST' });
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({
      newPerson: { firstName: 'Ola', lastName: 'Nowak' },
    });
  });

  it('surfaces the deadline refusal with its error code', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse(
        {
          success: false,
          error: { code: 'team_swap_deadline_passed', message: 'Termin wymiany minął.' },
        },
        409,
      ),
    );

    await expect(
      httpAdapter.swapTeamMember('t1', 'r1', { competitorId: 'c1' }),
    ).rejects.toMatchObject({ code: 'team_swap_deadline_passed', status: 409 });
  });
});
