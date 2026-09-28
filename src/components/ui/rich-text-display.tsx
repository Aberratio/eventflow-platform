import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitizeHtml';

interface RichTextDisplayProps {
  html: string;
  className?: string;
}

export const RichTextDisplay = ({ html, className }: RichTextDisplayProps) => {
  const safeHtml = useMemo(() => sanitizeHtml(html), [html]);

  if (!safeHtml || safeHtml === '<p></p>') return null;

  return (
    <div
      className={cn(
        'rich-text-content prose prose-sm dark:prose-invert max-w-none',
        // Links
        '[&_a]:text-primary [&_a]:underline hover:[&_a]:no-underline',
        // Lists
        '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5',
        '[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5',
        '[&_li]:my-0.5',
        // Headings
        '[&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold',
        '[&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold',
        // Paragraphs
        '[&_p]:my-1',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
};
