import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input', () => {
  it('renders with placeholder', () => {
    render(<Input placeholder="Email" />);
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Name" />);
    const input = screen.getByPlaceholderText('Name');
    await user.type(input, 'Jan Kowalski');
    expect(input).toHaveValue('Jan Kowalski');
  });

  it('is disabled when disabled prop passed', () => {
    render(<Input disabled placeholder="Disabled" />);
    expect(screen.getByPlaceholderText('Disabled')).toBeDisabled();
  });

  it('supports type attribute', () => {
    render(<Input type="password" placeholder="Pass" />);
    expect(screen.getByPlaceholderText('Pass')).toHaveAttribute('type', 'password');
  });
});
