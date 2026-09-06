import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { PublicationStatusBadge } from '../PublicationStatusBadge';

describe('PublicationStatusBadge', () => {
  it('renders "Wstępne" for preliminary results', () => {
    render(<PublicationStatusBadge status="preliminary" />);
    expect(screen.getByText('Wstępne')).toBeInTheDocument();
  });

  it('renders "Oficjalne" for official results', () => {
    render(<PublicationStatusBadge status="official" />);
    expect(screen.getByText('Oficjalne')).toBeInTheDocument();
  });
});
