# Mobile Navigation Responsive Design

`MobileNavigation` renders as a bottom tab bar on compact and portrait screens. It switches to a left-side rail only when the viewport is at least `640px` wide and in landscape orientation.

This keeps the navigation reachable on phones while avoiding an unexpected side rail on narrow portrait layouts. The component also preserves safe-area padding with `env(safe-area-inset-*)`, remains hidden at the `lg` breakpoint, and uses WAI-ARIA tab semantics with roving keyboard focus.

Responsive behavior is covered by `src/components/mobile/__tests__/MobileNavigation.test.tsx`.
