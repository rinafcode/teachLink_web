# Accessibility Implementation Guide

## Overview

This guide provides comprehensive instructions for implementing WCAG 2.1 AA compliant accessibility features across the learning platform.

## Quick Start

### 1. Wrap Your Application

```tsx
// src/app/layout.tsx or your root component
import { AccessibilityProvider } from '@/app/components/accessibility/AccessibilityProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AccessibilityProvider
          enableNavigator={true}
          enableScreenReader={true}
          enableContrastChecker={true}
          enableTester={true}
        >
          {children}
        </AccessibilityProvider>
      </body>
    </html>
  );
}
```

### 2. Add Semantic HTML Structure

```tsx
<div className="app">
  {/* Skip Links */}
  <a href="#main-content" className="sr-only focus:not-sr-only">
    Skip to main content
  </a>

  {/* Header */}
  <header role="banner">
    <h1>Your App Title</h1>
  </header>

  {/* Navigation */}
  <nav id="main-navigation" role="navigation" aria-label="Main navigation">
    {/* Navigation items */}
  </nav>

  {/* Main Content */}
  <main id="main-content" role="main">
    {/* Your content */}
  </main>

  {/* Footer */}
  <footer id="footer" role="contentinfo">
    {/* Footer content */}
  </footer>
</div>
```

### 3. Test Your Implementation

Visit `/accessibility-demo` to see examples and test the features.

## Component Usage

### Forms

```tsx
import { AccessibleError } from '@/app/components/accessibility/ScreenReaderOptimizer';

<form onSubmit={handleSubmit} aria-label="Contact form">
  <label htmlFor="email">
    Email <span className="text-red-600" aria-label="required">*</span>
  </label>
  <input
    type="email"
    id="email"
    aria-required="true"
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? 'email-error' : undefined}
  />
  {errors.email && (
    <div id="email-error" role="alert">
      <AccessibleError message={errors.email} />
    </div>
  )}
</form>
```

### Modals/Dialogs

```tsx
import { useFocusTrap } from '@/hooks/useAccessibility';

function Modal({ isOpen, onClose, title, children }) {
  const containerRef = useFocusTrap(isOpen);

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <h2 id="modal-title">{title}</h2>
      {children}
    </div>
  );
}
```

### Loading States

```tsx
import { AccessibleLoading } from '@/app/components/accessibility/ScreenReaderOptimizer';

<AccessibleLoading message="Loading courses" isLoading={isLoading} />
```

### Progress Indicators

```tsx
import { AccessibleProgress } from '@/app/components/accessibility/ScreenReaderOptimizer';

<AccessibleProgress 
  value={75} 
  max={100} 
  label="Course completion"
  showPercentage={true}
/>
```

### Announcements

```tsx
import { useScreenReaderAnnouncement } from '@/hooks/useAccessibility';

function MyComponent() {
  const announce = useScreenReaderAnnouncement();

  const handleAction = () => {
    // Perform action
    announce('Action completed successfully', 'polite');
  };
}
```

## WCAG 2.1 AA Compliance Checklist

### Perceivable

- [ ] **1.1.1 Non-text Content**: All images have alt text
- [ ] **1.3.1 Info and Relationships**: Semantic HTML and ARIA labels
- [ ] **1.3.2 Meaningful Sequence**: Logical reading order
- [ ] **1.4.3 Contrast (Minimum)**: 4.5:1 for normal text, 3:1 for large text
- [ ] **1.4.4 Resize Text**: Text can be resized to 200%
- [ ] **1.4.11 Non-text Contrast**: UI components have 3:1 contrast

### Operable

- [ ] **2.1.1 Keyboard**: All functionality available via keyboard
- [ ] **2.1.2 No Keyboard Trap**: Focus can move away from all components
- [ ] **2.4.1 Bypass Blocks**: Skip links provided
- [ ] **2.4.2 Page Titled**: Pages have descriptive titles
- [ ] **2.4.3 Focus Order**: Logical tab order
- [ ] **2.4.4 Link Purpose**: Link text describes destination
- [ ] **2.4.7 Focus Visible**: Visible focus indicators

### Understandable

- [ ] **3.1.1 Language of Page**: HTML lang attribute set
- [ ] **3.2.1 On Focus**: No unexpected context changes on focus
- [ ] **3.2.2 On Input**: No unexpected context changes on input
- [ ] **3.3.1 Error Identification**: Errors clearly identified
- [ ] **3.3.2 Labels or Instructions**: Form inputs have labels
- [ ] **3.3.3 Error Suggestion**: Error correction suggestions provided

### Robust

- [ ] **4.1.1 Parsing**: Valid HTML
- [ ] **4.1.2 Name, Role, Value**: ARIA attributes for custom components
- [ ] **4.1.3 Status Messages**: Live regions for status updates

## Testing Procedures

### Automated Testing

1. **Run Accessibility Tester**
   - Click the green button (bottom-right)
   - Click "Run Accessibility Check"
   - Review and fix all critical and serious issues

2. **Check Color Contrast**
   - Click the purple button (middle-right)
   - Click "Check Page Contrast"
   - Fix any failing contrast ratios

3. **Run Unit Tests**
   ```bash
   npm test
   ```

### Manual Testing

1. **Keyboard Navigation**
   - Unplug your mouse
   - Navigate entire site using only keyboard
   - Verify all interactive elements are reachable
   - Check focus indicators are visible

2. **Screen Reader Testing**
   - **Windows**: NVDA (free) or JAWS
   - **Mac**: VoiceOver (built-in)
   - **Mobile**: TalkBack (Android) or VoiceOver (iOS)
   
   Test checklist:
   - [ ] All content is announced
   - [ ] Form labels are read correctly
   - [ ] Buttons have clear names
   - [ ] Headings provide structure
   - [ ] Links describe their destination
   - [ ] Status messages are announced

3. **Zoom Testing**
   - Zoom to 200% (Ctrl/Cmd + +)
   - Verify all content is readable
   - Check for horizontal scrolling
   - Ensure no content is cut off

4. **Color Blindness Testing**
   - Use browser extensions (e.g., "Colorblind - Dalton")
   - Test with different color blindness types
   - Verify information isn't conveyed by color alone

## Common Issues and Solutions

### Issue: Missing Alt Text

**Problem**: Images without alt attributes
**Solution**:
```tsx
// Decorative image
<img src="decoration.png" alt="" />

// Informative image
<img src="chart.png" alt="Sales increased 25% in Q4" />
```

### Issue: Missing Form Labels

**Problem**: Inputs without associated labels
**Solution**:
```tsx
// Option 1: Explicit label
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// Option 2: Implicit label
<label>
  Email
  <input type="email" />
</label>

// Option 3: ARIA label
<input type="email" aria-label="Email address" />
```

### Issue: Poor Color Contrast

**Problem**: Text doesn't meet 4.5:1 contrast ratio
**Solution**:
```css
/* Bad: 2.5:1 contrast */
.text { color: #999; background: #fff; }

/* Good: 4.6:1 contrast */
.text { color: #767676; background: #fff; }

/* Better: 7:1 contrast */
.text { color: #595959; background: #fff; }
```

### Issue: Keyboard Trap

**Problem**: Focus gets stuck in a component
**Solution**:
```tsx
import { useFocusTrap } from '@/hooks/useAccessibility';

// Use focus trap hook for modals
const containerRef = useFocusTrap(isOpen);

// Ensure Escape key closes modal
useEffect(() => {
  const handleEscape = (e) => {
    if (e.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, [onClose]);
```

### Issue: Missing Focus Indicators

**Problem**: Can't see which element has focus
**Solution**:
```css
/* Global focus styles already added in globals.css */
*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Custom focus for specific elements */
.button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}
```

## Best Practices

### 1. Use Semantic HTML

```tsx
// Bad
<div onClick={handleClick}>Click me</div>

// Good
<button onClick={handleClick}>Click me</button>
```

### 2. Provide Text Alternatives

```tsx
// Bad
<button><Icon /></button>

// Good
<button aria-label="Close dialog">
  <Icon aria-hidden="true" />
</button>
```

### 3. Maintain Heading Hierarchy

```tsx
// Bad
<h1>Page Title</h1>
<h3>Section</h3> {/* Skipped h2 */}

// Good
<h1>Page Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>
```

### 4. Use ARIA Appropriately

```tsx
// Bad - unnecessary ARIA
<button role="button">Click</button>

// Good - ARIA only when needed
<div role="button" tabIndex={0} onClick={handleClick}>
  Custom Button
</div>
```

### 5. Announce Dynamic Changes

```tsx
import { useScreenReaderAnnouncement } from '@/hooks/useAccessibility';

const announce = useScreenReaderAnnouncement();

// Announce important changes
useEffect(() => {
  if (dataLoaded) {
    announce('Data loaded successfully', 'polite');
  }
}, [dataLoaded, announce]);
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Articles](https://webaim.org/articles/)
- [Deque University](https://dequeuniversity.com/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

## Support

For questions or issues:
1. Check the README in `src/app/components/accessibility/`
2. Review examples in `src/app/components/accessibility/examples/`
3. Test on the demo page at `/accessibility-demo`

## Important Disclaimer

While these tools provide comprehensive automated accessibility checking, they cannot catch all accessibility issues. Manual testing with assistive technologies and real users with disabilities is essential for true accessibility compliance.

**This implementation provides tools to help achieve WCAG 2.1 AA compliance but does not guarantee it.** Ongoing testing, user feedback, and remediation are required to maintain accessibility standards.
