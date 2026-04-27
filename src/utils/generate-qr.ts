/**
 * QR Code Generation Utilities
 * Provides functions for generating and styling QR codes, with support for custom colors and sizes.
 */

export interface QRCodeOptions {
  /** Size of the QR code in pixels */
  size?: number;
  /** Error correction level: 'L', 'M', 'Q', 'H' */
  level?: 'L' | 'M' | 'Q' | 'H';
  /** Include margin/quiet zone around QR code */
  includeMargin?: boolean;
  /** Background color (hex or CSS color) */
  bgColor?: string;
  /** Foreground/module color (hex or CSS color) */
  fgColor?: string;
}

/**
 * Default QR code configuration
 */
export const DEFAULT_QR_OPTIONS: QRCodeOptions = {
  size: 256,
  level: 'H',
  includeMargin: true,
  bgColor: '#ffffff',
  fgColor: '#000000',
};

/**
 * Validates a URL for QR code generation
 * @param url - The URL to validate
 * @returns boolean indicating if URL is valid
 */
export function isValidQRUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    // Check if it's a valid URL or a path
    new URL(url, 'http://example.com');
    return true;
  } catch {
    return false;
  }
}

/**
 * Generates a shareable QR code URL
 * This can be used to generate QR codes from external services if needed
 * @param text - Text or URL to encode
 * @param options - QR code options
 * @returns Generated QR code data
 */
export function generateQRCodeData(text: string, options: QRCodeOptions = DEFAULT_QR_OPTIONS) {
  if (!isValidQRUrl(text)) {
    throw new Error('Invalid URL or text for QR code generation');
  }

  return {
    text,
    options: {
      ...DEFAULT_QR_OPTIONS,
      ...options,
    },
  };
}

/**
 * Downloads a QR code as an image
 * @param canvas - Canvas element containing the QR code
 * @param filename - Name of the downloaded file
 */
export async function downloadQRCode(canvas: HTMLCanvasElement, filename: string = 'qrcode.png') {
  try {
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to download QR code:', error);
    throw new Error('Failed to download QR code');
  }
}

/**
 * Prints a QR code
 * @param canvas - Canvas element containing the QR code
 */
export async function printQRCode(canvas: HTMLCanvasElement) {
  try {
    const url = canvas.toDataURL('image/png');
    const printWindow = window.open();
    if (!printWindow) {
      throw new Error('Failed to open print window');
    }
    printWindow.document.write(`<img src="${url}" style="max-width: 100%; margin: auto;" />`);
    printWindow.document.close();
    printWindow.print();
  } catch (error) {
    console.error('Failed to print QR code:', error);
    throw new Error('Failed to print QR code');
  }
}

/**
 * Copies QR code data URL to clipboard
 * @param canvas - Canvas element containing the QR code
 */
export async function copyQRCodeToClipboard(canvas: HTMLCanvasElement) {
  try {
    const url = canvas.toDataURL('image/png');
    const blob = await fetch(url).then(res => res.blob());
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob,
      }),
    ]);
  } catch (error) {
    console.error('Failed to copy QR code to clipboard:', error);
    throw new Error('Failed to copy QR code to clipboard');
  }
}

/**
 * Generates a QR code data URL for sharing
 * @param text - Text or URL to encode
 * @returns Data URL that can be used for sharing
 */
export function generateQRCodeUrl(text: string): string {
  if (!isValidQRUrl(text)) {
    throw new Error('Invalid URL or text for QR code generation');
  }
  
  // Using a QR code API service as fallback
  // You can replace with your preferred QR code generation endpoint
  const encodedText = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodedText}`;
}
