'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';
import { SIZES, type CDNProvider, type ImageOptimizerOptions, getOptimizedUrl } from '@/lib/image-optimizer';

export interface ResponsiveImageProps
  extends Omit<ImageProps, 'src' | 'onError'> {
  src: string;
  fallbackSrc?: string;
  /** CDN provider for URL transformation (default: 'next') */
  provider?: CDNProvider;
  /** Optimizer options forwarded to the CDN builder */
  optimizerOptions?: ImageOptimizerOptions;
  /** Predefined sizes shorthand or a custom sizes string */
  responsiveSizes?: keyof typeof SIZES | string;
  /** Wrapper className */
  containerClassName?: string;
}

/**
 * ResponsiveImage — wraps next/image with:
 * - Automatic WebP/AVIF via Next.js image optimization
 * - Optional Cloudinary / Imgix CDN URL building
 * - Native lazy loading (loading="lazy" by default)
 * - Graceful fallback on error
 * - Accessible alt text enforcement
 */
export function ResponsiveImage({
  src,
  fallbackSrc = '/images/placeholder.png',
  provider = 'next',
  optimizerOptions,
  responsiveSizes,
  containerClassName,
  alt,
  sizes,
  priority = false,
  className,
  ...props
}: ResponsiveImageProps) {
  const [imgSrc, setImgSrc] = useState(() =>
    provider !== 'next' ? getOptimizedUrl(src, optimizerOptions, provider) : src
  );

  const resolvedSizes =
    sizes ??
    (responsiveSizes
      ? (SIZES[responsiveSizes as keyof typeof SIZES] ?? responsiveSizes)
      : SIZES.full);

  return (
    <div className={containerClassName}>
      <Image
        {...props}
        src={imgSrc}
        alt={alt}
        sizes={resolvedSizes}
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        className={className}
        onError={() => setImgSrc(fallbackSrc)}
      />
    </div>
  );
}

export default ResponsiveImage;
