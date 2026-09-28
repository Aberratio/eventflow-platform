import type { ReactNode } from 'react';

/** Renders the CMS inline subset (**bold** only). Everything else is plain text — React escapes it. */
export const renderInlineMarkdown = (text: string): ReactNode[] =>
  text
    .split(/\*\*(.*?)\*\*/g)
    .map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
