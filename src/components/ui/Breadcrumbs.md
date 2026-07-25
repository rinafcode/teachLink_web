# Breadcrumbs Component

A Material Design breadcrumb navigation component for React/Next.js applications.

## Features

- ✅ **Material Design 3** styling with proper elevation and spacing
- ♿ **Accessible** with ARIA labels and keyboard navigation support
- 🌓 **Dark mode** support with Tailwind CSS
- 📱 **Responsive** design with mobile overflow handling
- 🎨 **Customizable** separators and icons
- ⚡ **Animated** variant with Framer Motion
- 🔄 **Collapsible** breadcrumbs for long paths
- 🎯 **TypeScript** support with full type definitions

## Installation

The component is already installed in the project. Import it from:

```tsx
import { Breadcrumbs, AnimatedBreadcrumbs, type BreadcrumbItem } from '@/components/ui/Breadcrumbs';
// or
import { Breadcrumbs } from '@/components/ui';
```

## Basic Usage

```tsx
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

function MyPage() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Home', href: '/' },
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Analytics', current: true },
      ]}
    />
  );
}
```

## Props

### BreadcrumbsProps

| Prop           | Type               | Default                   | Description                                    |
| -------------- | ------------------ | ------------------------- | ---------------------------------------------- |
| `items`        | `BreadcrumbItem[]` | **required**              | Array of breadcrumb items to display           |
| `separator`    | `React.ReactNode`  | `<ChevronRight />`        | Custom separator component                     |
| `showHomeIcon` | `boolean`          | `false`                   | Show home icon for first item                  |
| `maxItems`     | `number`           | `0`                       | Maximum items before collapsing (0 = no limit) |
| `className`    | `string`           | `''`                      | Custom CSS classes for the nav element         |
| `ariaLabel`    | `string`           | `'Breadcrumb navigation'` | ARIA label for navigation                      |
| `isLoading`    | `boolean`          | `false`                   | Enable skeleton loading state                  |

### BreadcrumbItem

| Property  | Type                            | Required | Description                                |
| --------- | ------------------------------- | -------- | ------------------------------------------ |
| `label`   | `string`                        | ✅       | Display text for the breadcrumb            |
| `href`    | `string`                        | ❌       | URL to navigate to (omit for current page) |
| `icon`    | `React.ReactNode`               | ❌       | Optional icon component                    |
| `current` | `boolean`                       | ❌       | Whether this is the current page           |
| `onClick` | `(e: React.MouseEvent) => void` | ❌       | Custom click handler                       |

## Examples

### Basic Breadcrumbs

```tsx
<Breadcrumbs
  items={[
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Laptop', current: true },
  ]}
/>
```

### With Home Icon

```tsx
<Breadcrumbs
  showHomeIcon
  items={[
    { label: 'Home', href: '/' },
    { label: 'Settings', href: '/settings' },
    { label: 'Profile', current: true },
  ]}
/>
```

### With Custom Icons

```tsx
import { Home, Folder, FileText } from 'lucide-react';

<Breadcrumbs
  items={[
    { label: 'Home', href: '/', icon: <Home className="w-4 h-4" /> },
    { label: 'Documents', href: '/docs', icon: <Folder className="w-4 h-4" /> },
    { label: 'Report.pdf', current: true, icon: <FileText className="w-4 h-4" /> },
  ]}
/>;
```

### With Custom Separator

```tsx
<Breadcrumbs
  separator={<span className="mx-2">/</span>}
  items={[
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: 'Post Title', current: true },
  ]}
/>
```

### Collapsed Breadcrumbs

For long paths, use `maxItems` to collapse middle items:

```tsx
<Breadcrumbs
  maxItems={3}
  items={[
    { label: 'Home', href: '/' },
    { label: 'Level 1', href: '/level1' },
    { label: 'Level 2', href: '/level2' },
    { label: 'Level 3', href: '/level3' },
    { label: 'Level 4', href: '/level4' },
    { label: 'Current', current: true },
  ]}
/>
// Displays: Home > ... > Level 4 > Current
```

### With Custom Click Handler

Useful for client-side navigation or drill-down interfaces:

```tsx
<Breadcrumbs
  items={[
    {
      label: 'All Data',
      href: '#',
      onClick: (e) => {
        e.preventDefault();
        handleBackToOverview();
      },
    },
    { label: 'Filtered View', current: true },
  ]}
/>
```

### Animated Breadcrumbs

Use the animated variant for smooth transitions:

```tsx
import { AnimatedBreadcrumbs } from '@/components/ui/Breadcrumbs';

<AnimatedBreadcrumbs
  items={[
    { label: 'Home', href: '/' },
    { label: 'Dashboard', current: true },
  ]}
/>;
```

### Loading State Breadcrumbs

Enable skeleton loading state when fetching breadcrumb data:

```tsx
<Breadcrumbs
  isLoading={true}
  items={[
    { label: 'Home', href: '/' },
    { label: 'Dashboard', current: true },
  ]}
/>
```

The loading state displays animated skeleton placeholders that maintain the breadcrumb layout while data is being loaded. This improves perceived performance and prevents layout shifts.

### With Custom Styling

```tsx
<Breadcrumbs
  className="my-4 px-6"
  items={[
    { label: 'Home', href: '/' },
    { label: 'Current Page', current: true },
  ]}
/>
```

## Accessibility

The Breadcrumbs component follows WCAG 2.1 Level AA guidelines:

- ✅ Proper semantic HTML with `<nav>` and `<ol>` elements
- ✅ ARIA labels for screen readers
- ✅ `aria-current="page"` for current page indication
- ✅ Keyboard navigation support (Tab, Enter)
- ✅ Focus indicators for keyboard users
- ✅ Separators hidden from screen readers with `aria-hidden`

## Styling

The component uses Tailwind CSS classes and supports:

- Light and dark mode
- Hover states
- Focus-visible states for keyboard navigation
- Smooth transitions
- Responsive design

### Customizing Colors

Override the default colors using Tailwind classes:

```tsx
<Breadcrumbs className="[&_a]:text-blue-600 [&_a:hover]:text-blue-800" items={items} />
```

## Integration Examples

### With Next.js App Router

```tsx
// app/dashboard/analytics/page.tsx
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function AnalyticsPage() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Analytics', current: true },
        ]}
      />
      <h1>Analytics Dashboard</h1>
      {/* Page content */}
    </div>
  );
}
```

### Dynamic Breadcrumbs from Route

```tsx
'use client';

import { usePathname } from 'next/navigation';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/Breadcrumbs';

export function DynamicBreadcrumbs() {
  const pathname = usePathname();

  const items: BreadcrumbItem[] = pathname
    .split('/')
    .filter(Boolean)
    .map((segment, index, array) => ({
      label: segment.charAt(0).toUpperCase() + segment.slice(1),
      href: index === array.length - 1 ? undefined : `/${array.slice(0, index + 1).join('/')}`,
      current: index === array.length - 1,
    }));

  return <Breadcrumbs items={[{ label: 'Home', href: '/' }, ...items]} />;
}
```

### With Internationalization

```tsx
import { useInternationalization } from '@/hooks/useInternationalization';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

function LocalizedBreadcrumbs() {
  const { t } = useInternationalization();

  return (
    <Breadcrumbs
      ariaLabel={t('navigation.breadcrumb')}
      items={[
        { label: t('navigation.home'), href: '/' },
        { label: t('navigation.dashboard'), href: '/dashboard' },
        { label: t('navigation.analytics'), current: true },
      ]}
    />
  );
}
```

## Testing

The component includes comprehensive tests covering:

- Rendering with various configurations
- Navigation behavior
- Accessibility features
- Separator rendering
- Collapsed breadcrumbs
- Styling and interactions
- Edge cases

Run tests with:

```bash
npm test -- src/components/ui/__tests__/Breadcrumbs.test.tsx
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Related Components

- `Header` - Main navigation header
- `Sidebar` - Side navigation menu
- `Tabs` - Tab navigation

## Migration Guide

### Replacing Inline Breadcrumbs

**Before:**

```tsx
<div className="flex items-center gap-1.5 text-sm">
  <Link href="/" className="text-blue-600 hover:underline">
    Home
  </Link>
  <ChevronRight className="w-4 h-4" />
  <span className="font-semibold">Current</span>
</div>
```

**After:**

```tsx
<Breadcrumbs
  items={[
    { label: 'Home', href: '/' },
    { label: 'Current', current: true },
  ]}
/>
```

## License

Part of the TeachLink project.
