/**
 * Trasy renderowane w iframe na zewnętrznej stronie —
 * `/embed/*` oraz `/events/:slug/embed`. Bez nawigacji aplikacji, onboardingu,
 * banera cookies i DevToolbox.
 */
export const isEmbedPathname = (pathname: string): boolean =>
  pathname.startsWith('/embed/') || /^\/events\/[^/]+\/embed\/?$/.test(pathname);
