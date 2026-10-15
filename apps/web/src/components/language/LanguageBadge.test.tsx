import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LanguageBadge } from './LanguageBadge';

describe('LanguageBadge Component', () => {
  it('renders standard language name by default', () => {
    render(<LanguageBadge languageIdOrCode="en" showName={true} />);
    expect(screen.getByText(/English/i)).toBeDefined();
  });

  it('renders native name when showNativeName is true', () => {
    render(<LanguageBadge languageIdOrCode="ja" showNativeName={true} />);
    expect(screen.getByText('日本語')).toBeDefined();
  });

  it('renders without text when showName is false', () => {
    const { container } = render(<LanguageBadge languageIdOrCode="de" showName={false} />);
    expect(container.querySelector('span.truncate')).toBeNull();
  });

  it('applies correct size classes for sm and lg', () => {
    const { container: smContainer } = render(<LanguageBadge languageIdOrCode="en" size="sm" />);
    expect(smContainer.firstChild).toHaveClass('text-xs');

    const { container: lgContainer } = render(<LanguageBadge languageIdOrCode="en" size="lg" />);
    expect(lgContainer.firstChild).toHaveClass('text-base');
  });
});
