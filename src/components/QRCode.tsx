'use client';

import { useRef, forwardRef } from 'react';
import QRCode from 'qrcode.react';
import { QRCodeOptions, DEFAULT_QR_OPTIONS } from '@/utils/generate-qr';

export interface QRCodeComponentProps {
  /** URL or text to encode in QR code */
  value: string;
  /** Size of the QR code in pixels */
  size?: number;
  /** Error correction level */
  level?: 'L' | 'M' | 'Q' | 'H';
  /** Include margin/quiet zone */
  includeMargin?: boolean;
  /** Background color */
  bgColor?: string;
  /** Foreground/module color */
  fgColor?: string;
  /** Additional CSS class names */
  className?: string;
  /** Callback when QR code is rendered */
  onRender?: (ref: HTMLCanvasElement | null) => void;
}

/**
 * QRCode Component
 * Renders a QR code for sharing URLs, text, or other data.
 * Supports custom styling, sizing, and error correction levels.
 *
 * @example
 * ```tsx
 * <QRCodeComponent 
 *   value="https://teachlink.com/post/123"
 *   size={256}
 *   fgColor="#3b82f6"
 * />
 * ```
 */
export const QRCodeComponent = forwardRef<HTMLCanvasElement, QRCodeComponentProps>(
  (
    {
      value,
      size = DEFAULT_QR_OPTIONS.size,
      level = DEFAULT_QR_OPTIONS.level,
      includeMargin = DEFAULT_QR_OPTIONS.includeMargin,
      bgColor = DEFAULT_QR_OPTIONS.bgColor,
      fgColor = DEFAULT_QR_OPTIONS.fgColor,
      className = '',
      onRender,
    },
    ref,
  ) => {
    const localRef = useRef<HTMLCanvasElement>(null);
    const canvasRef = (ref || localRef) as React.RefObject<HTMLCanvasElement>;

    // Handle render callback
    const handleRender = () => {
      if (onRender && canvasRef.current) {
        onRender(canvasRef.current);
      }
    };

    if (!value) {
      return (
        <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
          <p className="text-sm text-gray-500">No value provided</p>
        </div>
      );
    }

    return (
      <div className={`qr-code-container ${className}`}>
        <QRCode
          ref={canvasRef}
          value={value}
          size={size}
          level={level}
          includeMargin={includeMargin}
          bgColor={bgColor}
          fgColor={fgColor}
          onRender={handleRender}
        />
      </div>
    );
  },
);

QRCodeComponent.displayName = 'QRCodeComponent';

export default QRCodeComponent;
