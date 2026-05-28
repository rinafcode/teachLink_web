# Button & ButtonGroup

A reusable button system with variants, sizes, keyboard navigation, and full dark mode support.

## Installation

Both components are exported from `@/components`:

```tsx
import { Button, ButtonGroup } from '@/components';
import type { ButtonProps } from '@/components';
```

## Button

### Variants

| Variant    | Usage                         |
| ---------- | ----------------------------- |
| `primary`  | Main call to action (default) |
| `secondary`| Alternative action            |
| `outline`  | Bordered, low emphasis        |
| `ghost`    | Minimal, no border            |
| `danger`   | Destructive action            |

```tsx
<Button variant="primary">Enroll Now</Button>
<Button variant="secondary">Save Draft</Button>
<Button variant="outline">Preview</Button>
<Button variant="ghost">Cancel</Button>
<Button variant="danger">Delete Course</Button>
```

### Sizes

| Size | Height |
| ---- | ------ |
| `sm` | 32px   |
| `md` | 40px (default) |
| `lg` | 48px   |

```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```

### States

```tsx
// Disabled
<Button disabled>Not Available</Button>

// Custom className
<Button className="ml-auto">Right-aligned</Button>

// With icon
<Button>
  <svg className="w-4 h-4" ... />
  Download
</Button>
```

### Keyboard Behavior

| Key       | Action                  |
| --------- | ----------------------- |
| `Tab`     | Focus next button       |
| `Enter` / `Space` | Click the focused button |
| `focus-visible` | Blue outline ring on keyboard focus only |

## ButtonGroup

Groups buttons with arrow-key navigation (roving tabindex).

```tsx
<ButtonGroup aria-label="View options">
  <Button variant="ghost">Week</Button>
  <Button variant="ghost">Month</Button>
  <Button variant="ghost">Year</Button>
</ButtonGroup>
```

### Orientation

```tsx
// Horizontal (default)
<ButtonGroup orientation="horizontal" aria-label="Toolbar">
  <Button variant="outline">Bold</Button>
  <Button variant="outline">Italic</Button>
  <Button variant="outline">Underline</Button>
</ButtonGroup>

// Vertical
<ButtonGroup orientation="vertical" aria-label="Navigation">
  <Button variant="ghost">Dashboard</Button>
  <Button variant="ghost">Courses</Button>
  <Button variant="ghost">Settings</Button>
</ButtonGroup>
```

### Keyboard Behavior

| Key (Horizontal) | Key (Vertical)  | Action                         |
| ---------------- | --------------- | ------------------------------ |
| `ArrowRight`     | `ArrowDown`     | Focus next button (wraps)      |
| `ArrowLeft`      | `ArrowUp`       | Focus previous button (wraps)  |
| `Home`           | `Home`          | Focus first button             |
| `End`            | `End`           | Focus last button              |

## Dark Mode

All variants automatically adapt to dark mode using Tailwind `dark:` variants. No extra work needed.

```tsx
<Button variant="primary">Always visible</Button>
<Button variant="ghost">Adapts to theme</Button>
```

## Accessibility

- Native `<button>` element — works with screen readers by default
- `role="toolbar"` + `aria-orientation` on ButtonGroup
- `aria-label` required on ButtonGroup
- `disabled` prop prevents interaction and reduces opacity
- `focus-visible` outlines only show during keyboard navigation (not mouse clicks)
