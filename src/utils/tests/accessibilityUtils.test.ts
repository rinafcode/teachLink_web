import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateContrastRatio,
  getComputedColor,
  isFocusable,
  getFocusableElements,
  getRovingFocusCandidates,
  trapFocus,
  hasAccessibleName,
  generateAriaId,
  announceToScreenReader,
  checkAccessibilityIssues,
  runAccessibilityAudit,
  getWCAGLevel,
  AccessibilityIssue,
} from '../accessibilityUtils';

describe('accessibilityUtils', () => {
  describe('calculateContrastRatio', () => {
    it('calculates maximum contrast ratio for black and white', () => {
      const result = calculateContrastRatio('#000000', '#ffffff');
      expect(result.ratio).toBe(21);
      expect(result.passes.aa).toBe(true);
      expect(result.passes.aaa).toBe(true);
      expect(result.passes.aaLarge).toBe(true);
      expect(result.passes.aaaLarge).toBe(true);
    });

    it('calculates contrast ratio for 3-digit shorthand hex codes', () => {
      const result = calculateContrastRatio('#000', '#fff');
      expect(result.ratio).toBe(21);
      expect(result.passes.aa).toBe(true);
    });

    it('calculates minimum contrast ratio for identical colors', () => {
      const result = calculateContrastRatio('#ffffff', '#ffffff');
      expect(result.ratio).toBe(1);
      expect(result.passes.aa).toBe(false);
      expect(result.passes.aaa).toBe(false);
      expect(result.passes.aaLarge).toBe(false);
      expect(result.passes.aaaLarge).toBe(false);
    });

    it('handles intermediate contrast ratios accurately', () => {
      const result = calculateContrastRatio('#767676', '#ffffff');
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
      expect(result.passes.aa).toBe(true);
    });

    it('returns zero ratio and false passes for invalid color values', () => {
      const result1 = calculateContrastRatio('invalid', '#ffffff');
      expect(result1.ratio).toBe(0);
      expect(result1.passes.aa).toBe(false);

      const result2 = calculateContrastRatio('#ffffff', 'not-a-color');
      expect(result2.ratio).toBe(0);
      expect(result2.passes.aa).toBe(false);
    });
  });

  describe('getComputedColor', () => {
    it('converts computed RGB style to hex', () => {
      const div = document.createElement('div');
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: vi.fn().mockReturnValue('rgb(255, 0, 128)'),
      } as unknown as CSSStyleDeclaration);

      const color = getComputedColor(div, 'color');
      expect(color).toBe('#ff0080');
    });

    it('returns #000000 when computed color does not match rgb pattern', () => {
      const div = document.createElement('div');
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: vi.fn().mockReturnValue('transparent'),
      } as unknown as CSSStyleDeclaration);

      const color = getComputedColor(div, 'background-color');
      expect(color).toBe('#000000');
    });
  });

  describe('isFocusable', () => {
    it('returns true for naturally focusable tags', () => {
      const button = document.createElement('button');
      const anchor = document.createElement('a');
      const input = document.createElement('input');
      const select = document.createElement('select');
      const textarea = document.createElement('textarea');

      expect(isFocusable(button)).toBe(true);
      expect(isFocusable(anchor)).toBe(true);
      expect(isFocusable(input)).toBe(true);
      expect(isFocusable(select)).toBe(true);
      expect(isFocusable(textarea)).toBe(true);
    });

    it('returns true for elements with non-negative tabindex', () => {
      const div = document.createElement('div');
      div.setAttribute('tabindex', '0');
      expect(isFocusable(div)).toBe(true);

      const span = document.createElement('span');
      span.setAttribute('tabindex', '1');
      expect(isFocusable(span)).toBe(true);
    });

    it('returns true for contenteditable elements', () => {
      const div = document.createElement('div');
      div.setAttribute('contenteditable', 'true');
      expect(isFocusable(div)).toBe(true);
    });

    it('returns false for non-focusable elements', () => {
      const div = document.createElement('div');
      const p = document.createElement('p');
      const span = document.createElement('span');

      expect(isFocusable(div)).toBe(false);
      expect(isFocusable(p)).toBe(false);
      expect(isFocusable(span)).toBe(false);
    });
  });

  describe('getFocusableElements', () => {
    it('finds and filters focusable elements within container', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <a href="#link">Link</a>
        <a>Anchor without href</a>
        <button>Click me</button>
        <button disabled>Disabled button</button>
        <input type="text" />
        <input type="text" disabled />
        <select><option>1</option></select>
        <textarea></textarea>
        <div tabindex="0">Custom focusable</div>
        <div tabindex="-1">Excluded tabindex</div>
        <div aria-hidden="true">
          <button>Hidden button</button>
        </div>
        <div hidden>
          <button>Hidden attribute button</button>
        </div>
      `;
      document.body.appendChild(container);

      const focusable = getFocusableElements(container);
      expect(focusable.length).toBe(6);
      expect(focusable.map((el) => el.tagName.toLowerCase())).toEqual([
        'a',
        'button',
        'input',
        'select',
        'textarea',
        'div',
      ]);

      document.body.removeChild(container);
    });
  });

  describe('getRovingFocusCandidates', () => {
    it('returns candidates including roving items and menu items', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button>Btn</button>
        <a href="#">Link</a>
        <input type="text" />
        <input type="hidden" />
        <div role="menuitem">Item 1</div>
        <div role="menuitem" aria-disabled="true">Disabled item</div>
        <div role="tab">Tab 1</div>
        <div role="radio">Radio 1</div>
        <div data-roving-item>Roving</div>
        <div role="menuitem" aria-hidden="true">Hidden item</div>
      `;

      const candidates = getRovingFocusCandidates(container);
      expect(candidates.length).toBe(6);
    });
  });

  describe('trapFocus', () => {
    it('ignores non-Tab key events', () => {
      const container = document.createElement('div');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      trapFocus(container, event);
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('wraps focus to first element when tabbing from last element', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button id="first">First</button>
        <button id="last">Last</button>
      `;
      document.body.appendChild(container);

      const first = container.querySelector('#first') as HTMLElement;
      const last = container.querySelector('#last') as HTMLElement;
      last.focus();

      const focusSpy = vi.spyOn(first, 'focus');
      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      trapFocus(container, event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalled();

      document.body.removeChild(container);
    });

    it('wraps focus to last element when shift-tabbing from first element', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button id="first">First</button>
        <button id="last">Last</button>
      `;
      document.body.appendChild(container);

      const first = container.querySelector('#first') as HTMLElement;
      const last = container.querySelector('#last') as HTMLElement;
      first.focus();

      const focusSpy = vi.spyOn(last, 'focus');
      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      trapFocus(container, event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalled();

      document.body.removeChild(container);
    });
  });

  describe('hasAccessibleName', () => {
    it('detects accessible names across aria-label, aria-labelledby, textContent, and title', () => {
      const el1 = document.createElement('button');
      el1.setAttribute('aria-label', 'Close');
      expect(hasAccessibleName(el1)).toBe(true);

      const el2 = document.createElement('button');
      el2.setAttribute('aria-labelledby', 'heading-1');
      expect(hasAccessibleName(el2)).toBe(true);

      const el3 = document.createElement('button');
      el3.textContent = 'Submit';
      expect(hasAccessibleName(el3)).toBe(true);

      const el4 = document.createElement('button');
      el4.setAttribute('title', 'Helpful info');
      expect(hasAccessibleName(el4)).toBe(true);

      const elEmpty = document.createElement('button');
      expect(hasAccessibleName(elEmpty)).toBe(false);
    });
  });

  describe('generateAriaId', () => {
    it('generates unique ARIA ids with default or custom prefix', () => {
      const id1 = generateAriaId();
      const id2 = generateAriaId();
      const customId = generateAriaId('dialog');

      expect(id1.startsWith('aria-')).toBe(true);
      expect(customId.startsWith('dialog-')).toBe(true);
      expect(id1).not.toBe(id2);
    });
  });

  describe('announceToScreenReader', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('creates polite live region announcement and cleans it up after 1s', () => {
      announceToScreenReader('Changes saved');

      const el = document.body.querySelector('.sr-only');
      expect(el).not.toBeNull();
      expect(el?.getAttribute('role')).toBe('status');
      expect(el?.getAttribute('aria-live')).toBe('polite');
      expect(el?.textContent).toBe('Changes saved');

      vi.advanceTimersByTime(1000);
      expect(document.body.querySelector('.sr-only')).toBeNull();
    });

    it('creates assertive live region when requested', () => {
      announceToScreenReader('Error occurred', 'assertive');

      const el = document.body.querySelector('.sr-only');
      expect(el?.getAttribute('role')).toBe('alert');
      expect(el?.getAttribute('aria-live')).toBe('assertive');

      vi.advanceTimersByTime(1000);
      expect(document.body.querySelector('.sr-only')).toBeNull();
    });
  });

  describe('checkAccessibilityIssues and runAccessibilityAudit', () => {
    it('detects missing alt attributes on images', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <img src="logo.png" />
        <img src="icon.png" alt="" />
      `;

      const issues = checkAccessibilityIssues(container);
      expect(issues.some((i) => i.type === 'missing-alt')).toBe(true);
      expect(issues.filter((i) => i.type === 'missing-alt')).toHaveLength(1);
    });

    it('detects unlabelled form inputs', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <input type="text" id="unlabelled-input" />
        <label for="valid-input">Name</label>
        <input type="text" id="valid-input" />
        <label><input type="checkbox" /> Agree</label>
        <input type="text" aria-label="Search" />
        <input type="hidden" name="token" />
      `;

      const issues = checkAccessibilityIssues(container);
      const labelIssues = issues.filter((i) => i.type === 'missing-label');
      expect(labelIssues).toHaveLength(1);
    });

    it('detects buttons and links missing accessible names', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button></button>
        <button aria-label="Menu"><span class="icon"></span></button>
        <a href="#home"></a>
        <a href="#about">About</a>
      `;

      const issues = checkAccessibilityIssues(container);
      expect(issues.some((i) => i.type === 'missing-accessible-name' && i.element === 'button')).toBe(true);
      expect(issues.some((i) => i.type === 'missing-accessible-name' && i.element === 'a')).toBe(true);
    });

    it('detects skipped heading levels', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <h1>Title</h1>
        <h3>Skipped subheader</h3>
      `;

      const issues = checkAccessibilityIssues(container);
      expect(issues.some((i) => i.type === 'heading-hierarchy')).toBe(true);
    });

    it('detects duplicate id attributes', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div id="duplicate-id">One</div>
        <div id="duplicate-id">Two</div>
      `;

      const issues = checkAccessibilityIssues(container);
      expect(issues.some((i) => i.type === 'duplicate-id')).toBe(true);
    });

    it('runs audit with runAccessibilityAudit', () => {
      const container = document.createElement('div');
      container.innerHTML = `<h1>Page</h1><p>Clean markup</p>`;
      const issues = runAccessibilityAudit(container);
      expect(Array.isArray(issues)).toBe(true);
    });
  });

  describe('getWCAGLevel', () => {
    it('returns Fail when critical issues are present', () => {
      const issues: AccessibilityIssue[] = [
        {
          id: '1',
          severity: 'critical',
          type: 'missing-alt',
          element: 'img',
          message: 'Error',
          wcagCriteria: ['1.1.1'],
          suggestion: 'Fix',
        },
      ];
      expect(getWCAGLevel(issues)).toBe('Fail');
    });

    it('returns A when serious issues are present', () => {
      const issues: AccessibilityIssue[] = [
        {
          id: '1',
          severity: 'serious',
          type: 'duplicate-id',
          element: '#id',
          message: 'Error',
          wcagCriteria: ['4.1.1'],
          suggestion: 'Fix',
        },
      ];
      expect(getWCAGLevel(issues)).toBe('A');
    });

    it('returns AA when there are more than 5 moderate/minor issues', () => {
      const issues: AccessibilityIssue[] = Array.from({ length: 6 }, (_, i) => ({
        id: `issue-${i}`,
        severity: 'moderate' as const,
        type: 'heading-hierarchy',
        element: 'h3',
        message: 'Skipped',
        wcagCriteria: ['1.3.1'],
        suggestion: 'Fix',
      }));
      expect(getWCAGLevel(issues)).toBe('AA');
    });

    it('returns AAA when issues are 5 or fewer and no critical or serious issues', () => {
      const issues: AccessibilityIssue[] = [
        {
          id: '1',
          severity: 'minor',
          type: 'misc',
          element: 'div',
          message: 'Minor warning',
          wcagCriteria: [],
          suggestion: 'Fix',
        },
      ];
      expect(getWCAGLevel(issues)).toBe('AAA');
    });
  });
});
