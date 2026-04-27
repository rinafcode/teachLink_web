# QR Code Generation Feature

## Overview

The QR Code Generation feature enables users to easily share TeachLink resources (posts, profiles, topics) via QR codes. The implementation provides a customizable, accessible component with support for downloading, printing, and copying QR codes.

## Components

### 1. `QRCodeComponent`

A React component for rendering QR codes with customizable styling and options.

**Location**: `src/components/QRCode.tsx`

**Usage**:

```tsx
import { QRCodeComponent } from '@/components';

export function MyComponent() {
  return (
    <QRCodeComponent
      value="https://teachlink.com/post/123"
      size={256}
      level="H"
      fgColor="#3b82f6"
      bgColor="#ffffff"
    />
  );
}
```

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | string | - | URL or text to encode (required) |
| `size` | number | 256 | Size of QR code in pixels |
| `level` | 'L' \| 'M' \| 'Q' \| 'H' | 'H' | Error correction level |
| `includeMargin` | boolean | true | Include quiet zone around QR code |
| `bgColor` | string | '#ffffff' | Background color (hex or CSS color) |
| `fgColor` | string | '#000000' | Foreground/module color |
| `className` | string | '' | Additional CSS classes |
| `onRender` | function | - | Callback when QR code renders |
| `ref` | React.Ref | - | Canvas element ref for programmatic access |

### 2. `ShareModal`

A modal component providing a complete share interface with QR code and action buttons for download, print, and copy operations.

**Location**: `src/components/ShareModal.tsx`

**Usage**:

```tsx
'use client';

import { useState } from 'react';
import { ShareModal } from '@/components';

export function PostCard() {
  const [showShare, setShowShare] = useState(false);

  return (
    <>
      <button onClick={() => setShowShare(true)}>Share</button>
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        shareUrl="https://teachlink.com/post/123"
        title="Share this post"
        description="Scan to view the full post"
        qrSize={256}
        fgColor="#000000"
        bgColor="#ffffff"
      />
    </>
  );
}
```

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | - | Controls modal visibility (required) |
| `onClose` | function | - | Callback when modal closes (required) |
| `shareUrl` | string | - | URL to encode in QR code (required) |
| `title` | string | 'Share this content' | Modal title |
| `description` | string | 'Scan the QR code to open' | Description text |
| `qrSize` | number | 256 | Size of QR code |
| `fgColor` | string | '#000000' | QR code foreground color |
| `bgColor` | string | '#ffffff' | QR code background color |

**Features**:

- ✅ Download QR code as PNG
- ✅ Print QR code
- ✅ Copy QR code to clipboard
- ✅ Copy shareable URL
- ✅ Dark mode support
- ✅ Accessibility compliant (ARIA labels, keyboard support)

### 3. Utility Functions

**Location**: `src/utils/generate-qr.ts`

#### `isValidQRUrl(url: string): boolean`

Validates whether a string is a valid URL for QR code generation.

```tsx
isValidQRUrl('https://teachlink.com'); // true
isValidQRUrl(''); // false
```

#### `generateQRCodeData(text: string, options?: QRCodeOptions)`

Generates QR code configuration data with merged options.

```tsx
const config = generateQRCodeData('https://teachlink.com', {
  size: 512,
  fgColor: '#3b82f6',
});
```

#### `downloadQRCode(canvas: HTMLCanvasElement, filename?: string)`

Downloads a QR code from a canvas element as PNG.

```tsx
const canvasRef = useRef<HTMLCanvasElement>(null);

const handleDownload = async () => {
  if (canvasRef.current) {
    await downloadQRCode(canvasRef.current, 'my-qrcode.png');
  }
};
```

#### `printQRCode(canvas: HTMLCanvasElement)`

Opens the browser print dialog for a QR code.

```tsx
const handlePrint = async () => {
  if (canvasRef.current) {
    await printQRCode(canvasRef.current);
  }
};
```

#### `copyQRCodeToClipboard(canvas: HTMLCanvasElement)`

Copies a QR code image to the clipboard.

```tsx
const handleCopy = async () => {
  if (canvasRef.current) {
    await copyQRCodeToClipboard(canvasRef.current);
  }
};
```

#### `generateQRCodeUrl(text: string): string`

Generates a QR code data URL using an external service (fallback).

```tsx
const qrImageUrl = generateQRCodeUrl('https://teachlink.com/post/123');
// Returns: https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=...
```

## Usage Examples

### Basic Post Share Button

```tsx
'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { ShareModal } from '@/components';

interface PostHeaderProps {
  postId: string;
  title: string;
}

export function PostHeader({ postId, title }: PostHeaderProps) {
  const [showShare, setShowShare] = useState(false);
  const shareUrl = `${process.env.NEXT_PUBLIC_DOMAIN}/post/${postId}`;

  return (
    <>
      <header className="flex justify-between items-center">
        <h1>{title}</h1>
        <button
          onClick={() => setShowShare(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Share2 size={18} />
          Share
        </button>
      </header>

      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        shareUrl={shareUrl}
        title={`Share "${title}"`}
        description="Scan to view this post"
      />
    </>
  );
}
```

### Profile Share Card

```tsx
'use client';

import { useState } from 'react';
import { ShareModal } from '@/components';

interface ProfileCardProps {
  username: string;
  profileId: string;
  avatar?: string;
}

export function ProfileCard({ username, profileId, avatar }: ProfileCardProps) {
  const [showShare, setShowShare] = useState(false);
  const shareUrl = `${process.env.NEXT_PUBLIC_DOMAIN}/profile/${username}`;

  return (
    <div className="border rounded-lg p-4">
      {avatar && <img src={avatar} alt={username} className="w-12 h-12 rounded-full" />}
      <h2>{username}</h2>
      
      <button
        onClick={() => setShowShare(true)}
        className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
      >
        Share Profile
      </button>

      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        shareUrl={shareUrl}
        title={`Share ${username}'s Profile`}
        description="Scan to view their profile"
        fgColor="#3b82f6"
      />
    </div>
  );
}
```

### Topic Page QR

```tsx
'use client';

import { useState } from 'react';
import { QRCodeComponent, ShareModal } from '@/components';

export function TopicHeader({ topicSlug, topicName }: { topicSlug: string; topicName: string }) {
  const [showShare, setShowShare] = useState(false);
  const shareUrl = `${process.env.NEXT_PUBLIC_DOMAIN}/topics/${topicSlug}`;

  return (
    <div className="space-y-4">
      <h1>{topicName}</h1>

      <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg inline-block">
        <QRCodeComponent
          value={shareUrl}
          size={200}
          level="H"
          fgColor="#2563eb"
        />
      </div>

      <button
        onClick={() => setShowShare(true)}
        className="block bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        More sharing options
      </button>

      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        shareUrl={shareUrl}
        title={`Share ${topicName}`}
      />
    </div>
  );
}
```

## Styling

### Customizing QR Code Colors

```tsx
// Blue theme
<ShareModal
  shareUrl={url}
  fgColor="#3b82f6"  // Blue modules
  bgColor="#f0f9ff"  // Light blue background
/>

// Dark theme
<ShareModal
  shareUrl={url}
  fgColor="#ffffff"  // White modules
  bgColor="#1f2937"  // Dark background
/>
```

### Responsive Sizing

```tsx
// Mobile
<QRCodeComponent value={url} size={128} />

// Tablet
<QRCodeComponent value={url} size={200} />

// Desktop
<QRCodeComponent value={url} size={256} />
```

## Accessibility

- All buttons have `aria-label` and `title` attributes
- Modal uses ARIA roles and manages focus
- Keyboard navigation support (Escape to close)
- Screen reader announcements for actions
- High contrast in dark mode
- Color-independent status indication (icons + text)

## Error Handling

The feature includes comprehensive error handling:

```tsx
// Validation
if (!isValidQRUrl(url)) {
  throw new Error('Invalid URL for QR code');
}

// Download errors
try {
  await downloadQRCode(canvas);
} catch (error) {
  toast.error('Failed to download QR code');
}

// Print errors
try {
  await printQRCode(canvas);
} catch (error) {
  toast.error('Failed to open print dialog');
}
```

## Environment Setup

### Required Environment Variables

```bash
# Optional: Set custom domain for QR code URLs
NEXT_PUBLIC_DOMAIN=https://teachlink.com
```

### Dependencies

- `qrcode.react` ^1.0.1 - QR code generation
- `lucide-react` - Icons (Download, Printer, Copy, Close)
- `react-hot-toast` - Notifications

## Testing

### Run Tests

```bash
npm run test -- src/utils/generate-qr.test.ts
npm run test -- src/components/__tests__/QRCode.test.tsx
npm run test -- src/components/__tests__/ShareModal.test.tsx
```

### Test Coverage

The implementation includes unit tests for:

- ✅ URL validation
- ✅ QR code generation
- ✅ Download functionality
- ✅ Print functionality
- ✅ Clipboard operations
- ✅ Component rendering
- ✅ Error handling

## Performance Considerations

1. **Canvas Rendering**: QR codes are rendered once and cached
2. **Lazy Loading**: Modal content loads on demand
3. **Image Optimization**: PNG format for crisp QR code rendering
4. **Memory Efficiency**: Canvas references properly cleaned up

## Browser Support

- ✅ Chrome/Edge 96+
- ✅ Firefox 95+
- ✅ Safari 15+
- ✅ Mobile browsers (iOS Safari 15+, Chrome Android)

**Note**: Clipboard API requires HTTPS (except localhost)

## Troubleshooting

### QR Code not displaying

```tsx
// Ensure value is provided
<QRCodeComponent value={shareUrl} /> // ✅
<QRCodeComponent /> // ❌ Will show "No value provided"
```

### Copy to clipboard not working

- Check browser is using HTTPS (or localhost for development)
- Verify `qrRef.current` is properly set
- Use fallback: Only copy URL text instead

### Print dialog not opening

- Ensure `qrRef.current` is available
- Check browser print settings aren't blocking preview

## Future Enhancements

- [ ] Custom QR code logos/branding
- [ ] Social media-specific QR codes
- [ ] Analytics tracking for QR scans
- [ ] Batch QR code generation
- [ ] Different QR data formats (WiFi, vCard, etc.)
- [ ] Color picker UI for custom themes

## Contribution Guidelines

When adding QR code features:

1. Maintain accessibility standards
2. Add tests for new utilities
3. Update TypeScript types
4. Document new props/functions
5. Test in light and dark modes
6. Ensure mobile responsiveness
7. Follow existing code patterns

## References

- [qrcode.react Documentation](https://github.com/zpao/qrcode.react)
- [QR Code Specifications](https://en.wikipedia.org/wiki/QR_code)
- [Error Correction Levels](https://www.qr-code-generator.com/qr-code-documentation/about-qr-code/)
- [Accessibility Guidelines](https://www.w3.org/WAI/tutorials/images/)
