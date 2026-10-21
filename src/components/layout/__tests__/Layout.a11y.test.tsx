import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorPageShell } from '@/components/ui/error-page-shell';
import { Layout } from '../Layout';

vi.mock('../Header', () => ({ Header: () => <header>Header</header> }));
vi.mock('../Footer', () => ({ Footer: () => <footer>Footer</footer> }));

describe('Layout a11y (WCAG 2.4.1, 1.3.1)', () => {
  it('has exactly one main landmark and it is the skip-link target', () => {
    render(
      <Layout>
        <h1>Treść</h1>
      </Layout>,
    );
    const mains = screen.getAllByRole('main');
    expect(mains).toHaveLength(1);
    const skip = screen.getByRole('link', { name: 'Przejdź do treści' });
    expect(skip).toHaveAttribute('href', `#${mains[0].id}`);
  });

  it('skip link is the first focusable element', () => {
    render(<Layout>x</Layout>);
    expect(screen.getAllByRole('link')[0]).toHaveTextContent('Przejdź do treści');
  });

  it('error pages expose a main landmark', () => {
    render(
      <ErrorPageShell>
        <h1>404</h1>
      </ErrorPageShell>,
    );
    expect(screen.getAllByRole('main')).toHaveLength(1);
  });
});
