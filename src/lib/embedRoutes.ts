/**
 * Routes rendered in an iframe on an external site —
 * `/embed/*` and `/events/:slug/embed`. Without app navigation, onboarding,
 * cookie banner and DevToolbox.
 */
export const isEmbedPathname = (pathname: string): boolean =>
  pathname.startsWith('/embed/') || /^\/events\/[^/]+\/embed\/?$/.test(pathname);
