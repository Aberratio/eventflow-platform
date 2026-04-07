import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import NavLink from '../NavLink';

describe('NavLink', () => {
  it('renders link text', () => {
    render(<NavLink to="/events">Wydarzenia</NavLink>);
    expect(screen.getByText('Wydarzenia')).toBeInTheDocument();
  });

  it('has correct href', () => {
    render(<NavLink to="/series">Serie</NavLink>);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/series');
  });
});
