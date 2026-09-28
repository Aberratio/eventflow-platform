import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RichTextDisplay } from '../rich-text-display';

const XSS_PAYLOADS = [
  '<img src=x onerror=alert(1)>',
  '<script>alert(1)</script>',
  '<svg onload=alert(1)></svg>',
  '<a href="javascript:alert(1)">x</a>',
  '<a href="data:text/html,alert(1)">x</a>',
];

describe('RichTextDisplay', () => {
  it.each(XSS_PAYLOADS)('does not render XSS payload: %s', (payload) => {
    const { container } = render(<RichTextDisplay html={payload} />);
    const dangerous = container.querySelector(
      'script, img, svg, [onerror], [onload], a[href^="javascript" i], a[href^="data" i]',
    );
    expect(dangerous).toBeNull();
  });

  it('renders TipTap formatting and links', () => {
    const fixture =
      '<h2>Tytuł</h2><p><strong>B</strong> <em>I</em> <u>U</u> <s>S</s></p><ul><li>a</li></ul><ol start="3"><li>b</li></ol><a href="https://example.pl" target="_blank" rel="noopener noreferrer nofollow">link</a>';
    const { container, getByRole } = render(<RichTextDisplay html={fixture} />);
    expect(container.querySelector('strong')).not.toBeNull();
    expect(container.querySelector('em')).not.toBeNull();
    expect(container.querySelector('u')).not.toBeNull();
    expect(container.querySelector('s')).not.toBeNull();
    expect(container.querySelector('h2')).not.toBeNull();
    expect(container.querySelectorAll('ul li').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('ol li').length).toBeGreaterThan(0);

    const link = getByRole('link', { name: 'link' });
    expect(link.getAttribute('href')).toBe('https://example.pl');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('returns null for empty input', () => {
    const { container } = render(<RichTextDisplay html="" />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null for <p></p> input', () => {
    const { container } = render(<RichTextDisplay html="<p></p>" />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null for fully-stripped input', () => {
    const { container } = render(<RichTextDisplay html="<script>x</script>" />);
    expect(container.firstChild).toBeNull();
  });
});
