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
