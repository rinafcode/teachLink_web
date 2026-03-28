# Accessibility on TeachLink

This app ships a layered accessibility toolkit aimed at **WCAG 2.1 Level AA** patterns. Automated checks catch common failures; they do **not** replace testing with screen readers and keyboard-only navigation.

## Architecture

| Piece | Role |
| --- | --- |
| `AccessibilityProvider` | Global context: `announce`, motion preference, keyboard modality, `runPageAudit`. |
| `ScreenReaderSupport` | Permanent **polite** and **assertive** live regions for reliable announcements. |
| `KeyboardNavigation` | **Alt+M** focuses main content; **Shift+?** opens a shortcuts dialog (focus-trapped). Toolbar **roving** focus with `[data-roving-root]`. |
| `AccessibilityAudit` | Dev-only (by default) floating panel with heuristic DOM checks. |
| `useAccessibility()` | Reads context, or a safe fallback when used outside the provider. |
| `accessibilityUtils` | Focus helpers, contrast math, `checkAccessibilityIssues`, `runAccessibilityAudit`. |

## Using the provider

The root layout wraps the app with `AccessibilityProvider`. Pass `enableDevAudit={false}` in production if you want to hide the audit FAB entirely, or set `NODE_ENV` so the default dev panel is off.

## Announcements

```tsx
import { useAccessibility } from '@/hooks/useAccessibility';

function SaveButton() {
  const { announce } = useAccessibility();
  return (
    <button type="button" onClick={() => announce('Changes saved', 'polite')}>
      Save
    </button>
  );
}
```

Use **assertive** only for urgent errors or time-sensitive status.

## Keyboard and landmarks

- Give the primary `<main>` a stable id such as `main-content` so skip links and **Alt+M** work everywhere.
- For horizontal toolbars, wrap controls in a container with `data-roving-root` and use arrow keys to move between focusable children.

## ARIA checklist (authoring)

1. Every interactive control has a computed **accessible name** (visible text, `aria-label`, or `aria-labelledby`).
2. Form fields are labeled with `<label htmlFor>` or `aria-label` / `aria-labelledby`.
3. Images convey meaning with `alt`; decorative images use `alt=""`.
4. Headings describe structure without skipped levels.
5. Expandable regions use `aria-expanded`; dialogs use `role="dialog"`, `aria-modal="true"`, and initial focus management.
6. Prefer native `<button>` and `<a href>` over generic elements with scripts.

## Testing

- Navigate the primary tasks **without a mouse**.
- Run **VoiceOver** (macOS) or **NVDA** (Windows) on critical flows.
- Use the in-app **Accessibility audit** (development) and fix reported issues, then re-test manually.

For more examples, see `src/app/components/accessibility/README.md` and `ACCESSIBILITY_IMPLEMENTATION_GUIDE.md` in the repo root.
