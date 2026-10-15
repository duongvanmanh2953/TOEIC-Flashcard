import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminButton } from './AdminButton';

describe('AdminButton Component Suite', () => {
  it('renders children correctly', () => {
    render(<AdminButton>Save Changes</AdminButton>);
    expect(screen.getByRole('button', { name: /save changes/i })).toBeDefined();
  });

  it('handles click events when enabled', () => {
    const handleClick = vi.fn();
    render(<AdminButton onClick={handleClick}>Click Me</AdminButton>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button and displays loader when loading=true', () => {
    const handleClick = vi.fn();
    render(
      <AdminButton loading onClick={handleClick}>
        Loading Action
      </AdminButton>
    );
    const button = screen.getByRole('button');
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.className).toContain('cursor-not-allowed');
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders custom icon at left and right positions', () => {
    const TestIcon = <span data-testid="admin-icon">⚡</span>;
    const { rerender } = render(
      <AdminButton icon={TestIcon} iconPosition="left">
        With Icon
      </AdminButton>
    );
    expect(screen.getByTestId('admin-icon')).toBeDefined();

    rerender(
      <AdminButton icon={TestIcon} iconPosition="right">
        With Icon
      </AdminButton>
    );
    expect(screen.getByTestId('admin-icon')).toBeDefined();
  });

  it('applies destructive and primary variant styles properly', () => {
    const { rerender } = render(<AdminButton variant="destructive">Delete</AdminButton>);
    let button = screen.getByRole('button');
    expect(button.className).toContain('bg-rose-600');

    rerender(<AdminButton variant="primary">Confirm</AdminButton>);
    button = screen.getByRole('button');
    expect(button.className).toContain('bg-indigo-600');
  });
});
