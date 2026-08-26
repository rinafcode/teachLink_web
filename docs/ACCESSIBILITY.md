# Accessibility on TeachLink

This app ships a layered accessibility toolkit aimed at **WCAG 2.1 Level AA** patterns. Automated checks catch common failures; they do **not** replace testing with screen readers and keyboard-only navigation.

## VPAT CDN delivery

Published VPAT JSON reports are served from the read-only route `/api/accessibility/vpat/:version.json` and are safe to cache at a CDN because the version is part of the URL. Set `VPAT_REPORT_JSON` to the validated report JSON during deployment. The artifact's `version` must match the URL; invalid or missing artifacts return `404`.

For a separate CDN origin, set `NEXT_PUBLIC_VPAT_CDN_URL` to its base URL. `getVPATCDNUrl(version)` then produces a versioned URL such as `https://cdn.example.com/api/accessibility/vpat/1.2.3.json`. Reports are delivered with one-year immutable browser and edge caching, `nosniff`, and inline JSON content disposition. Never place personal data or credentials in a VPAT report.

## Architecture

| Piece                   | Role                                                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `AccessibilityProvider` | Global context: `announce`, motion preference, keyboard modality, `runPageAudit`.                                                         |
| `ScreenReaderSupport`   | Permanent **polite** and **assertive** live regions for reliable announcements.                                                           |
| `KeyboardNavigation`    | **Alt+M** focuses main content; **Shift+?** opens a shortcuts dialog (focus-trapped). Toolbar **roving** focus with `[data-roving-root]`. |
| `AccessibilityAudit`    | Dev-only (by default) floating panel with heuristic DOM checks.                                                                           |
| `useAccessibility()`    | Reads context, or a safe fallback when used outside the provider.                                                                         |
| `accessibilityUtils`    | Focus helpers, contrast math, `checkAccessibilityIssues`, `runAccessibilityAudit`.                                                        |

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

- Give the primary `<main>` a stable id such as `main-content` so skip links and **Alt+M** work everywhere. There should be **exactly one** `<main>` (or `role="main"`) per view.
- For horizontal toolbars, add `data-roving-root` on the toolbar container. **Left/Right arrow** moves among buttons, links, tabs, and elements marked with `data-roving-item` (including those using `tabindex="-1"` for roving patterns).
- Rich post editors should expose a named multiline textbox, a named formatting toolbar with pressed states, and helper text connected through `aria-describedby`. Post composer message lists should use `role="log"` with polite updates so new discussion activity is announced without interrupting the current task.

## What automation does _not_ prove

- **WCAG 2.1 AA** for the whole product requires page-by-page review (contrast in context, timing, reflow, errors, etc.).
- The audit panel and `checkAccessibilityIssues` only flag **some** DOM patterns. They miss false positives/negatives and cannot judge screen reader UX.
- **All keyboard paths** and **all screen reader announcements** still need manual QA on real flows.

## ARIA checklist (authoring)

1. Every interactive control has a computed **accessible name** (visible text, `aria-label`, or `aria-labelledby`).
2. Form fields are labeled with a wrapping `<label>`, `<label htmlFor>`, or `aria-label` / `aria-labelledby`.
3. Images convey meaning with `alt`; decorative images use `alt=""`.
4. Headings describe structure without skipped levels.
5. Expandable regions use `aria-expanded`; dialogs use `role="dialog"`, `aria-modal="true"`, and initial focus management.
6. Prefer native `<button>` and `<a href>` over generic elements with scripts.

## Testing

- Navigate the primary tasks **without a mouse** (including modals, forms, and media).
- Run **VoiceOver** (macOS) or **NVDA** (Windows) on critical flows; verify focus order and live region behavior.
- Use the in-app **Accessibility audit** (development) to catch missing `alt`, labels, names, landmarks, `lang`, and duplicate `id`s—then fix and re-test manually.

For more examples, see `src/app/components/accessibility/README.md` and `ACCESSIBILITY_IMPLEMENTATION_GUIDE.md` in the repo root.
