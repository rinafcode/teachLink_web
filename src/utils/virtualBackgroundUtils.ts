// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/**
 * Virtual Background Utilities
 * Provides functions for applying virtual backgrounds to video streams
 */

import type { AppSettings } from '@/lib/settings/types';
import { createLogger } from '@/lib/logging';

const logger = createLogger('virtual-background');

export interface VirtualBackgroundConfig {
  enabled: boolean;
  type: 'none' | 'blur' | 'image' | 'color';
  imageUrl?: string;
  blurIntensity?: number;
  backgroundColor?: string;
}

/**
 * Apply virtual background to a video stream using Canvas API
 * @param stream - The original media stream
 * @param config - Virtual background configuration
 * @returns Promise<MediaStream> - New stream with virtual background applied
 */
export async function applyVirtualBackground(
  stream: MediaStream,
  config: VirtualBackgroundConfig,
): Promise<MediaStream> {
  if (!config.enabled || config.type === 'none') {
    return stream;
  }

  const videoTrack = stream.getVideoTracks()[0];
  if (!videoTrack) {
    return stream;
  }

  // Create a canvas for processing
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return stream;
  }

  // Create a video element to capture frames
  const video = document.createElement('video');
  video.srcObject = stream;
  video.autoplay = true;
  video.muted = true;

  await new Promise<void>((resolve) => {
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      resolve();
    };
  });

  // Create a canvas capture stream
  const canvasStream = canvas.captureStream(30);
  const canvasTrack = canvasStream.getVideoTracks()[0];

  // Process frames in real-time
  const processFrame = async () => {
    if (video.readyState < 2) {
      requestAnimationFrame(processFrame);
      return;
    }

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply virtual background effect based on type
    switch (config.type) {
      case 'blur':
        applyBlurBackground(ctx, canvas, config.blurIntensity || 10);
        break;
      case 'image':
        await applyImageBackground(ctx, canvas, config.imageUrl || '');
        break;
      case 'color':
        applyColorBackground(ctx, canvas, config.backgroundColor || '#000000');
        break;
      default:
        break;
    }

    requestAnimationFrame(processFrame);
  };

  processFrame();

  // Create new stream with processed video track and original audio tracks
  const audioTracks = stream.getAudioTracks();
  const newStream = new MediaStream([canvasTrack, ...audioTracks]);

  return newStream;
}

/**
 * Apply blur effect to background (simple implementation)
 * Note: A full implementation would require background segmentation using ML models
 */
function applyBlurBackground(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  intensity: number,
): void {
  // This is a simplified implementation
  // A production implementation would use a segmentation model like
  // TensorFlow.js BodyPix or MediaPipe Selfie Segmentation

  // For now, we'll apply a subtle blur to the entire frame
  // In production, you would segment the user and only blur the background
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  ctx.putImageData(imageData, 0, 0);

  // Apply CSS-style blur filter as a fallback
  ctx.filter = `blur(${intensity / 10}px)`;
}

/**
 * Apply custom image as background
 */
async function applyImageBackground(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  imageUrl: string,
): Promise<void> {
  if (!imageUrl) {
    return;
  }

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    // Draw image as background (scaled to fit)
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const x = (canvas.width - img.width * scale) / 2;
    const y = (canvas.height - img.height * scale) / 2;

    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
  } catch (error) {
    logger.error('Failed to load background image', { error });
  }
}

/**
 * Apply solid color background
 */
function applyColorBackground(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Convert AppSettings to VirtualBackgroundConfig
 */
export function settingsToVirtualBackgroundConfig(settings: AppSettings): VirtualBackgroundConfig {
  return {
    enabled: settings.virtualBackgroundEnabled,
    type: settings.virtualBackgroundType,
    imageUrl: settings.virtualBackgroundImage || undefined,
    blurIntensity: settings.virtualBackgroundBlur,
    backgroundColor: settings.virtualBackgroundColor,
  };
}

/**
 * Validate virtual background image URL
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'data:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate hex color code
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Validate blur intensity (0-100)
 */
export function isValidBlurIntensity(intensity: number): boolean {
  return Number.isInteger(intensity) && intensity >= 0 && intensity <= 100;
}
