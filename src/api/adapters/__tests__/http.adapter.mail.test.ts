import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpAdapter } from '../http.adapter';

function ok(payload: unknown) {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response);
}

const lastCall = () => {
  const [url, init] = vi.mocked(fetch).mock.calls.at(-1) as [string, RequestInit | undefined];
  return { path: url.replace(/^.*\/api\/v1/, ''), init };
};

// The adapter talks to the real server routes (/admin/mail-templates, /events/{id}/mail-templates,
// …/preview, …/mail-log) — NOT to the old /email-templates* that never existed.
describe('httpAdapter mail templates and log', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  it('lists global templates from /admin/mail-templates', async () => {
    ok({ success: true, data: [{ mailType: 'payment_confirmed', overridable: true }] });
    const res = await httpAdapter.getMailTemplates();
    expect(lastCall().path).toBe('/admin/mail-templates');
    expect(res.data[0].mailType).toBe('payment_confirmed');
  });

  it('lists event templates from /events/{id}/mail-templates', async () => {
    ok({ success: true, data: [] });
    await httpAdapter.getMailTemplates('ev 1');
    expect(lastCall().path).toBe('/events/ev%201/mail-templates');
  });

  it('saves a global template with PUT {subject, bodyHtml}', async () => {
    ok({ success: true, data: { mailType: 'payment_confirmed' } });
    await httpAdapter.saveMailTemplate('payment_confirmed', { subject: 'S', bodyHtml: '<p>B</p>' });
    const { path, init } = lastCall();
    expect(path).toBe('/admin/mail-templates/payment_confirmed');
    expect(init?.method).toBe('PUT');
    expect(JSON.parse(String(init?.body))).toEqual({ subject: 'S', bodyHtml: '<p>B</p>' });
  });

  it('saves an event override and reverts it with DELETE', async () => {
    ok({ success: true, data: {} });
    await httpAdapter.saveMailTemplate('payment_confirmed', { subject: 'S', bodyHtml: 'B' }, 'e1');
    expect(lastCall().path).toBe('/events/e1/mail-templates/payment_confirmed');
    expect(lastCall().init?.method).toBe('PUT');

    ok({ success: true, data: { source: 'global' } });
    const res = await httpAdapter.resetMailTemplate('payment_confirmed', 'e1');
    expect(lastCall().path).toBe('/events/e1/mail-templates/payment_confirmed');
    expect(lastCall().init?.method).toBe('DELETE');
    expect(res.data.source).toBe('global');
  });

  it('previews through POST …/preview (global and per event)', async () => {
    ok({ success: true, data: { variables: { eventName: 'X' }, unknownVariables: [] } });
    const res = await httpAdapter.previewMailTemplate('payment_confirmed', { subject: 'Hi' });
    expect(lastCall().path).toBe('/admin/mail-templates/payment_confirmed/preview');
    expect(lastCall().init?.method).toBe('POST');
    expect(JSON.parse(String(lastCall().init?.body))).toEqual({ subject: 'Hi' });
    expect(Object.keys(res.data.variables)).toEqual(['eventName']);

    ok({ success: true, data: {} });
    await httpAdapter.previewMailTemplate('payment_confirmed', {}, 'e1');
    expect(lastCall().path).toBe('/events/e1/mail-templates/payment_confirmed/preview');
  });

  it('reads the paginated mail log with filters (global and per event)', async () => {
    ok({ success: true, data: [{ id: 'm1' }], total: 1, page: 2, pageSize: 10, totalPages: 1 });
    const res = await httpAdapter.getMailLog({
      page: 2,
      pageSize: 10,
      status: 'failed',
      mailType: 'x',
    });
    const { path } = lastCall();
    expect(path.startsWith('/admin/mail-log?')).toBe(true);
    expect(path).toContain('page=2');
    expect(path).toContain('status=failed');
    expect(path).toContain('mailType=x');
    expect(res.total).toBe(1);

    ok({ success: true, data: [], total: 0, page: 1, pageSize: 25, totalPages: 0 });
    await httpAdapter.getMailLog({}, 'e1');
    expect(lastCall().path.startsWith('/events/e1/mail-log')).toBe(true);
  });
});
