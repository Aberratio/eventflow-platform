import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpAdapter } from '../http.adapter';

function mockJsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

const lastCall = () => {
  const [url, init] = vi.mocked(fetch).mock.calls[0];
  return { url: String(url), init: (init ?? {}) as RequestInit };
};

/** R-01 (zakres P2): the Event Team routes. */
describe('httpAdapter event team (R-01)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the roster with GET /events/{id}/team', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse({ success: true, data: { owner: null, members: [] } }),
    );

    await httpAdapter.getEventTeam('e 1');

    const { url, init } = lastCall();
    expect(url).toMatch(/\/events\/e%201\/team$/);
    expect(init.method).toBeUndefined();
  });

  it('invites by e-mail with POST /events/{id}/team/invitations', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse({ success: true, data: { id: 'm1', status: 'invited' } }, 201),
    );

    await httpAdapter.inviteEventTeamMember('e1', 'ola@example.com');

    const { url, init } = lastCall();
    expect(url).toMatch(/\/events\/e1\/team\/invitations$/);
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({ email: 'ola@example.com' });
  });

  it('resends with POST /events/{id}/team/{memberId}/resend', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse({ success: true, data: {} }));

    await httpAdapter.resendEventTeamInvitation('e1', 'm1');

    const { url, init } = lastCall();
    expect(url).toMatch(/\/events\/e1\/team\/m1\/resend$/);
    expect(init.method).toBe('POST');
  });

  it('revokes with DELETE /events/{id}/team/{memberId}', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse({ success: true, data: {} }));

    await httpAdapter.revokeEventTeamMember('e1', 'm1');

    const { url, init } = lastCall();
    expect(url).toMatch(/\/events\/e1\/team\/m1$/);
    expect(init.method).toBe('DELETE');
  });

  it('previews an invitation with the public GET /team-invitations/{token}', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse({ success: true, data: {} }));

    await httpAdapter.getTeamInvitation('abc');

    const { url, init } = lastCall();
    expect(url).toMatch(/\/team-invitations\/abc$/);
    expect(init.method).toBeUndefined();
  });

  it('accepts with POST /team-invitations/{token}/accept', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse({ success: true, data: {} }));

    await httpAdapter.acceptTeamInvitation('abc');

    const { url, init } = lastCall();
    expect(url).toMatch(/\/team-invitations\/abc\/accept$/);
    expect(init.method).toBe('POST');
  });

  it.each([
    [
      403,
      'invitation_email_mismatch',
      'To zaproszenie wysłano na inny adres e-mail. Zaloguj się na właściwe konto.',
    ],
    [410, 'invitation_expired', 'To zaproszenie wygasło. Poproś organizatora o nowe.'],
    [404, 'invitation_not_found', 'To zaproszenie nie istnieje albo zostało odwołane.'],
  ])('maps %s %s to a Polish message and keeps the code', async (status, code, message) => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse({ success: false, error: { code, message: 'server text' } }, status),
    );

    await expect(httpAdapter.acceptTeamInvitation('abc')).rejects.toMatchObject({
      code,
      status,
      message,
    });
  });

  it('keeps the code and status of a refused invitation (owner already in the team)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse(
        {
          success: false,
          error: { code: 'team_member_owner', message: 'Właściciel jest już w zespole.' },
        },
        409,
      ),
    );

    await expect(httpAdapter.inviteEventTeamMember('e1', 'o@example.com')).rejects.toMatchObject({
      code: 'team_member_owner',
      status: 409,
    });
  });
});
