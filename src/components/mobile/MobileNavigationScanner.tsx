'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import jsQR from 'jsqr';

interface MobileNavigationScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_MESSAGE = 'Choose camera scan or upload an image file to detect a QR code.';

export function MobileNavigationScanner({ isOpen, onClose }: MobileNavigationScannerProps) {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'scanning' | 'success' | 'failure'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState(INITIAL_MESSAGE);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [cameraSupported, setCameraSupported] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRequestRef = useRef<number | null>(null);

  const { success, error } = useToast();

  useEffect(() => {
    setCameraSupported(!!navigator.mediaDevices?.getUserMedia);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      resetScanner();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const resetScanner = () => {
    setStatus('idle');
    setFeedbackMessage(INITIAL_MESSAGE);
    setScanResult(null);
  };

  const stopCamera = () => {
    if (frameRequestRef.current !== null) {
      cancelAnimationFrame(frameRequestRef.current);
      frameRequestRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleScanSuccess = (data: string) => {
    stopCamera();
    setStatus('success');
    setScanResult(data);
    setFeedbackMessage('Scan successful.');
    success(`Scanned: ${data}`);
  };

  const handleCameraError = (reason: unknown) => {
    const message =
      reason instanceof Error
        ? reason.message
        : 'Camera permission denied or camera is unavailable.';

    setStatus('failure');
    setFeedbackMessage('Camera access is unavailable. You may use image upload instead.');
    error(message);
  };

  const decodeFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      return null;
    }

    const width = video.videoWidth || video.clientWidth || 640;
    const height = video.videoHeight || video.clientHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      return null;
    }

    context.drawImage(video, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    return jsQR(imageData.data, imageData.width, imageData.height);
  };

  const scanVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    if (videoRef.current.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      frameRequestRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    const code = decodeFrame();
    if (code?.data) {
      handleScanSuccess(code.data);
      return;
    }

    setStatus('scanning');
    setFeedbackMessage('Scanning. Hold your device steadily over a QR code.');
    frameRequestRef.current = requestAnimationFrame(scanVideoFrame);
  };

  const handleStartCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      handleCameraError(new Error('Camera is not supported by this browser.'));
      return;
    }

    setStatus('requesting');
    setFeedbackMessage('Requesting camera permission...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus('scanning');
      setFeedbackMessage('Camera active. Point the camera at a QR code to scan.');
      frameRequestRef.current = requestAnimationFrame(scanVideoFrame);
    } catch (err) {
      handleCameraError(err);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setStatus('scanning');
    setFeedbackMessage('Scanning uploaded image...');
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        URL.revokeObjectURL(objectUrl);
        return;
      }

      const ratio = Math.min(1, 1024 / image.width);
      const width = Math.max(320, Math.round(image.width * ratio));
      const height = Math.max(240, Math.round(image.height * ratio));
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        return;
      }

      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      URL.revokeObjectURL(objectUrl);

      if (code?.data) {
        handleScanSuccess(code.data);
      } else {
        setStatus('failure');
        setFeedbackMessage('No QR code detected in the uploaded image.');
        error('No QR code found in the uploaded image.');
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setStatus('failure');
      setFeedbackMessage('Unable to load the selected image file.');
      error('Unable to read the uploaded image.');
    };

    image.src = objectUrl;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mobile Scanner">
      <div className="space-y-4">
        <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200">
          <div className="flex items-center gap-2">
            <Camera size={18} aria-hidden="true" />
            <p className="font-medium">Mobile Scanner</p>
          </div>
          <p className="mt-2">Camera scan works best for QR codes, with image upload as a fallback when permissions are unavailable.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleStartCamera}
            disabled={status === 'requesting'}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-blue-500 bg-blue-500 text-sm font-semibold text-white transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
            aria-label="Start camera scan"
          >
            <Camera size={18} aria-hidden="true" />
            {status === 'requesting' ? 'Requesting...' : 'Open camera'}
          </button>
          {!cameraSupported && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Camera access is not supported in this browser. Use the upload fallback instead.
            </p>
          )}
          <label
            htmlFor="mobile-scan-upload"
            className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-gray-600 dark:hover:bg-gray-800"
          >
            <Upload size={18} aria-hidden="true" />
            Upload image
            <input
              ref={fileInputRef}
              id="mobile-scan-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleImageUpload}
              aria-label="Upload QR image"
            />
          </label>
        </div>

        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-950">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Scan status</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{feedbackMessage}</p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {status === 'success' ? <CheckCircle2 size={16} /> : status === 'failure' ? <AlertTriangle size={16} /> : <Camera size={16} />}
              {status === 'success' ? 'Success' : status === 'failure' ? 'Error' : status === 'scanning' ? 'Scanning' : 'Ready'}
            </div>
          </div>

          <div className="space-y-3">
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-black text-white dark:border-gray-700">
              <video
                ref={videoRef}
                className={`h-52 w-full object-cover ${status !== 'scanning' ? 'hidden' : 'block'}`}
                playsInline
                muted
                aria-label="Camera preview"
              />
              {status !== 'scanning' && (
                <div className="flex h-52 items-center justify-center bg-gray-950/80 text-center text-sm text-gray-300">
                  <span>Camera preview will appear here when the scanner is active.</span>
                </div>
              )}
            </div>

            {scanResult && (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 dark:border-green-700 dark:bg-green-950 dark:text-green-200" role="status">
                <span className="font-semibold">QR code found:</span> {scanResult}
              </div>
            )}
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="sr-only" aria-hidden="true" />
    </Modal>
  );
}
