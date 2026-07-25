# Mobile Components & Responsive Navigation

This folder contains mobile-optimized UI elements, touch gesture handlers, adaptive layouts, and responsive navigation controls designed for the TeachLink platform.

---

## 📱 MobileNavigation

A fully responsive, highly accessible, and visually premium navigation component that adapts dynamically to different viewport aspect ratios, orientations, and touch constraints.

### 🌟 Key Features

1. **Orientation & Viewport Adaptability**:

   - **Portrait Mobile (`< 640px`)**: Translucent bottom navigation bar with a glassmorphic background blur, optimized for single-handed thumb interaction.
   - **Landscape Mobile & Compact Tablets (`640px <= width < 1024px`)**: Vertical left navigation rail, preserving precious vertical height in landscape orientation and displaying compact icon buttons.
   - **Desktop View (`>= 1024px`)**: Automatically hidden (`lg:hidden`) to avoid visual redundancies with the main desktop Header.

2. **Safe-Area Insets**:

   - Implements robust safe-area bounds on notch, dynamic island, and rounded-corner devices held in either portrait (`env(safe-area-inset-bottom)`) or landscape (`env(safe-area-inset-left)` / `env(safe-area-inset-right)`) orientation.

3. **WAI-ARIA & WCAG 2.1 AA Accessibility**:

   - **Keyboard Navigation**: Implements robust keyboard interaction using arrow keys (`ArrowRight`/`ArrowDown` for forward, `ArrowLeft`/`ArrowUp` for backward, `Home` for first, `End` for last item).
   - **Interactive Sequences**: Only the active tab is in the focus stream (`tabIndex={0}`), while inactive ones are excluded (`tabIndex={-1}`), preventing keyboard clutter.
   - **Semantic Roles**: Proper container (`role="tablist"`), tab controls (`role="tab"`), active states (`aria-selected`), and descriptive labels (`aria-label`).
   - **Accessible Focus**: High-contrast outline states via Tailwind focus-ring overrides.

4. **Rich Visual Aesthetics**:
   - Animated visual indicators: an active indicator dot on bottom portrait nav, and a sleek vertical bar on the left sidebar rail.
   - Smooth transform scale-up animations on active icons.

---

### 🛠️ API & Component Interface

```tsx
import { MobileNavigation } from '@/components/mobile/MobileNavigation';

function Layout() {
  const handleNavChange = (activeTabId: string) => {
    console.log(`Switched to tab: ${activeTabId}`);
  };

  return <MobileNavigation initialActive="home" onNavChange={handleNavChange} />;
}
```

---

### 🧪 Testing

Automated unit and interaction tests are located at `__tests__/MobileNavigation.test.tsx` and can be run via:

```bash
pnpm test src/components/mobile/__tests__/MobileNavigation.test.tsx
```

The test suite covers:

- Successful rendering of all semantic navigation items.
- Correct active tab and initial state styling.
- Callback triggers (`onNavChange`) when clicking tabs.
- Arrow key keyboard navigation sequence matches.
- Correct CSS class responsive transitions (portrait vs landscape/tablet widths).
- Safe area boundaries styles check.

---

## 🧱 Other Mobile Components

### 📐 AdaptiveLayouts

Provides the `AdaptiveLayout` component which dynamically toggles rendering between a `mobileView` and `desktopView` based on window width and mobile device detection. It includes a debounced performance handler for resize events.

### 👆 GestureHandler

A lightweight, performant drag and swipe detector translating native touch inputs into callbacks (`onSwipeLeft`, `onSwipeRight`, `onSwipeUp`, `onSwipeDown`).

### 📦 MobileOptimizedComponents

- **TouchButton**: Enhanced tap button with large hit area (min 48px height) and touch cancel event detection.
- **SwipeableCard**: Gesture-ready container utilizing the touch handler.
- **BottomSheet**: A premium sliding modal drawer entering from the bottom of the viewport, supporting drag-to-dismiss swipes.

### 🎨 TouchOptimizedUI

Provides pre-styled, touch-friendly `TouchButton` and `TouchCard` elements ensuring clean active feedback scaling states and meeting WCAG target sizes (min 44x44px).
