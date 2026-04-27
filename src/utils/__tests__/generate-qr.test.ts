import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isValidQRUrl,
  generateQRCodeData,
  downloadQRCode,
  printQRCode,
  copyQRCodeToClipboard,
  generateQRCodeUrl,
  DEFAULT_QR_OPTIONS,
} from '../generate-qr';

describe('generate-qr utilities', () => {
  describe('isValidQRUrl', () => {
    it('should validate valid URLs', () => {
      expect(isValidQRUrl('https://teachlink.com')).toBe(true);
      expect(isValidQRUrl('http://example.com')).toBe(true);
      expect(isValidQRUrl('/relative/path')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidQRUrl('')).toBe(false);
      expect(isValidQRUrl(null as unknown as string)).toBe(false);
      expect(isValidQRUrl(undefined as unknown as string)).toBe(false);
    });
  });

  describe('generateQRCodeData', () => {
    it('should generate QR code data with defaults', () => {
      const data = generateQRCodeData('https://teachlink.com');
      expect(data.text).toBe('https://teachlink.com');
      expect(data.options).toEqual(DEFAULT_QR_OPTIONS);
    });

    it('should merge custom options with defaults', () => {
      const customOptions = { size: 512, fgColor: '#3b82f6' };
      const data = generateQRCodeData('https://teachlink.com', customOptions);
      expect(data.options.size).toBe(512);
      expect(data.options.fgColor).toBe('#3b82f6');
      expect(data.options.level).toBe(DEFAULT_QR_OPTIONS.level);
    });

    it('should throw error for invalid URLs', () => {
      expect(() => generateQRCodeData('')).toThrow();
    });
  });

  describe('downloadQRCode', () => {
    let mockCanvas: HTMLCanvasElement;

    beforeEach(() => {
      mockCanvas = document.createElement('canvas');
      mockCanvas.toDataURL = vi.fn(() => 'data:image/png;base64,test');
      
      // Mock DOM methods
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'a') {
          return {
            href: '',
            download: '',
            click: vi.fn(),
            style: {},
          } as unknown as HTMLElement;
        }
        return document.createElement(tag);
      });

      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockCanvas);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockCanvas);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should download QR code', async () => {
      await expect(downloadQRCode(mockCanvas)).resolves.not.toThrow();
    });

    it('should use custom filename', async () => {
      const link = document.createElement('a');
      vi.spyOn(document, 'createElement').mockReturnValueOnce(link);
      await downloadQRCode(mockCanvas, 'custom-qr.png');
      expect(link.download).toBe('custom-qr.png');
    });
  });

  describe('generateQRCodeUrl', () => {
    it('should generate valid QR code URL', () => {
      const url = generateQRCodeUrl('https://teachlink.com/post/123');
      expect(url).toContain('https://api.qrserver.com');
      expect(url).toContain('data=https');
    });

    it('should encode special characters', () => {
      const url = generateQRCodeUrl('https://teachlink.com/path?param=value');
      expect(url).toContain('%3F');
      expect(url).toContain('%3D');
    });

    it('should throw error for invalid URLs', () => {
      expect(() => generateQRCodeUrl('')).toThrow();
    });
  });
});
