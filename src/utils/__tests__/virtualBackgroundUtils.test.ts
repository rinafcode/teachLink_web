/**
 * Virtual Background Utilities - Unit Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isValidImageUrl,
  isValidHexColor,
  isValidBlurIntensity,
  settingsToVirtualBackgroundConfig,
} from '../virtualBackgroundUtils';
import { createDefaultSettings } from '@/lib/settings/types';

describe('Virtual Background Utilities', () => {
  describe('isValidImageUrl', () => {
    it('returns true for valid HTTP URLs', () => {
      expect(isValidImageUrl('http://example.com/image.jpg')).toBe(true);
      expect(isValidImageUrl('https://example.com/image.png')).toBe(true);
    });

    it('returns true for data URLs', () => {
      expect(isValidImageUrl('data:image/jpeg;base64,/9j/4AAQSkZJRg')).toBe(true);
    });

    it('returns false for invalid URLs', () => {
      expect(isValidImageUrl('')).toBe(false);
      expect(isValidImageUrl('not-a-url')).toBe(false);
      expect(isValidImageUrl('ftp://example.com/image.jpg')).toBe(false);
    });
  });

  describe('isValidHexColor', () => {
    it('returns true for valid hex colors', () => {
      expect(isValidHexColor('#000000')).toBe(true);
      expect(isValidHexColor('#FFFFFF')).toBe(true);
      expect(isValidHexColor('#FF5733')).toBe(true);
      expect(isValidHexColor('#ff5733')).toBe(true);
    });

    it('returns false for invalid hex colors', () => {
      expect(isValidHexColor('')).toBe(false);
      expect(isValidHexColor('#000')).toBe(false); // Too short
      expect(isValidHexColor('#00000G')).toBe(false); // Invalid character
      expect(isValidHexColor('000000')).toBe(false); // Missing #
      expect(isValidHexColor('#0000000')).toBe(false); // Too long
    });
  });

  describe('isValidBlurIntensity', () => {
    it('returns true for valid blur intensities', () => {
      expect(isValidBlurIntensity(0)).toBe(true);
      expect(isValidBlurIntensity(50)).toBe(true);
      expect(isValidBlurIntensity(100)).toBe(true);
    });

    it('returns false for invalid blur intensities', () => {
      expect(isValidBlurIntensity(-1)).toBe(false);
      expect(isValidBlurIntensity(101)).toBe(false);
      expect(isValidBlurIntensity(50.5)).toBe(false); // Not integer
      expect(isValidBlurIntensity(NaN)).toBe(false);
    });
  });

  describe('settingsToVirtualBackgroundConfig', () => {
    it('converts settings to config correctly', () => {
      const settings = {
        ...createDefaultSettings(),
        virtualBackgroundEnabled: true,
        virtualBackgroundType: 'image' as const,
        virtualBackgroundImage: 'https://example.com/bg.jpg',
        virtualBackgroundBlur: 20,
        virtualBackgroundColor: '#FF5733',
      };

      const config = settingsToVirtualBackgroundConfig(settings);

      expect(config).toEqual({
        enabled: true,
        type: 'image',
        imageUrl: 'https://example.com/bg.jpg',
        blurIntensity: 20,
        backgroundColor: '#FF5733',
      });
    });

    it('handles empty image URL', () => {
      const settings = {
        ...createDefaultSettings(),
        virtualBackgroundEnabled: true,
        virtualBackgroundType: 'image' as const,
        virtualBackgroundImage: '',
      };

      const config = settingsToVirtualBackgroundConfig(settings);

      expect(config.imageUrl).toBeUndefined();
    });

    it('handles disabled virtual background', () => {
      const settings = {
        ...createDefaultSettings(),
        virtualBackgroundEnabled: false,
      };

      const config = settingsToVirtualBackgroundConfig(settings);

      expect(config.enabled).toBe(false);
    });
  });
});
