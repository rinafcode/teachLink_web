import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AccessibleLoading } from '@/app/components/accessibility/ScreenReaderOptimizer'; // reuse existing loading component

export interface AudioPlayerProps {
  /** URL of the audio source */
  src: string;
  /** Autoplay when component mounts */
  autoPlay?: boolean;
  /** Show native controls */
  controls?: boolean;
  /** Additional class names for wrapper */
  className?: string;
}

/**
 * AudioPlayer – a lightweight wrapper around the HTML <audio> element that provides a
 * smooth loading animation while the media is buffering. The animation is built
 * with Framer Motion to give a premium, fluid feel consistent with the rest of the
 * UI.
 */
export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  autoPlay = false,
  controls = true,
  className = '',
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // When the audio can start playing, hide the loader.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleCanPlay = () => setIsLoading(false);
    const handleStalled = () => setIsLoading(true);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('stalled', handleStalled);
    // Cleanup listeners on unmount.
    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('stalled', handleStalled);
    };
  }, [src]);

  // Auto‑play if requested.
  useEffect(() => {
    if (autoPlay && audioRef.current) {
      // eslint‑disable-next-line @typescript-eslint/no-floating-promises
      audioRef.current.play().catch(() => {
        // Fail silently – the user may need to interact first.
      });
    }
  }, [autoPlay, src]);

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Loading animation – visible only while isLoading is true */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-white/30 rounded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Re‑use the accessible loading component for screen‑readers */}
            <AccessibleLoading ariaLabel="Loading audio…" />
            {/* Visual wave animation – three pulsing bars */}
            <div className="flex space-x-1 ml-2">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="block w-1.5 h-4 bg-primary-600 rounded"
                  animate={{ scaleY: [1, 2, 1] }}
                  transition={{
                    repeat: Infinity,
                    repeatDelay: 0.1,
                    duration: 0.6,
                    ease: 'easeInOut',
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Native audio element – always present but hidden behind the loader */}
      <audio
        ref={audioRef}
        src={src}
        controls={controls}
        className="w-full"
        style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.2s' }}
      />
    </div>
  );
};
