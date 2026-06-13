/**
 * API Provider — runtime adapter selection.
 *
 * By default uses the HTTP adapter backed by the application API.
 *
 * Example (main.tsx):
 *   import { setApiAdapter } from '@/api/provider';
 *   import { supabaseAdapter } from '@/api/adapters/supabase';
 *   setApiAdapter(supabaseAdapter);
 */

import type { ApiAdapter } from './contract';

let _adapter: ApiAdapter | null = null;

/** Set the active API adapter. Call once before app renders. */
export function setApiAdapter(adapter: ApiAdapter): void {
  _adapter = adapter;
}

/** Get the active API adapter. Lazy-loads HTTP adapter if none set. */
export async function getAdapter(): Promise<ApiAdapter> {
  if (!_adapter) {
    const { httpAdapter } = await import('./adapters/http.adapter');
    _adapter = httpAdapter;
  }
  return _adapter;
}

/**
 * Synchronous access — only use after adapter is initialized.
 * Throws if called before any API call has resolved.
 */
export function getAdapterSync(): ApiAdapter {
  if (!_adapter) {
    throw new Error(
      'API adapter not initialized. Call setApiAdapter() or await any API function first.',
    );
  }
  return _adapter;
}
