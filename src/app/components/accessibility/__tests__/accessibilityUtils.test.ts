import { describe, it, expect } from 'vitest';
import {
  calculateContrastRatio,
  isFocusable,
  hasAccessibleName,
  generateAriaId,
  getWCAGLevel,
  AccessibilityIssue,
} from '@/utils/accessibilityUtils';

describe('accessibilityUtils', () => {
  describe('calculateContrastRatio', () => {
    it('should calculate correct contrast ratio for black and white', () => {
      const result = calculateContrastRatio('#000000', '#FFFFFF');
      expect(result.ratio).toBe(21);
      expect(result.passes.aa).toBe(true);
      expect(result.passes.aaa).toBe(true);
    });

    it('should calculate correct contrast ratio for similar colors', () => {
      const result = calculateContrastRatio('#777777', '#888888');
      expect(result.ratio).toBeLessThan(4.5);
      expect(result.passes.aa).toBe(false);
    });

    it('should pass AA for sufficient contrast', () => {
      const result = calculateContrastRatio('#595959', '#FFFFFF');
      expect(result.passes.aa).toBe(true);
    });

    it('should pass AA Large for lower contrast', () => {
      const result = calculateContrastRatio('#767676', '#FFFFFF');
      expect(result.passes.aaLarge).toBe(true);
    });

    it('should handle invalid hex colors', () => {
      const result = calculateContrastRatio('invalid', '#FFFFFF');
      expect(result.ratio).toBe(0);
      expect(result.passes.aa).toBe(false);
    });
  });

  describe('isFocusable', () => {
    it('should identify button as focusable', () => {
      const button = document.createElement('button');
      expect(isFocusable(button)).toBe(true);
    });

    it('should identify link as focusable', () => {
      const link = document.createElement('a');
      link.href = '#';
      expect(isFocusable(link)).toBe(true);
    });

    it('should identify element with tabindex as focusable', () => {
      const div = document.createElement('div');
      div.setAttribute('tabindex', '0');
      expect(isFocusable(div)).toBe(true);
    });

    it('should not identify regular div as focusable', () => {
      const div = document.createElement('div');
      expect(isFocusable(div)).toBe(false);
    });
  });

  describe('hasAccessibleName', () => {
    it('should detect aria-label', () => {
      const element = document.createElement('button');
      element.setAttribute('aria-label', 'Close');
      expect(hasAccessibleName(element)).toBe(true);
    });

    it('should detect text content', () => {
      const element = document.createElement('button');
      element.textContent = 'Click me';
      expect(hasAccessibleName(element)).toBe(true);
    });

    it('should detect title attribute', () => {
      const element = document.createElement('button');
      element.setAttribute('title', 'Close button');
      expect(hasAccessibleName(element)).toBe(true);
    });

    it('should return false for element without accessible name', () => {
      const element = document.createElement('button');
      expect(hasAccessibleName(element)).toBe(false);
    });
  });

  describe('generateAriaId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateAriaId();
      const id2 = generateAriaId();
      expect(id1).not.toBe(id2);
    });

    it('should use provided prefix', () => {
      const id = generateAriaId('test');
      expect(id).toMatch(/^test-/);
    });

    it('should use default prefix', () => {
      const id = generateAriaId();
      expect(id).toMatch(/^aria-/);
    });
  });

  describe('getWCAGLevel', () => {
    it('should return Fail for critical issues', () => {
      const issues: AccessibilityIssue[] = [
        {
          id: '1',
          severity: 'critical',
          type: 'missing-alt',
          element: 'img',
          message: 'Missing alt',
          wcagCriteria: ['1.1.1'],
          suggestion: 'Add alt text',
        },
      ];
      expect(getWCAGLevel(issues)).toBe('Fail');
    });

    it('should return A for serious issues', () => {
      const issues: AccessibilityIssue[] = [
        {
          id: '1',
          severity: 'serious',
          type: 'missing-label',
          element: 'input',
          message: 'Missing label',
          wcagCriteria: ['1.3.1'],
          suggestion: 'Add label',
        },
      ];
      expect(getWCAGLevel(issues)).toBe('A');
    });

    it('should return AA for moderate issues', () => {
      const issues: AccessibilityIssue[] = Array(6)
        .fill(null)
        .map((_, i) => ({
          id: `${i}`,
          severity: 'moderate' as const,
          type: 'heading',
          element: 'h2',
          message: 'Issue',
          wcagCriteria: ['1.3.1'],
          suggestion: 'Fix',
        }));
      expect(getWCAGLevel(issues)).toBe('AA');
    });

    it('should return AAA for few minor issues', () => {
      const issues: AccessibilityIssue[] = [
        {
          id: '1',
          severity: 'minor',
          type: 'minor-issue',
          element: 'div',
          message: 'Minor issue',
          wcagCriteria: ['2.4.4'],
          suggestion: 'Improve',
        },
      ];
      expect(getWCAGLevel(issues)).toBe('AAA');
    });

    it('should return AAA for no issues', () => {
      expect(getWCAGLevel([])).toBe('AAA');
    });
  });
});
