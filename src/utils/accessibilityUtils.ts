/**
 * Accessibility utility functions for WCAG 2.1 AA compliance
 */

export interface ColorContrastResult {
  ratio: number;
  passes: {
    aa: boolean;
    aaa: boolean;
    aaLarge: boolean;
    aaaLarge: boolean;
  };
}

export interface AccessibilityIssue {
  id: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  type: string;
  element: string;
  message: string;
  wcagCriteria: string[];
  suggestion: string;
}

/**
 * Calculate relative luminance of a color
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Parse hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate contrast ratio between two colors
 */
export function calculateContrastRatio(
  foreground: string,
  background: string
): ColorContrastResult {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  if (!fg || !bg) {
    return {
      ratio: 0,
      passes: { aa: false, aaa: false, aaLarge: false, aaaLarge: false },
    };
  }

  const l1 = getLuminance(fg.r, fg.g, fg.b);
  const l2 = getLuminance(bg.r, bg.g, bg.b);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  return {
    ratio: Math.round(ratio * 100) / 100,
    passes: {
      aa: ratio >= 4.5,
      aaa: ratio >= 7,
      aaLarge: ratio >= 3,
      aaaLarge: ratio >= 4.5,
    },
  };
}

/**
 * Get computed color from element
 */
export function getComputedColor(element: HTMLElement, property: string): string {
  const color = window.getComputedStyle(element).getPropertyValue(property);
  return rgbToHex(color);
}

/**
 * Convert RGB to hex
 */
function rgbToHex(rgb: string): string {
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return '#000000';

  const hex = (x: string) => {
    const val = parseInt(x).toString(16);
    return val.length === 1 ? '0' + val : val;
  };

  return '#' + hex(match[1]) + hex(match[2]) + hex(match[3]);
}

/**
 * Check if element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
  const tabIndex = element.getAttribute('tabindex');

  return (
    focusableTags.includes(element.tagName) ||
    (tabIndex !== null && parseInt(tabIndex) >= 0) ||
    element.hasAttribute('contenteditable')
  );
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable]';
  return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
}

/**
 * Trap focus within a container
 */
export function trapFocus(container: HTMLElement, event: KeyboardEvent): void {
  if (event.key !== 'Tab') return;

  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement?.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement?.focus();
  }
}

/**
 * Check if element has accessible name
 */
export function hasAccessibleName(element: HTMLElement): boolean {
  return !!(
    element.getAttribute('aria-label') ||
    element.getAttribute('aria-labelledby') ||
    element.textContent?.trim() ||
    element.getAttribute('title')
  );
}

/**
 * Generate unique ID for ARIA attributes
 */
export function generateAriaId(prefix: string = 'aria'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Check for common accessibility issues
 */
export function checkAccessibilityIssues(
  container: HTMLElement
): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check images for alt text
  const images = container.querySelectorAll('img');
  images.forEach((img, index) => {
    if (!img.hasAttribute('alt')) {
      issues.push({
        id: `img-alt-${index}`,
        severity: 'critical',
        type: 'missing-alt',
        element: 'img',
        message: 'Image missing alt attribute',
        wcagCriteria: ['1.1.1'],
        suggestion: 'Add descriptive alt text or alt="" for decorative images',
      });
    }
  });

  // Check form inputs for labels
  const inputs = container.querySelectorAll('input, select, textarea');
  inputs.forEach((input, index) => {
    const hasLabel =
      input.hasAttribute('aria-label') ||
      input.hasAttribute('aria-labelledby') ||
      container.querySelector(`label[for="${input.id}"]`);

    if (!hasLabel) {
      issues.push({
        id: `input-label-${index}`,
        severity: 'critical',
        type: 'missing-label',
        element: input.tagName.toLowerCase(),
        message: 'Form input missing accessible label',
        wcagCriteria: ['1.3.1', '4.1.2'],
        suggestion: 'Add aria-label or associate with a <label> element',
      });
    }
  });

  // Check buttons for accessible names
  const buttons = container.querySelectorAll('button');
  buttons.forEach((button, index) => {
    if (!hasAccessibleName(button as HTMLElement)) {
      issues.push({
        id: `button-name-${index}`,
        severity: 'critical',
        type: 'missing-accessible-name',
        element: 'button',
        message: 'Button missing accessible name',
        wcagCriteria: ['4.1.2'],
        suggestion: 'Add text content or aria-label to button',
      });
    }
  });

  // Check for heading hierarchy
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let previousLevel = 0;
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName[1]);
    if (previousLevel > 0 && level > previousLevel + 1) {
      issues.push({
        id: `heading-hierarchy-${index}`,
        severity: 'moderate',
        type: 'heading-hierarchy',
        element: heading.tagName.toLowerCase(),
        message: `Heading level skipped from h${previousLevel} to h${level}`,
        wcagCriteria: ['1.3.1'],
        suggestion: 'Use sequential heading levels without skipping',
      });
    }
    previousLevel = level;
  });

  // Check links for accessible names
  const links = container.querySelectorAll('a');
  links.forEach((link, index) => {
    if (!hasAccessibleName(link as HTMLElement)) {
      issues.push({
        id: `link-name-${index}`,
        severity: 'serious',
        type: 'missing-accessible-name',
        element: 'a',
        message: 'Link missing accessible name',
        wcagCriteria: ['2.4.4', '4.1.2'],
        suggestion: 'Add descriptive text or aria-label to link',
      });
    }
  });

  return issues;
}

/**
 * Get WCAG compliance level
 */
export function getWCAGLevel(issues: AccessibilityIssue[]): 'AAA' | 'AA' | 'A' | 'Fail' {
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const seriousCount = issues.filter((i) => i.severity === 'serious').length;

  if (criticalCount > 0) return 'Fail';
  if (seriousCount > 0) return 'A';
  if (issues.length > 5) return 'AA';
  return 'AAA';
}
