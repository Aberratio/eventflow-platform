import { describe, expect, it } from 'vitest';
import { isEmbedPathname } from '../embedRoutes';

describe('isEmbedPathname', () => {
  it.each([
    '/embed/event/ev-1/register',
    '/events/maraton-2026/embed',
    '/events/maraton-2026/embed/',
  ])('treats %s as an embed route (no app chrome)', (path) =>
    expect(isEmbedPathname(path)).toBe(true),
  );

  it.each([
    '/',
    '/events/maraton-2026',
    '/events/maraton-2026/register',
    '/events/embed',
    '/embedded',
  ])('treats %s as a regular route', (path) => expect(isEmbedPathname(path)).toBe(false));
});
