'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInternationalization } from '@/hooks/useInternationalization';
import { useAccessibility } from '@/hooks/useAccessibility';
import { getLocaleConfig } from '@/locales/config';

const STORAGE_KEY = 'a11y:settings';

type SpeechRecognitionConstructor = new () => SpeechRecognition;

interface AccessibilitySettingsState {
  highContrast: boolean;
  fontScale: number;
  voiceControl: boolean;
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const anyWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return anyWindow.SpeechRecognition || anyWindow.webkitSpeechRecognition || null;
}

function readSettings(): AccessibilitySettingsState {
  if (typeof window === 'undefined') {
    return { highContrast: false, fontScale: 1, voiceControl: false };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { highContrast: false, fontScale: 1, voiceControl: false };
    const parsed = JSON.parse(raw) as Partial<AccessibilitySettingsState>;
    return {
      highContrast: Boolean(parsed.highContrast),
      fontScale: typeof parsed.fontScale === 'number' ? parsed.fontScale : 1,
      voiceControl: Boolean(parsed.voiceControl),
    };
  } catch (error) {
    return { highContrast: false, fontScale: 1, voiceControl: false };
  }
}

function normalizeCommand(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

export function VoiceControl() {
  const { language } = useInternationalization();
  const { announce } = useAccessibility();
  const router = useRouter();
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognitionConstructor()));
  }, []);

  useEffect(() => {
    setEnabled(readSettings().voiceControl && supported);
  }, [supported]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onSettingsChange = (event: Event) => {
      const customEvent = event as CustomEvent<AccessibilitySettingsState>;
      if (customEvent.detail) {
        setEnabled(Boolean(customEvent.detail.voiceControl) && supported);
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const next = readSettings();
      setEnabled(Boolean(next.voiceControl) && supported);
    };

    window.addEventListener('a11y:settings-change', onSettingsChange as EventListener);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('a11y:settings-change', onSettingsChange as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, [supported]);

  useEffect(() => {
    if (!supported) return;

    if (!enabled) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      return;
    }

    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) return;

    const recognition = new Recognition();
    recognitionRef.current = recognition;
    const locale = getLocaleConfig(language);
    recognition.lang = locale.numberFormat || language;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      if (!result || !result[0]) return;
      const transcript = normalizeCommand(result[0].transcript || '');
      if (!transcript) return;

      if (transcript.includes('go to home') || transcript === 'home' || transcript === 'go home') {
        router.push('/');
        announce('Navigating to home.');
        return;
      }

      if (transcript.includes('open settings') || transcript.includes('open accessibility')) {
        window.dispatchEvent(new CustomEvent('a11y:open-settings'));
        announce('Opening accessibility settings.');
        return;
      }

      if (transcript.includes('scroll down')) {
        window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
        announce('Scrolling down.');
        return;
      }

      if (transcript.includes('scroll up')) {
        window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
        announce('Scrolling up.');
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        announce('Voice control permission denied.', 'assertive');
        setEnabled(false);
      }
    };

    recognition.onend = () => {
      if (enabledRef.current) {
        recognition.start();
      }
    };

    recognition.start();
    announce('Voice control enabled.');

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [announce, enabled, language, router, supported]);

  return null;
}
