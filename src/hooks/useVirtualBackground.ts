// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/**
 * useVirtualBackground Hook
 * Manages virtual background functionality for video streams
 */

import { useState, useCallback, useRef } from 'react';
import { useSettingsStore } from '@/lib/settings/store';
import {
  applyVirtualBackground,
  settingsToVirtualBackgroundConfig,
  type VirtualBackgroundConfig,
} from '@/utils/virtualBackgroundUtils';
import { createLogger } from '@/lib/logging';

const logger = createLogger('use-virtual-background');

export function useVirtualBackground() {
  const settings = useSettingsStore((s) => s.settings);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const originalStreamRef = useRef<MediaStream | null>(null);
  const processedStreamRef = useRef<MediaStream | null>(null);

  /**
   * Apply virtual background to a media stream
   */
  const applyToStream = useCallback(
    async (stream: MediaStream): Promise<MediaStream> => {
      setIsProcessing(true);
      setError(null);

      try {
        // Store original stream for cleanup
        if (!originalStreamRef.current) {
          originalStreamRef.current = stream;
        }

        const config = settingsToVirtualBackgroundConfig(settings);

        if (!config.enabled || config.type === 'none') {
          return stream;
        }

        const processedStream = await applyVirtualBackground(stream, config);
        processedStreamRef.current = processedStream;

        return processedStream;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to apply virtual background';
        setError(errorMessage);
        logger.error('Virtual background error', { error: err });
        return stream;
      } finally {
        setIsProcessing(false);
      }
    },
    [settings],
  );

  /**
   * Stop processing and return to original stream
   */
  const stopProcessing = useCallback(() => {
    if (processedStreamRef.current) {
      processedStreamRef.current.getTracks().forEach((track) => track.stop());
      processedStreamRef.current = null;
    }
    setIsProcessing(false);
    setError(null);
  }, []);

  /**
   * Check if virtual background is currently enabled
   */
  const isEnabled = settings.virtualBackgroundEnabled && settings.virtualBackgroundType !== 'none';

  /**
   * Get current virtual background configuration
   */
  const config = settingsToVirtualBackgroundConfig(settings);

  return {
    applyToStream,
    stopProcessing,
    isProcessing,
    error,
    isEnabled,
    config,
  };
}
