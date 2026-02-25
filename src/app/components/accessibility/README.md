# Accessibility Features - WCAG 2.1 AA Compliance

This directory contains comprehensive accessibility features ensuring WCAG 2.1 AA compliance across the entire platform.

## Components

### 1. AccessibilityNavigator
Provides keyboard navigation and skip links for efficient page navigation.

**Features:**
- Skip to main content, navigation, and footer
- Landmark navigation menu
- Keyboard shortcuts reference
- Visual navigation helper

**Usage:**
```tsx
import { AccessibilityNavigator } from '@/app/components/accessibility/AccessibilityNavigator';

<AccessibilityNavigator 
  skipLinks={[
    { id: 'skip-main', label: 'Skip to main content', targetId: 'main-content' },
    { id: 'skip-nav', label: 'Skip to navigation', targetId: 'main-navigation' }
  ]}
  showLandmarks={true}
/>
```

### 2. ScreenReaderOptimizer
Optimizes content for screen readers with ARIA labels and live regions.

**Features:**
- Automatic screen reader detection
- ARIA live regions for announcements
- Accessible loading states
- Accessible error/success messages
- Progress indicators with proper ARIA attributes

**Usage:**
```tsx
import { 
  ScreenReaderOptimizer,
  AccessibleLoading,
  AccessibleError,
  AccessibleProgress 
} from '@/app/components/accessibility/ScreenReaderOptimizer';

<ScreenReaderOptimizer enableAnnouncements={true}>
  <YourApp />
</ScreenReaderOptimizer>

// Loading state
<AccessibleLoading message="Loading courses" isLoading={true} />

// Error message
<AccessibleError message="Failed to load data" onDismiss={() => {}} />

// Progress bar
<AccessibleProgress value={75} max={100} label="Course completion" />
```

### 3. ColorContrastChecker
Validates color contrast ratios against WCAG standards.

**Features:**
- Automatic page contrast checking
- Visual contrast ratio display
- WCAG AA/AAA compliance indicators
- Color swatch previews
- Detailed failure reports

**Usage:**
```tsx
import { ColorContrastChecker } from '@/app/components/accessibility/ColorContrastChecker';

<ColorContrastChecker 
  autoCheck={false}
  showWidget={true}
/>
```

### 4. AccessibilityTester
Automated accessibility testing and issue reporting.

**Features:**
- Comprehensive accessibility checks
- Issue severity classification (critical, serious, moderate, minor)
- WCAG criteria mapping
- Exportable JSON reports
- Real-time issue filtering

**Usage:**
```tsx
import { AccessibilityTester } from '@/app/components/accessibility/AccessibilityTester';

<AccessibilityTester 
  autoCheck={false}
  showWidget={true}
/>
```

### 5. AccessibilityProvider
Wrapper component that enables all accessibility features.

**Usage:**
```tsx
import { AccessibilityProvider } from '@/app/components/accessibility/AccessibilityProvider';

function App() {
  return (
    <AccessibilityProvider
      enableNavigator={true}
      enableScreenReader={true}
      enableContrastChecker={true}
      enableTester={true}
      autoCheckContrast={false}
      autoCheckAccessibility={false}
    >
      <YourApp />
    </AccessibilityProvider>
  );
}
```

## Hooks

### useKeyboardNavigation
Manages keyboard navigation within a container.

```tsx
import { useKeyboardNavigation } from '@/hooks/useAccessibility';

const containerRef = useKeyboardNavigation(true);
return <div ref={containerRef}>{/* content */}</div>;
```

### useFocusTrap
Traps focus within a container (for modals/dialogs).

```tsx
import { useFocusTrap } from '@/hooks/useAccessibility';

const containerRef = useFocusTrap(isModalOpen);
return <div ref={containerRef}>{/* modal content */}</div>;
```

### useScreenReaderAnnouncement
Announces messages to screen readers.

```tsx
import { useScreenReaderAnnouncement } from '@/hooks/useAccessibility';

const announce = useScreenReaderAnnouncement();
announce('Form submitted successfully', 'polite');
```

### useAccessibilityCheck
Performs accessibility checks on a container.

```tsx
import { useAccessibilityCheck } from '@/hooks/useAccessibility';

const { containerRef, issues, checkAccessibility } = useAccessibilityCheck(false);
```

### useReducedMotion
Detects user's reduced motion preference.

```tsx
import { useReducedMotion } from '@/hooks/useAccessibility';

const prefersReducedMotion = useReducedMotion();
const animationDuration = prefersReducedMotion ? 0 : 300;
```

## Utility Functions

### calculateContrastRatio
Calculates contrast ratio between two colors.

```tsx
import { calculateContrastRatio } from '@/utils/accessibilityUtils';

const result = calculateContrastRatio('#000000', '#FFFFFF');
console.log(result.ratio); // 21
console.log(result.passes.aa); // true
```

### checkAccessibilityIssues
Checks for common accessibility issues in a container.

```tsx
import { checkAccessibilityIssues } from '@/utils/accessibilityUtils';

const issues = checkAccessibilityIssues(document.body);
issues.forEach(issue => {
  console.log(issue.severity, issue.message);
});
```

### announceToScreenReader
Announces a message to screen readers.

```tsx
import { announceToScreenReader } from '@/utils/accessibilityUtils';

announceToScreenReader('Page loaded', 'polite');
```

## WCAG 2.1 AA Compliance Checklist

### ✅ Perceivable
- [x] 1.1.1 Non-text Content - Alt text checking
- [x] 1.3.1 Info and Relationships - Semantic HTML and ARIA
- [x] 1.4.3 Contrast (Minimum) - Color contrast checker
- [x] 1.4.11 Non-text Contrast - UI component contrast

### ✅ Operable
- [x] 2.1.1 Keyboard - Full keyboard navigation
- [x] 2.1.2 No Keyboard Trap - Focus trap management
- [x] 2.4.1 Bypass Blocks - Skip links
- [x] 2.4.3 Focus Order - Logical tab order
- [x] 2.4.7 Focus Visible - Visible focus indicators

### ✅ Understandable
- [x] 3.1.1 Language of Page - Lang attributes
- [x] 3.2.1 On Focus - No unexpected changes
- [x] 3.3.1 Error Identification - Accessible errors
- [x] 3.3.2 Labels or Instructions - Form labels

### ✅ Robust
- [x] 4.1.2 Name, Role, Value - ARIA attributes
- [x] 4.1.3 Status Messages - Live regions

## Testing

### Manual Testing
1. **Keyboard Navigation**: Navigate entire site using only Tab, Shift+Tab, Enter, and Arrow keys
2. **Screen Reader**: Test with NVDA (Windows), JAWS (Windows), or VoiceOver (Mac)
3. **Zoom**: Test at 200% zoom level
4. **Color Blindness**: Use browser extensions to simulate color blindness

### Automated Testing
```tsx
// Run accessibility check
<AccessibilityTester autoCheck={true} />

// Or programmatically
const { issues, checkAccessibility } = useAccessibilityCheck();
checkAccessibility();
console.log(issues);
```

## Best Practices

1. **Always provide alt text** for images (use empty alt="" for decorative images)
2. **Use semantic HTML** (header, nav, main, footer, article, section)
3. **Provide labels** for all form inputs
4. **Maintain heading hierarchy** (don't skip levels)
5. **Ensure sufficient color contrast** (4.5:1 for normal text, 3:1 for large text)
6. **Make all functionality keyboard accessible**
7. **Provide skip links** for keyboard users
8. **Use ARIA attributes** appropriately (but prefer semantic HTML)
9. **Test with real assistive technologies**
10. **Include focus indicators** for all interactive elements

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Screen Readers: NVDA, JAWS, VoiceOver, TalkBack

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)

## Important Note

While these tools provide comprehensive automated accessibility checking, they cannot catch all accessibility issues. Manual testing with assistive technologies and real users with disabilities is essential for true accessibility compliance.

**This implementation does not guarantee WCAG compliance** - it provides tools to help achieve and maintain compliance through ongoing testing and remediation.
