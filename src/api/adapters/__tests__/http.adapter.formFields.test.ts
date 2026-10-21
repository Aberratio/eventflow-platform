import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpAdapter } from '../http.adapter';

const BASE = 'http://localhost:8081/api/v1';

function mockJsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

const lastCall = () => {
  const [url, init] = vi.mocked(fetch).mock.calls.at(-1) as [string, RequestInit];
  return { url, init, body: init.body ? JSON.parse(init.body as string) : undefined };
};

describe('httpAdapter form-field routes', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the public and the manage lists from their own routes', async () => {
    vi.mocked(fetch).mockResolvedValue(mockJsonResponse({ success: true, data: [] }));
    await httpAdapter.getPublicFormFields('e 1');
    expect(lastCall().url).toBe(`${BASE}/events/e%201/form-fields/public`);
    await httpAdapter.getFormFields('e1');
    expect(lastCall().url).toBe(`${BASE}/events/e1/form-fields`);
  });

  it('creates a custom field with options and signed prices', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockJsonResponse({ success: true, data: { id: 'f1' } }, 201),
    );
    await httpAdapter.createFormField('e1', {
      fieldType: 'single_choice',
      label: 'Posiłek',
      options: [
        { label: 'Wegetariański', price: 5 },
        { label: 'Bez losowania', price: -5 },
      ],
      isConfidential: false,
    });
    const call = lastCall();
    expect(call.url).toBe(`${BASE}/events/e1/form-fields`);
    expect(call.init.method).toBe('POST');
    expect(call.body.options[1]).toEqual({ label: 'Bez losowania', price: -5 });
  });

  it('PATCHes only the given properties', async () => {
    vi.mocked(fetch).mockResolvedValue(mockJsonResponse({ success: true, data: { id: 'f1' } }));
    await httpAdapter.updateFormField('e1', 'f1', { state: 'required' });
    const call = lastCall();
    expect(call.url).toBe(`${BASE}/events/e1/form-fields/f1`);
    expect(call.init.method).toBe('PATCH');
    expect(call.body).toEqual({ state: 'required' });
  });

  it('PATCHes a changed type and variants with their keys and signed prices', async () => {
    vi.mocked(fetch).mockResolvedValue(mockJsonResponse({ success: true, data: { id: 'f1' } }));
    await httpAdapter.updateFormField('e1', 'f1', {
      fieldType: 'multi_choice',
      options: [
        { key: 'm', label: 'M', price: -5 },
        { label: 'XL', price: 3 },
      ],
    });
    const call = lastCall();
    expect(call.init.method).toBe('PATCH');
    expect(call.body).toEqual({
      fieldType: 'multi_choice',
      options: [
        { key: 'm', label: 'M', price: -5 },
        { label: 'XL', price: 3 },
      ],
    });
  });

  it('surfaces the 409 code of a type / variant edit that would orphan answers', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockJsonResponse(
        {
          success: false,
          error: { code: 'form_field_has_answers', message: 'Pole ma już odpowiedzi.' },
        },
        409,
      ),
    );
    await expect(
      httpAdapter.updateFormField('e1', 'f1', { fieldType: 'short_text' }),
    ).rejects.toMatchObject({ code: 'form_field_has_answers', status: 409 });
  });

  it('DELETEs a field and PUTs the reorder list as orderedIds', async () => {
    vi.mocked(fetch).mockResolvedValue(mockJsonResponse({ success: true, data: {} }));
    await httpAdapter.deleteFormField('e1', 'f1');
    expect(lastCall().init.method).toBe('DELETE');
    await httpAdapter.reorderFormFields('e1', ['b', 'a']);
    const call = lastCall();
    expect(call.url).toBe(`${BASE}/events/e1/form-fields/reorder`);
    expect(call.init.method).toBe('PUT');
    expect(call.body).toEqual({ orderedIds: ['b', 'a'] });
  });

  it('PUTs an answer as { value } on the registration', async () => {
    vi.mocked(fetch).mockResolvedValue(mockJsonResponse({ success: true, data: { id: 'a1' } }));
    await httpAdapter.saveFormFieldAnswer('r1', 'f1', ['x', 'y']);
    const call = lastCall();
    expect(call.url).toBe(`${BASE}/registrations/r1/form-field-answers/f1`);
    expect(call.init.method).toBe('PUT');
    expect(call.body).toEqual({ value: ['x', 'y'] });
  });

  it('keeps the field-specific 422 text instead of the generic validation copy', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockJsonResponse(
        { success: false, error: { code: 'validation_error', message: 'To pole jest wymagane.' } },
        422,
      ),
    );
    await expect(httpAdapter.saveFormFieldAnswer('r1', 'f1', '')).rejects.toMatchObject({
      message: 'To pole jest wymagane.',
      status: 422,
    });
  });
});

describe('httpAdapter per-distance form routes', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks the public form for one distance via ?distanceId=', async () => {
    vi.mocked(fetch).mockResolvedValue(mockJsonResponse({ success: true, data: [] }));
    await httpAdapter.getPublicFormFields('e1', 'd 1');
    expect(lastCall().url).toBe(`${BASE}/events/e1/form-fields/public?distanceId=d%201`);
    await httpAdapter.getPublicFormFields('e1');
    expect(lastCall().url).toBe(`${BASE}/events/e1/form-fields/public`);
  });

  it('reads, extends, overrides and resets the distance form on the distance routes', async () => {
    vi.mocked(fetch).mockResolvedValue(mockJsonResponse({ success: true, data: [] }));
    await httpAdapter.getDistanceFormFields('e1', 'd1');
    expect(lastCall().url).toBe(`${BASE}/events/e1/distances/d1/form-fields`);

    await httpAdapter.createDistanceFormField('e1', 'd1', { fieldType: 'short_text', label: 'X' });
    expect(lastCall().url).toBe(`${BASE}/events/e1/distances/d1/form-fields`);
    expect(lastCall().init.method).toBe('POST');
    expect(lastCall().body).toEqual({ fieldType: 'short_text', label: 'X' });

    await httpAdapter.overrideFormField('e1', 'd1', 'f1');
    expect(lastCall().url).toBe(`${BASE}/events/e1/distances/d1/form-fields/f1/override`);
    expect(lastCall().init.method).toBe('POST');

    await httpAdapter.resetFormFieldOverride('e1', 'd1', 'f1');
    expect(lastCall().url).toBe(`${BASE}/events/e1/distances/d1/form-fields/f1/override`);
    expect(lastCall().init.method).toBe('DELETE');
  });
});
