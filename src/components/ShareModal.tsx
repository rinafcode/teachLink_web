'use client';

import { useRef, useState, useCallback } from 'react';
import { Download, Printer, Copy, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import QRCodeComponent from '@/components/QRCode';
import { downloadQRCode, printQRCode, copyQRCodeToClipboard } from '@/utils/generate-qr';
import toast from 'react-hot-toast';

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** URL or data to share via QR code */
  shareUrl: string;
  /** Title for the modal */
  title?: string;
  /** Description of what's being shared */
  description?: string;
  /** Size of the QR code */
  qrSize?: number;
  /** Custom styling for QR code */
  fgColor?: string;
  bgColor?: string;
}

/**
 * ShareModal Component
 * Displays a QR code with options to download, print, or copy.
 * Ideal for sharing post links, profiles, or other resources.
 *
 * @example
 * ```tsx
 * const [showShare, setShowShare] = useState(false);
 *
 * return (
 *   <>
 *     <button onClick={() => setShowShare(true)}>Share</button>
 *     <ShareModal
 *       isOpen={showShare}
 *       onClose={() => setShowShare(false)}
 *       shareUrl="https://teachlink.com/post/123"
 *       title="Share this post"
 *       description="Scan to view the post"
 *     />
 *   </>
 * );
 * ```
 */
export function ShareModal({
  isOpen,
  onClose,
  shareUrl,
  title = 'Share this content',
  description = 'Scan the QR code to open',
  qrSize = 256,
  fgColor = '#000000',
  bgColor = '#ffffff',
}: ShareModalProps) {
  const qrRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!qrRef.current) return;
    
    try {
      setIsLoading(true);
      await downloadQRCode(qrRef.current, 'teachlink-qrcode.png');
      toast.success('QR code downloaded successfully');
    } catch (error) {
      toast.error('Failed to download QR code');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePrint = useCallback(async () => {
    if (!qrRef.current) return;

    try {
      setIsLoading(true);
      await printQRCode(qrRef.current);
      toast.success('Print dialog opened');
    } catch (error) {
      toast.error('Failed to open print dialog');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCopy = useCallback(async () => {
    if (!qrRef.current) return;

    try {
      setIsLoading(true);
      await copyQRCodeToClipboard(qrRef.current);
      toast.success('QR code copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy QR code');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('URL copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy URL');
      console.error(error);
    }
  }, [shareUrl]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-md">
      <div className="space-y-6">
        {/* Description */}
        {description && <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>}

        {/* QR Code Display */}
        <div className="flex justify-center py-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <QRCodeComponent
            ref={qrRef}
            value={shareUrl}
            size={qrSize}
            level="H"
            includeMargin
            fgColor={fgColor}
            bgColor={bgColor}
            className="qr-code"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleDownload}
            disabled={isLoading}
            className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Download QR code"
            title="Download as PNG"
          >
            <Download size={20} className="text-gray-700 dark:text-gray-300" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Download</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={isLoading}
            className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Print QR code"
            title="Print QR code"
          >
            <Printer size={20} className="text-gray-700 dark:text-gray-300" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Print</span>
          </button>

          <button
            onClick={handleCopy}
            disabled={isLoading}
            className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Copy QR code to clipboard"
            title="Copy to clipboard"
          >
            <Copy size={20} className="text-gray-700 dark:text-gray-300" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Copy</span>
          </button>
        </div>

        {/* URL Copy Section */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Shareable Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <button
              onClick={handleCopyUrl}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              aria-label="Copy URL"
              title="Copy URL to clipboard"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={16} />
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ShareModal;
