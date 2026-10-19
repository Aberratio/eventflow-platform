import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TextSection } from '../TextSection';
import { InfoPageSection } from '@/types';

const makeSection = (content: string): InfoPageSection =>
  ({
    id: 's1',
    type: 'text',
    title: 'Sekcja',
    content,
  }) as unknown as InfoPageSection;

describe('TextSection', () => {
  it('renders **bold** as strong and bullet lines as list items', () => {
    const { container } = render(
      <TextSection section={makeSection('**Pogrubione**\n- punkt jeden\n- punkt dwa')} />,
    );
    expect(container.querySelector('strong')?.textContent).toBe('Pogrubione');
    expect(container.querySelectorAll('li').length).toBe(2);
  });

  it('renders raw HTML in paragraph as text', () => {
    const { container } = render(
      <TextSection section={makeSection('<img src=x onerror=alert(1)>')} />,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeTruthy();
  });

  it('renders raw HTML inside list items as text', () => {
    const { container } = render(
      <TextSection section={makeSection('- <script>alert(1)</script>')} />,
    );
    expect(container.querySelector('script')).toBeNull();
  });

  it('does not turn markdown links into anchors', () => {
    const { container } = render(<TextSection section={makeSection('[x](javascript:alert(1))')} />);
    expect(container.querySelector('a')).toBeNull();
    expect(screen.getByText('[x](javascript:alert(1))')).toBeTruthy();
  });

  it('does not execute HTML inside bold', () => {
    const { container } = render(
      <TextSection section={makeSection('**<img src=x onerror=alert(1)>**')} />,
    );
    const strong = container.querySelector('strong');
    expect(strong).not.toBeNull();
    expect(strong?.querySelector('img')).toBeNull();
    expect(strong?.textContent).toBe('<img src=x onerror=alert(1)>');
  });
});

describe('TextSection html format (B-08)', () => {
  const htmlSection = (content: string) =>
    ({ id: 's1', type: 'text', format: 'html', title: '', content }) as unknown as InfoPageSection;

  it('renders sanitized HTML: keeps formatting, strips script, handlers and javascript: links', () => {
    const { container } = render(
      <TextSection
        section={htmlSection(
          '<h2 onclick="x()">Tytuł</h2><p>A <strong>b</strong><script>alert(1)</script><a href="javascript:alert(2)">zły</a></p><ul><li>x</li></ul>',
        )}
      />,
    );
    expect(container.querySelector('h2')?.textContent).toBe('Tytuł');
    expect(container.querySelector('strong')?.textContent).toBe('b');
    expect(container.querySelectorAll('li').length).toBe(1);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('[onclick]')).toBeNull();
    expect(container.querySelector('a')?.getAttribute('href') ?? null).toBeNull();
  });

  it('keeps rendering format "text" and missing format as before', () => {
    const { container } = render(
      <TextSection
        section={{ ...htmlSection('**x**'), format: 'text' } as unknown as InfoPageSection}
      />,
    );
    expect(container.querySelector('strong')?.textContent).toBe('x');
    expect(container.querySelector('p')?.textContent).toBe('x');
  });
});
