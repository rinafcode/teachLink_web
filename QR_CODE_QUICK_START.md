# QR Code Feature - Quick Start Guide

## 🚀 Five-Minute Setup

### 1. Install Dependencies
The required package `qrcode.react` has already been added to `package.json`. Just run:

```bash
npm install
```

### 2. Basic Usage - Share a Post

```tsx
'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { ShareModal } from '@/components';

export function PostHeader({ postId, title }) {
  const [showShare, setShowShare] = useState(false);

  return (
    <>
      <div className="flex justify-between items-center">
        <h1>{title}</h1>
        <button
          onClick={() => setShowShare(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          <Share2 size={18} />
          Share
        </button>
      </div>

      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        shareUrl={`https://teachlink.com/post/${postId}`}
        title="Share this post"
      />
    </>
  );
}
```

### 3. Display QR Code Inline

```tsx
import { QRCodeComponent } from '@/components';

export function TopicCard({ topicSlug }) {
  return (
    <div className="border rounded-lg p-4">
      <h2>Share via QR</h2>
      <QRCodeComponent
        value={`https://teachlink.com/topics/${topicSlug}`}
        size={200}
      />
    </div>
  );
}
```

## 📚 Common Patterns

### Pattern 1: Profile Sharing
```tsx
export function ProfileCard({ username }) {
  const [showShare, setShowShare] = useState(false);

  return (
    <>
      <button onClick={() => setShowShare(true)}>Share Profile</button>
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        shareUrl={`https://teachlink.com/profile/${username}`}
        title={`Share ${username}'s Profile`}
        fgColor="#3b82f6"
      />
    </>
  );
}
```

### Pattern 2: Resource Card with QR
```tsx
export function ResourceCard({ resourceId, title }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <QRCodeComponent
        value={`https://teachlink.com/resource/${resourceId}`}
        size={150}
      />
      <p className="text-xs text-gray-500 mt-2">Scan to access</p>
    </div>
  );
}
```

### Pattern 3: Full Page Share
```tsx
export function SharePage({ item }) {
  const [showShare, setShowShare] = useState(false);

  return (
    <div className="page-layout">
      <header>
        <h1>{item.title}</h1>
        <button onClick={() => setShowShare(true)}>Share</button>
      </header>

      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        shareUrl={`${process.env.NEXT_PUBLIC_DOMAIN}/${item.type}/${item.id}`}
        title={`Share ${item.type}`}
        description={`Share this ${item.type} with others`}
        qrSize={300}
      />
    </div>
  );
}
```

## 🎨 Customization

### Custom Colors
```tsx
<ShareModal
  shareUrl={url}
  title="Share"
  fgColor="#dc2626"      // Red QR code
  bgColor="#fef2f2"      // Light red background
/>
```

### Different Sizes
```tsx
// Mobile
<QRCodeComponent value={url} size={128} />

// Desktop
<QRCodeComponent value={url} size={384} />
```

### Themed QR Code
```tsx
// Dark mode
<QRCodeComponent
  value={url}
  fgColor="#ffffff"      // White modules
  bgColor="#1f2937"      // Dark background
/>

// Brand color
<QRCodeComponent
  value={url}
  fgColor="#3b82f6"      // Blue modules
  bgColor="#f0f9ff"      // Light blue background
/>
```

## ✅ Accepted Use Cases

### ✅ Do Use For:
- Post/article sharing
- Profile links
- Topic pages
- Resource downloads
- Event registration
- Classroom resources
- External links
- Mobile deeplinks

### ❌ Don't Use For:
- Private/sensitive content
- Authentication tokens
- Large data payloads (QR codes have limits)
- Real-time changing content (use API endpoints)

## 🔧 Common Customizations

### Custom Share URL Format
```tsx
// Your custom URL scheme
const shareUrl = `teachlink://post/${postId}?utm_source=qr&utm_medium=share`;

<ShareModal
  isOpen={showShare}
  onClose={() => setShowShare(false)}
  shareUrl={shareUrl}
/>
```

### Conditional Rendering
```tsx
export function ShareButton({ isLoggedIn, itemId }) {
  const [showShare, setShowShare] = useState(false);

  if (!isLoggedIn) {
    return <button disabled>Login to share</button>;
  }

  return (
    <>
      <button onClick={() => setShowShare(true)}>Share</button>
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        shareUrl={`https://teachlink.com/post/${itemId}`}
      />
    </>
  );
}
```

### With Error Boundaries
```tsx
import { ErrorBoundarySystem } from '@/components';

export function SafeShare({ itemId }) {
  return (
    <ErrorBoundarySystem>
      <ShareModal
        isOpen={true}
        onClose={() => {}}
        shareUrl={`https://teachlink.com/post/${itemId}`}
      />
    </ErrorBoundarySystem>
  );
}
```

## 🧪 Testing in Development

### View the Demo Page
```
http://localhost:3000/qr-code-demo
```

### Test Different URLs
1. Open `/qr-code-demo`
2. Modify the URL input
3. Use the QR preview
4. Test download, print, and copy

### Test on Mobile
1. Use browser DevTools mobile view
2. Or access demo on actual mobile device
3. Scan QR with phone camera
4. Share functionality works on mobile

## 📋 Integration Checklist

- [ ] Import `ShareModal` or `QRCodeComponent`
- [ ] Add `'use client'` directive if on server component
- [ ] Use `useState` to manage modal visibility
- [ ] Provide `shareUrl` with full domain
- [ ] Test in light and dark modes
- [ ] Test on mobile viewport
- [ ] Verify URL accessibility
- [ ] Add loading/error states if needed
- [ ] Customize colors if brand-specific

## 🐛 Troubleshooting

### QR Code not showing?
```tsx
// ❌ Wrong
<QRCodeComponent value="" />

// ✅ Correct
<QRCodeComponent value="https://example.com" />
```

### Copy not working?
- Check browser is HTTPS (or localhost)
- Test in a different browser
- Check browser permissions

### Share Modal styling issues?
- Verify Tailwind CSS is loaded
- Check dark mode context is available
- Inspect Modal parent styling

### Download not working?
- Check browser popup blocking
- Try a different file format
- Browser might not support canvas download

## 📞 Get Help

- **Demo Page**: Visit `/qr-code-demo` for live examples
- **Documentation**: See [QR_CODE_FEATURE.md](./QR_CODE_FEATURE.md)
- **API Reference**: Check component JSDoc comments
- **Tests**: See `src/utils/__tests__/generate-qr.test.ts`

## 🎓 Learn More

- [qrcode.react Documentation](https://github.com/zpao/qrcode.react)
- [Lucide React Icons](https://lucide.dev)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com)

---

**Happy Coding!** 🚀

Start by copying one of the patterns above and customize it for your use case.
