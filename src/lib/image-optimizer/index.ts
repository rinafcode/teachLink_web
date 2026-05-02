/**
 * Image optimizer utilities for responsive image delivery.
 * Supports Next.js built-in optimization, Cloudinary, and Imgix CDNs.
 */

export type ImageFormat = 'auto' | 'webp' | 'avif' | 'jpg' | 'png';

export interface ImageOptimizerOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: ImageFormat;
}

export type CDNProvider = 'next' | 'cloudinary' | 'imgix';

const DEFAULT_QUALITY = 75;

/**
 * Build a Cloudinary URL with transformation parameters.
 * Requires NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME env var.
 */
function buildCloudinaryUrl(src: string, opts: ImageOptimizerOptions): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return src;

  const transforms: string[] = ['f_auto', 'q_auto'];
  if (opts.width) transforms.push(`w_${opts.width}`);
  if (opts.height) transforms.push(`h_${opts.height}`);
  if (opts.quality) transforms.push(`q_${opts.quality}`);

  return `https://res.cloudinary.com/${cloudName}/image/fetch/${transforms.join(',')}/${src}`;
}

/**
 * Build an Imgix URL with transformation parameters.
 * Requires NEXT_PUBLIC_IMGIX_DOMAIN env var.
 */
function buildImgixUrl(src: string, opts: ImageOptimizerOptions): string {
  const domain = process.env.NEXT_PUBLIC_IMGIX_DOMAIN;
  if (!domain) return src;

  const params = new URLSearchParams({ auto: 'format,compress' });
  if (opts.width) params.set('w', String(opts.width));
  if (opts.height) params.set('h', String(opts.height));
  if (opts.quality) params.set('q', String(opts.quality));

  const path = src.startsWith('http') ? encodeURIComponent(src) : src;
  return `https://${domain}/${path}?${params.toString()}`;
}

/**
 * Returns an optimized image URL for the given CDN provider.
 * Falls back to the original src when no CDN is configured.
 */
export function getOptimizedUrl(
  src: string,
  opts: ImageOptimizerOptions = {},
  provider: CDNProvider = 'next'
): string {
  const options = { quality: DEFAULT_QUALITY, ...opts };

  switch (provider) {
    case 'cloudinary':
      return buildCloudinaryUrl(src, options);
    case 'imgix':
      return buildImgixUrl(src, options);
    default:
      return src; // Next.js handles optimization natively via <Image>
  }
}

/**
 * Generate a srcset string for a given set of widths.
 */
export function buildSrcSet(
  src: string,
  widths: number[],
  opts: Omit<ImageOptimizerOptions, 'width'> = {},
  provider: CDNProvider = 'next'
): string {
  return widths
    .map((w) => `${getOptimizedUrl(src, { ...opts, width: w }, provider)} ${w}w`)
    .join(', ');
}

/** Common responsive sizes attribute values */
export const SIZES = {
  full: '100vw',
  half: '(min-width: 768px) 50vw, 100vw',
  third: '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw',
  avatar: '(min-width: 768px) 96px, 64px',
} as const;
