'use client';

import { useState, useRef } from 'react';
import { QRCodeComponent, ShareModal } from '@/components';
import { Download, Printer, Copy, Share2 } from 'lucide-react';
import { downloadQRCode, printQRCode, copyQRCodeToClipboard } from '@/utils/generate-qr';
import toast from 'react-hot-toast';

/**
 * QR Code Feature Demo Page
 * Showcases QR code generation, customization, and sharing capabilities
 */
export default function QRCodeDemoPage() {
  const [shareUrl, setShareUrl] = useState('https://teachlink.com/post/demo');
  const [qrSize, setQrSize] = useState(256);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const qrRef = useRef<HTMLCanvasElement>(null);

  const handleDownload = async () => {
    if (!qrRef.current) return;
    try {
      setIsLoading(true);
      await downloadQRCode(qrRef.current, 'teachlink-demo.png');
      toast.success('QR code downloaded!');
    } catch (error) {
      toast.error('Failed to download QR code');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = async () => {
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
  };

  const handleCopy = async () => {
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
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">QR Code Generator Demo</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Generate, customize, and share QR codes for TeachLink content
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - QR Preview */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">QR Code Preview</h2>

              {/* QR Display */}
              <div className="flex justify-center mb-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <QRCodeComponent
                  ref={qrRef}
                  value={shareUrl}
                  size={qrSize}
                  level="H"
                  includeMargin
                  fgColor={fgColor}
                  bgColor={bgColor}
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={handleDownload}
                  disabled={isLoading}
                  className="flex flex-col items-center gap-2 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  title="Download QR code as PNG"
                >
                  <Download size={20} />
                  <span className="text-sm">Download</span>
                </button>

                <button
                  onClick={handlePrint}
                  disabled={isLoading}
                  className="flex flex-col items-center gap-2 p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  title="Print QR code"
                >
                  <Printer size={20} />
                  <span className="text-sm">Print</span>
                </button>

                <button
                  onClick={handleCopy}
                  disabled={isLoading}
                  className="flex flex-col items-center gap-2 p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  title="Copy QR code to clipboard"
                >
                  <Copy size={20} />
                  <span className="text-sm">Copy</span>
                </button>
              </div>

              {/* Share Modal Button */}
              <button
                onClick={() => setShowShareModal(true)}
                className="w-full mt-4 flex items-center justify-center gap-2 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
              >
                <Share2 size={20} />
                Open Share Modal
              </button>
            </div>
          </div>

          {/* Right Column - Controls */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Configuration</h2>

              {/* URL Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Share URL
                </label>
                <input
                  type="text"
                  value={shareUrl}
                  onChange={(e) => setShareUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://teachlink.com/post/123"
                />
              </div>

              {/* QR Size */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  QR Code Size: <span className="text-blue-600">{qrSize}px</span>
                </label>
                <input
                  type="range"
                  min="128"
                  max="512"
                  value={qrSize}
                  onChange={(e) => setQrSize(Number(e.target.value))}
                  className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <button
                    onClick={() => setQrSize(128)}
                    className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Small
                  </button>
                  <button
                    onClick={() => setQrSize(256)}
                    className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => setQrSize(384)}
                    className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Large
                  </button>
                </div>
              </div>

              {/* Foreground Color */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  QR Code Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-12 h-10 rounded-lg cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Background Color */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Background Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-12 h-10 rounded-lg cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Presets */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                  Color Presets
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setFgColor('#000000');
                      setBgColor('#ffffff');
                    }}
                    className="px-3 py-2 bg-black text-white rounded-lg hover:opacity-80 transition-opacity text-sm font-medium"
                  >
                    Classic
                  </button>
                  <button
                    onClick={() => {
                      setFgColor('#3b82f6');
                      setBgColor('#f0f9ff');
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:opacity-80 transition-opacity text-sm font-medium"
                  >
                    Blue
                  </button>
                  <button
                    onClick={() => {
                      setFgColor('#dc2626');
                      setBgColor('#fef2f2');
                    }}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:opacity-80 transition-opacity text-sm font-medium"
                  >
                    Red
                  </button>
                  <button
                    onClick={() => {
                      setFgColor('#ffffff');
                      setBgColor('#1f2937');
                    }}
                    className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:opacity-80 transition-opacity text-sm font-medium"
                  >
                    Dark
                  </button>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 Tip</h3>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Use this demo to test QR code generation, customization, and sharing features. The QR codes can be downloaded, printed, or shared via the modal dialog.
              </p>
            </div>
          </div>
        </div>

        {/* Share Modal */}
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          shareUrl={shareUrl}
          title="Share TeachLink Content"
          description="Scan the QR code or copy the link to share"
          qrSize={qrSize}
          fgColor={fgColor}
          bgColor={bgColor}
        />
      </div>
    </main>
  );
}
