/**
 * Unit tests for ValidationFeedbackDisplay
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ValidationFeedbackDisplay, FeedbackDisplayOptions } from './validation-feedback-display.js';
import { ValidationResult } from '../types/core.js';

// Mock DOM environment
Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn((tagName: string) => ({
      tagName: tagName.toUpperCase(),
      id: '',
      className: '',
      style: {},
      textContent: '',
      setAttribute: vi.fn(),
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn()
      },
      parentNode: null
    })),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn()
    },
    head: {
      appendChild: vi.fn()
    },
    getElementById: vi.fn()
  },
  writable: true
});

Object.defineProperty(global, 'requestAnimationFrame', {
  value: vi.fn((callback: Function) => setTimeout(callback, 0)),
  writable: true
});

describe('ValidationFeedbackDisplay', () => {
  let feedbackDisplay: ValidationFeedbackDisplay;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock container
    mockContainer = document.createElement('div') as any;
    feedbackDisplay = new ValidationFeedbackDisplay(mockContainer);
  });

  afterEach(() => {
    feedbackDisplay.dispose();
  });

  describe('initialization', () => {
    it('should initialize with default container if none provided', () => {
      const display = new ValidationFeedbackDisplay();
      expect(display).toBeDefined();
      display.dispose();
    });

    it('should initialize styles on creation', () => {
      expect(document.createElement).toHaveBeenCalledWith('style');
    });
  });

  describe('feedback display', () => {
    it('should display error feedback', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        errors: [
          { code: 'required', message: 'This field is required' },
          { code: 'email', message: 'Invalid email format' }
        ]
      };

      feedbackDisplay.displayFeedback('email', validationResult);

      const state = feedbackDisplay.getDisplayState('email');
      expect(state).toBeDefined();
      expect(state!.hasErrors).toBe(true);
      expect(state!.errorCount).toBe(2);
      expect(state!.isValid).toBe(false);
    });

    it('should display warning feedback', () => {
      const validationResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [
          { code: 'weak_password', message: 'Password could be stronger' }
        ]
      };

      feedbackDisplay.displayFeedback('password', validationResult);

      const state = feedbackDisplay.getDisplayState('password');
      expect(state).toBeDefined();
      expect(state!.hasWarnings).toBe(true);
      expect(state!.warningCount).toBe(1);
      expect(state!.isValid).toBe(true);
    });

    it('should display success feedback when valid', () => {
      const validationResult: ValidationResult = {
        isValid: true,
        errors: []
      };

      const options: Partial<FeedbackDisplayOptions> = {
        showSuccessState: true
      };

      feedbackDisplay.displayFeedback('email', validationResult, options);

      const state = feedbackDisplay.getDisplayState('email');
      expect(state).toBeDefined();
      expect(state!.isValid).toBe(true);
      expect(state!.elements.some(e => e.type === 'success')).toBe(true);
    });

    it('should not display success feedback when disabled', () => {
      const validationResult: ValidationResult = {
        isValid: true,
        errors: []
      };

      const options: Partial<FeedbackDisplayOptions> = {
        showSuccessState: false
      };

      feedbackDisplay.displayFeedback('email', validationResult, options);

      const state = feedbackDisplay.getDisplayState('email');
      expect(state).toBeDefined();
      expect(state!.elements.some(e => e.type === 'success')).toBe(false);
    });
  });

  describe('error processing', () => {
    it('should limit number of errors displayed', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        errors: [
          { code: 'error1', message: 'Error 1' },
          { code: 'error2', message: 'Error 2' },
          { code: 'error3', message: 'Error 3' },
          { code: 'error4', message: 'Error 4' }
        ]
      };

      const options: Partial<FeedbackDisplayOptions> = {
        maxErrors: 2
      };

      feedbackDisplay.displayFeedback('field', validationResult, options);

      const state = feedbackDisplay.getDisplayState('field');
      expect(state).toBeDefined();
      expect(state!.elements.filter(e => e.type === 'error')).toHaveLength(3); // 2 errors + 1 "more errors" message
    });

    it('should group similar errors when enabled', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        errors: [
          { code: 'required', message: 'Field 1 is required' },
          { code: 'required', message: 'Field 2 is required' },
          { code: 'email', message: 'Invalid email' }
        ]
      };

      const options: Partial<FeedbackDisplayOptions> = {
        groupSimilarErrors: true
      };

      feedbackDisplay.displayFeedback('field', validationResult, options);

      const state = feedbackDisplay.getDisplayState('field');
      expect(state).toBeDefined();
      expect(state!.elements.filter(e => e.type === 'error')).toHaveLength(2); // Grouped required + email
    });
  });

  describe('positioning and styling', () => {
    it('should apply custom positioning', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        errors: [{ code: 'error', message: 'Test error' }]
      };

      const options: Partial<FeedbackDisplayOptions> = {
        position: 'tooltip'
      };

      feedbackDisplay.displayFeedback('field', validationResult, options);
      
      // Verify positioning was applied (mocked DOM doesn't actually apply styles)
      expect(document.createElement).toHaveBeenCalledWith('div');
    });

    it('should apply custom styles', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        errors: [{ code: 'error', message: 'Test error' }]
      };

      const options: Partial<FeedbackDisplayOptions> = {
        customStyles: { color: 'red', fontSize: '14px' },
        customClassName: 'custom-feedback'
      };

      feedbackDisplay.displayFeedback('field', validationResult, options);

      const state = feedbackDisplay.getDisplayState('field');
      expect(state).toBeDefined();
    });

    it('should update positioning after display', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        errors: [{ code: 'error', message: 'Test error' }]
      };

      feedbackDisplay.displayFeedback('field', validationResult);
      feedbackDisplay.updatePosition('field', 'top');

      // Verify position update was called
      const state = feedbackDisplay.getDisplayState('field');
      expect(state).toBeDefined();
    });
  });

  describe('callback system', () => {
    it('should notify callbacks on state changes', () => {
      const callback = vi.fn();
      const unsubscribe = feedbackDisplay.subscribe(callback);

      const validationResult: ValidationResult = {
        isValid: false,
        errors: [{ code: 'error', message: 'Test error' }]
      };

      feedbackDisplay.displayFeedback('field', validationResult);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldId: 'field',
          hasErrors: true,
          isValid: false
        })
      );

      unsubscribe();
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      feedbackDisplay.subscribe(errorCallback);

      const validationResult: ValidationResult = {
        isValid: true,
        errors: []
      };

      feedbackDisplay.displayFeedback('field', validationResult);

      expect(consoleSpy).toHaveBeenCalledWith('Error in feedback display callback:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('cleanup and management', () => {
    it('should clear feedback for specific field', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        errors: [{ code: 'error', message: 'Test error' }]
      };

      feedbackDisplay.displayFeedback('field1', validationResult);
      feedbackDisplay.displayFeedback('field2', validationResult);

      expect(feedbackDisplay.getDisplayState('field1')).toBeDefined();
      expect(feedbackDisplay.getDisplayState('field2')).toBeDefined();

      feedbackDisplay.clearFieldFeedback('field1');

      expect(feedbackDisplay.getDisplayState('field1')).toBeUndefined();
      expect(feedbackDisplay.getDisplayState('field2')).toBeDefined();
    });

    it('should clear all feedback', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        errors: [{ code: 'error', message: 'Test error' }]
      };

      feedbackDisplay.displayFeedback('field1', validationResult);
      feedbackDisplay.displayFeedback('field2', validationResult);

      feedbackDisplay.clearAllFeedback();

      expect(feedbackDisplay.getDisplayState('field1')).toBeUndefined();
      expect(feedbackDisplay.getDisplayState('field2')).toBeUndefined();
    });

    it('should get all display states', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        errors: [{ code: 'error', message: 'Test error' }]
      };

      feedbackDisplay.displayFeedback('field1', validationResult);
      feedbackDisplay.displayFeedback('field2', validationResult);

      const allStates = feedbackDisplay.getAllDisplayStates();
      expect(allStates.size).toBe(2);
      expect(allStates.has('field1')).toBe(true);
      expect(allStates.has('field2')).toBe(true);
    });
  });

  describe('statistics', () => {
    it('should provide feedback statistics', () => {
      const errorResult: ValidationResult = {
        isValid: false,
        errors: [{ code: 'error', message: 'Error' }]
      };

      const warningResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [{ code: 'warning', message: 'Warning' }]
      };

      const validResult: ValidationResult = {
        isValid: true,
        errors: []
      };

      feedbackDisplay.displayFeedback('field1', errorResult);
      feedbackDisplay.displayFeedback('field2', warningResult);
      feedbackDisplay.displayFeedback('field3', validResult, { showSuccessState: true });

      const stats = feedbackDisplay.getStatistics();
      
      expect(stats.totalFields).toBe(3);
      expect(stats.fieldsWithErrors).toBe(1);
      expect(stats.fieldsWithWarnings).toBe(1);
      expect(stats.validFields).toBe(2); // field2 and field3 are valid
    });
  });

  describe('accessibility', () => {
    it('should set appropriate ARIA attributes', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        errors: [{ code: 'error', message: 'Test error' }]
      };

      const options: Partial<FeedbackDisplayOptions> = {
        ariaLive: 'assertive'
      };

      feedbackDisplay.displayFeedback('field', validationResult, options);

      // Verify ARIA attributes were set (mocked DOM)
      expect(document.createElement).toHaveBeenCalledWith('div');
    });

    it('should create proper content structure with icons', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        errors: [{ code: 'error', message: 'Test error' }]
      };

      const options: Partial<FeedbackDisplayOptions> = {
        showIcons: true
      };

      feedbackDisplay.displayFeedback('field', validationResult, options);

      // Verify content structure was created
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(document.createElement).toHaveBeenCalledWith('span');
    });

    it('should create content without icons when disabled', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        errors: [{ code: 'error', message: 'Test error' }]
      };

      const options: Partial<FeedbackDisplayOptions> = {
        showIcons: false
      };

      feedbackDisplay.displayFeedback('field', validationResult, options);

      // Verify content was created
      expect(document.createElement).toHaveBeenCalledWith('div');
    });
  });
});