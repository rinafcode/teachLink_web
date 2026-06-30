# Quote Component

A reusable component for displaying quotes with author attribution, gesture-based navigation, and clipboard copy support.

## Import

```tsx
import { Quote } from '@/components/ui/Quote';
import type { QuoteProps } from '@/components/ui/Quote';
```

## Basic Usage

```tsx
<Quote text="The only way to do great work is to love what you do." author="Steve Jobs" />
```

## Props

| Prop             | Type                     | Default     | Description                                         |
| ---------------- | ------------------------ | ----------- | --------------------------------------------------- |
| `text`           | `string`                 | —           | **Required.** The quote text to display.            |
| `author`         | `string`                 | `undefined` | Name of the person being quoted.                    |
| `source`         | `string`                 | `undefined` | Optional source, book title, or citation.           |
| `onCopy`         | `(text: string) => void` | `undefined` | Called with the quote text after it is copied.      |
| `onSwipeLeft`    | `() => void`             | `undefined` | Called on a left swipe (or left-arrow click).       |
| `onSwipeRight`   | `() => void`             | `undefined` | Called on a right swipe (or right-arrow click).     |
| `onPinchIn`      | `() => void`             | `undefined` | Called when a pinch-in gesture is detected.         |
| `onPinchOut`     | `() => void`             | `undefined` | Called when a pinch-out gesture is detected.        |
| `className`      | `string`                 | `''`        | Extra Tailwind classes applied to the root element. |
| `showNavigation` | `boolean`                | `false`     | Show previous/next arrow buttons.                   |
| `showCopyButton` | `boolean`                | `true`      | Show the clipboard copy button.                     |
| `icon`           | `React.ReactNode`        | `undefined` | Replace the default quote icon with a custom node.  |

## Examples

### With Source

```tsx
<Quote
  text="In the middle of every difficulty lies opportunity."
  author="Albert Einstein"
  source="Quoted in The Saturday Evening Post, 1955"
/>
```

### Carousel Navigation

Pass `showNavigation` together with `onSwipeLeft` / `onSwipeRight` to enable both the swipe gesture and the visible arrow buttons.

```tsx
const [index, setIndex] = useState(0);
const quotes = [
  /* ... */
];

<Quote
  text={quotes[index].text}
  author={quotes[index].author}
  showNavigation
  onSwipeLeft={() => setIndex((i) => Math.min(i + 1, quotes.length - 1))}
  onSwipeRight={() => setIndex((i) => Math.max(i - 1, 0))}
/>;
```

### Copy Callback

```tsx
<Quote
  text="Stay hungry, stay foolish."
  author="Steve Jobs"
  onCopy={(text) => analytics.track('quote_copied', { text })}
/>
```

### Hide Copy Button

```tsx
<Quote
  text="Be the change you wish to see in the world."
  author="Mahatma Gandhi"
  showCopyButton={false}
/>
```

### Custom Icon

```tsx
<Quote
  text="Imagination is more important than knowledge."
  author="Albert Einstein"
  icon={<span className="text-4xl">✦</span>}
/>
```

## Gesture Support

The component wraps its content in `GestureHandler`, which listens for touch events and maps them to the corresponding callbacks:

| Gesture     | Prop triggered | Notes                                                    |
| ----------- | -------------- | -------------------------------------------------------- |
| Swipe left  | `onSwipeLeft`  | Default threshold: 50 px                                 |
| Swipe right | `onSwipeRight` | Default threshold: 50 px                                 |
| Pinch in    | `onPinchIn`    | Two-finger pinch closed                                  |
| Pinch out   | `onPinchOut`   | Two-finger pinch open                                    |
| Tap         | —              | Triggers the copy action when `showCopyButton` is `true` |

### iOS behaviour

On iOS, custom gestures are disabled by default to avoid conflicting with the native swipe-to-go-back gesture. A toggle button ("Gestures On / Off") appears in the top-right corner of the component on iOS devices so users can opt in.

## Copy Behaviour

- Clicking the copy button (or tapping on the quote on touch devices) writes `text` to the clipboard via `navigator.clipboard.writeText`.
- The icon switches from a `Copy` icon to a `Check` icon for 2 seconds, then resets.
- The `onCopy` callback is fired immediately after the write, receiving the quote text as an argument.

## Accessibility

| Feature                  | Implementation                                                    |
| ------------------------ | ----------------------------------------------------------------- |
| Landmark role            | `role="article"` on the root element                              |
| Accessible name          | `aria-label="Quote by {author}"` (falls back to "Unknown author") |
| Copy button label        | `aria-label="Copy quote to clipboard"` / `"Copied to clipboard"`  |
| Navigation button labels | `aria-label="Previous quote"` / `"Next quote"`                    |
| Semantic quote markup    | `<blockquote>` + `<cite>` for screen-reader context               |
| Keyboard focus ring      | `focus:ring-2 focus:ring-purple-500` on interactive controls      |

## Dark Mode

All colours use Tailwind `dark:` variants and adapt automatically when the application switches to dark mode. No extra configuration is required.

```tsx
// Renders correctly in both light and dark themes
<Quote text="The best way to predict the future is to create it." author="Peter Drucker" />
```
