import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { PageHero, PageHeroTitle } from '../page-hero';
import { SectionHeading } from '../section-heading';
import { StatPill } from '../stat-pill';
import { GradientDivider } from '../gradient-divider';
import { Eyebrow } from '../eyebrow';
import { InfoBanner } from '../info-banner';
import { PageSection } from '../page-section';
import { ErrorPageShell } from '../error-page-shell';
import { EmptyState } from '../empty-state';

describe('Design System Components', () => {
  describe('PageHero', () => {
    it('renders children inside a container', () => {
      render(<PageHero><span>Hero content</span></PageHero>);
      expect(screen.getByText('Hero content')).toBeInTheDocument();
    });

    it('renders border-b by default', () => {
      const { container } = render(<PageHero>Test</PageHero>);
      expect(container.firstChild).toHaveClass('border-b');
    });

    it('removes border when borderless', () => {
      const { container } = render(<PageHero borderless>Test</PageHero>);
      expect(container.firstChild).not.toHaveClass('border-b');
    });

    it('renders glow overlay when glow=true', () => {
      const { container } = render(<PageHero glow>Test</PageHero>);
      // The glow div is the first child inside the root
      const glowDiv = (container.firstChild as HTMLElement)?.querySelector('div:first-child');
      expect(glowDiv).toBeInTheDocument();
    });
  });

  describe('PageHeroTitle', () => {
    it('renders title and subtitle', () => {
      render(<PageHeroTitle title="My Title" subtitle="My subtitle" />);
      expect(screen.getByText('My Title')).toBeInTheDocument();
      expect(screen.getByText('My subtitle')).toBeInTheDocument();
    });

    it('renders icon when provided', () => {
      render(<PageHeroTitle icon={<span data-testid="icon">★</span>} title="Test" />);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('renders without subtitle', () => {
      render(<PageHeroTitle title="Only Title" />);
      expect(screen.getByText('Only Title')).toBeInTheDocument();
    });
  });

  describe('SectionHeading', () => {
    it('renders title and subtitle', () => {
      render(<SectionHeading title="Section" subtitle="Description" />);
      expect(screen.getByText('Section')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('renders action slot', () => {
      render(<SectionHeading title="Test" action={<button>Action</button>} />);
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('renders badge slot', () => {
      render(<SectionHeading title="Test" badge={<span>Badge</span>} />);
      expect(screen.getByText('Badge')).toBeInTheDocument();
    });
  });

  describe('StatPill', () => {
    it('renders label', () => {
      render(<StatPill label="5 aktywnych" />);
      expect(screen.getByText('5 aktywnych')).toBeInTheDocument();
    });

    it('renders icon', () => {
      render(<StatPill icon={<span data-testid="icon">🔥</span>} label="test" />);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  describe('GradientDivider', () => {
    it('renders with h-1 by default', () => {
      const { container } = render(<GradientDivider />);
      expect(container.firstChild).toHaveClass('h-1');
    });

    it('renders with h-0.5 when size=sm', () => {
      const { container } = render(<GradientDivider size="sm" />);
      expect(container.firstChild).toHaveClass('h-0.5');
    });
  });

  describe('Eyebrow', () => {
    it('renders children', () => {
      render(<Eyebrow>Label</Eyebrow>);
      expect(screen.getByText('Label')).toBeInTheDocument();
    });

    it('renders icon', () => {
      render(<Eyebrow icon={<span data-testid="icon">📄</span>}>Info</Eyebrow>);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  describe('InfoBanner', () => {
    it('renders children', () => {
      render(<InfoBanner>Alert text</InfoBanner>);
      expect(screen.getByText('Alert text')).toBeInTheDocument();
    });

    it('renders icon', () => {
      render(<InfoBanner icon={<span data-testid="icon">ℹ️</span>}>Text</InfoBanner>);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  describe('PageSection', () => {
    it('renders children inside container', () => {
      render(<PageSection>Content</PageSection>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('applies muted background when muted', () => {
      const { container } = render(<PageSection muted>Test</PageSection>);
      expect(container.firstChild).toHaveClass('bg-muted/40');
    });

    it('applies compact padding when compact', () => {
      const { container } = render(<PageSection compact>Test</PageSection>);
      expect(container.firstChild).toHaveClass('py-6');
    });
  });
});
