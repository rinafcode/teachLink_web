/**
 * visualRegression.test.ts
 *
 * Visual regression tests: snapshot diffing, CSS class assertions,
 * responsive layout checks, theme switching, and style-property validation.
 *
 * These tests are framework-agnostic and run entirely in Vitest + jsdom.
 * For pixel-level screenshot diffing, pair with Playwright / Storybook.
 */

import React, { FC, CSSProperties } from 'react';
import { describe, it, expect, vi, } from 'vitest';
import { render, screen } from '@testing-library/react';
import { simulateResize } from '../utils/testUtils';

//  Stub design-system components 

type ThemeMode = 'light' | 'dark';

const TOKENS: Record<ThemeMode, Record<string, string>> = {
  light: { '--bg': '#ffffff', '--fg': '#111111', '--accent': '#0066cc' },
  dark:  { '--bg': '#1a1a1a', '--fg': '#f0f0f0', '--accent': '#4dabf7' },
};

interface ThemeWrapperProps {
  mode: ThemeMode;
  children: React.ReactNode;
}

const ThemeWrapper: FC<ThemeWrapperProps> = ({ mode, children }) => (
  <div
    data-testid="theme-wrapper"
    data-theme={mode}
    style={TOKENS[mode] as CSSProperties}
    className={`theme-${mode}`}
  >
    {children}
  </div>
);

interface CardProps {
  title: string;
  description: string;
  variant?: 'default' | 'featured' | 'compact';
  imageUrl?: string;
}

const Card: FC<CardProps> = ({ title, description, variant = 'default', imageUrl }) => (
  <article
    data-testid="card"
    className={`card card--${variant}`}
    role="article"
    aria-label={title}
  >
    {imageUrl && <img src={imageUrl} alt={title} data-testid="card-image" />}
    <h2 data-testid="card-title">{title}</h2>
    <p data-testid="card-desc">{description}</p>
  </article>
);

interface BadgeProps {
  label: string;
  color?: 'green' | 'red' | 'yellow' | 'blue';
}

const Badge: FC<BadgeProps> = ({ label, color = 'blue' }) => (
  <span
    data-testid="badge"
    className={`badge badge--${color}`}
    style={{ backgroundColor: `var(--badge-${color})` }}
  >
    {label}
  </span>
);

interface ResponsiveNavProps { links: string[]; }

const ResponsiveNav: FC<ResponsiveNavProps> = ({ links }) => (
  <nav data-testid="nav" className="nav">
    <ul>
      {links.map(link => (
        <li key={link} data-testid="nav-item"><a href={`#${link}`}>{link}</a></li>
      ))}
    </ul>
  </nav>
);

// Snapshot tests

describe('VisualRegression – Snapshots', () => {
  it('Card (default variant) matches snapshot', () => {
    const { container } = render(
      <Card title="Hello World" description="A test card" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('Card (featured variant) matches snapshot', () => {
    const { container } = render(
      <Card title="Featured" description="Featured card" variant="featured" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('Card (compact variant) matches snapshot', () => {
    const { container } = render(
      <Card title="Compact" description="Compact card" variant="compact" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('Badge matches snapshot for each color', () => {
    (['green', 'red', 'yellow', 'blue'] as const).forEach(color => {
      const { container } = render(<Badge label={color.toUpperCase()} color={color} />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  it('ThemeWrapper light mode matches snapshot', () => {
    const { container } = render(
      <ThemeWrapper mode="light"><span>Content</span></ThemeWrapper>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('ThemeWrapper dark mode matches snapshot', () => {
    const { container } = render(
      <ThemeWrapper mode="dark"><span>Content</span></ThemeWrapper>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

// CSS class assertions

describe('VisualRegression – CSS class assertions', () => {
  it('Card applies correct variant class', () => {
    render(<Card title="T" description="D" variant="featured" />);
    expect(screen.getByTestId('card')).toHaveClass('card--featured');
  });

  it('Card always has base "card" class', () => {
    render(<Card title="T" description="D" />);
    expect(screen.getByTestId('card')).toHaveClass('card');
  });

  it('Badge applies correct color class', () => {
    render(<Badge label="OK" color="green" />);
    expect(screen.getByTestId('badge')).toHaveClass('badge--green');
  });

  it('ThemeWrapper has correct theme class', () => {
    render(<ThemeWrapper mode="dark"><span /></ThemeWrapper>);
    expect(screen.getByTestId('theme-wrapper')).toHaveClass('theme-dark');
  });

  it('ThemeWrapper exposes data-theme attribute', () => {
    render(<ThemeWrapper mode="light"><span /></ThemeWrapper>);
    expect(screen.getByTestId('theme-wrapper')).toHaveAttribute('data-theme', 'light');
  });
});

// Accessibility attributes 

describe('VisualRegression – ARIA & semantic structure', () => {
  it('Card has role="article"', () => {
    render(<Card title="A11y card" description="desc" />);
    expect(screen.getByRole('article', { name: 'A11y card' })).toBeInTheDocument();
  });

  it('Card title is rendered as h2', () => {
    render(<Card title="Title" description="desc" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Title' })).toBeInTheDocument();
  });

  it('Card image has an alt attribute matching the title', () => {
    render(<Card title="Alt test" description="d" imageUrl="/img.png" />);
    expect(screen.getByRole('img', { name: 'Alt test' })).toBeInTheDocument();
  });

  it('ResponsiveNav renders all links', () => {
    render(<ResponsiveNav links={['Home', 'About', 'Contact']} />);
    expect(screen.getAllByTestId('nav-item')).toHaveLength(3);
  });
});

// Theme switching

describe('VisualRegression – Theme switching', () => {
  it('swaps CSS variable values between light and dark', () => {
    const { rerender, getByTestId } = render(
      <ThemeWrapper mode="light"><span /></ThemeWrapper>
    );
    const wrapper = getByTestId('theme-wrapper') as HTMLElement;
    expect(wrapper.style.getPropertyValue('--bg')).toBe('#ffffff');

    rerender(<ThemeWrapper mode="dark"><span /></ThemeWrapper>);
    expect(wrapper.style.getPropertyValue('--bg')).toBe('#1a1a1a');
  });

  it('accent colour differs between themes', () => {
    const { rerender, getByTestId } = render(
      <ThemeWrapper mode="light"><span /></ThemeWrapper>
    );
    const wrapper = getByTestId('theme-wrapper') as HTMLElement;
    const lightAccent = wrapper.style.getPropertyValue('--accent');
    rerender(<ThemeWrapper mode="dark"><span /></ThemeWrapper>);
    const darkAccent = wrapper.style.getPropertyValue('--accent');
    expect(lightAccent).not.toBe(darkAccent);
  });
});

// Responsive behaviour

describe('VisualRegression – Responsive layout', () => {
  it('fires resize event when viewport changes', () => {
    const listener = vi.fn();
    window.addEventListener('resize', listener);
    simulateResize(375, 812); // iPhone viewport
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener('resize', listener);
  });

  it('reports correct innerWidth after resize', () => {
    simulateResize(1440, 900);
    expect(window.innerWidth).toBe(1440);
    expect(window.innerHeight).toBe(900);
  });

  it('reports mobile viewport after resize', () => {
    simulateResize(390, 844);
    expect(window.innerWidth).toBeLessThan(768);
  });
});

//  Style-property validation 

describe('VisualRegression – Inline style validation', () => {
  it('Badge style references a CSS variable', () => {
    render(<Badge label="Test" color="red" />);
    const badge = screen.getByTestId('badge') as HTMLElement;
    expect(badge.style.backgroundColor).toContain('--badge-red');
  });

  it('ThemeWrapper sets all expected CSS variables', () => {
    render(<ThemeWrapper mode="light"><span /></ThemeWrapper>);
    const el = screen.getByTestId('theme-wrapper') as HTMLElement;
    expect(el.style.getPropertyValue('--bg')).toBeTruthy();
    expect(el.style.getPropertyValue('--fg')).toBeTruthy();
    expect(el.style.getPropertyValue('--accent')).toBeTruthy();
  });
});