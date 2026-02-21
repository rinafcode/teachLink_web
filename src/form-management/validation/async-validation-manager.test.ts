/**
 * Unit tests for AsyncValidationManager
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AsyncValidationManager, AsyncValidationRequest } from './async-validation-manager.js';
import { ValidationFunction, FormState } from '../types/core.js';

describe('AsyncValidationManager', () => {
  let manager: AsyncValidationManager;
  let mockFormState: FormState;

  beforeEach(() => {
    manager = new AsyncValidationManager();
    mockFormState = {
      values: {},
      validation: {},
      touched: {},
      dirty: {},
      isSubmitting: false,
      submitCount: 0,
      metadata: {
        formId: 'test-form',
        sessionId: 'test-session',
        createdAt: new Date(),
        lastModified: new Date(),
        version: '1.0.0'
      }
    };
    
    // Mock timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    manager.dispose();
  });

  describe('validation state management', () => {
    it('should initialize with empty state', () => {
      const state = manager.getValidationState('test-field');
      expect(state.isLoading).toBe(false);
      expect(state.retryCount).toBe(0);
      expect(state.lastValidated).toBeUndefined();
      expect(state.error).toBeUndefined();
    });

    it('should track validation state correctly', () => {
      expect(manager.isAnyFieldValidating()).toBe(false);
      expect(manager.getValidatingFields()).toHaveLength(0);
    });
  });

  describe('successful validation', () => {
    it('should execute successful async validation', async () => {
      const mockValidation: ValidationFunction = vi.fn().mockResolvedValue({
        isValid: true,
        errors: []
      });

      const request: AsyncValidationRequest = {
        fieldId: 'test-field',
        value: 'test-value',
        formState: mockFormState,
        validationFunction: mockValidation,
        options: { debounceMs: 0 } // No debounce for testing
      };

      const resultPromise = manager.validateField(request);
      
      // Fast-forward past debounce
      vi.advanceTimersByTime(0);
      
      const result = await resultPromise;
      
      expect(result.isValid).toBe(true);
      expect(mockValidation).toHaveBeenCalledWith('test-value', mockFormState);
      
      const state = manager.getValidationState('test-field');
      expect(state.isLoading).toBe(false);
      expect(state.lastValidated).toBeDefined();
      expect(state.retryCount).toBe(0);
    });

    it('should handle debouncing correctly', async () => {
      const mockValidation: ValidationFunction = vi.fn().mockResolvedValue({
        isValid: true,
        errors: []
      });

      const request: AsyncValidationRequest = {
        fieldId: 'test-field',
        value: 'test-value',
        formState: mockFormState,
        validationFunction: mockValidation,
        options: { debounceMs: 300 }
      };

      // Start validation
      const resultPromise = manager.validateField(request);
      
      // Validation should not have started yet
      expect(mockValidation).not.toHaveBeenCalled();
      
      // Fast-forward past debounce
      vi.advanceTimersByTime(300);
      
      await resultPromise;
      
      expect(mockValidation).toHaveBeenCalledOnce();
    });

    it('should cancel previous debounced validation when new one starts', async () => {
      const mockValidation: ValidationFunction = vi.fn().mockResolvedValue({
        isValid: true,
        errors: []
      });

      const request: AsyncValidationRequest = {
        fieldId: 'test-field',
        value: 'test-value',
        formState: mockFormState,
        validationFunction: mockValidation,
        options: { debounceMs: 300 }
      };

      // Start first validation
      manager.validateField(request);
      
      // Start second validation before first completes
      const secondPromise = manager.validateField({
        ...request,
        value: 'new-value'
      });
      
      // Fast-forward past debounce
      vi.advanceTimersByTime(300);
      
      await secondPromise;
      
      // Should only be called once (for the second validation)
      expect(mockValidation).toHaveBeenCalledOnce();
      expect(mockValidation).toHaveBeenCalledWith('new-value', mockFormState);
    });
  });

  describe('failed validation with retry', () => {
    it('should retry failed validations', async () => {
      let callCount = 0;
      const mockValidation: ValidationFunction = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Validation failed'));
        }
        return Promise.resolve({ isValid: true, errors: [] });
      });

      const request: AsyncValidationRequest = {
        fieldId: 'test-field',
        value: 'test-value',
        formState: mockFormState,
        validationFunction: mockValidation,
        options: { 
          debounceMs: 0,
          retryAttempts: 3,
          retryDelay: 100
        }
      };

      const resultPromise = manager.validateField(request);
      
      // Fast-forward through debounce and retries
      vi.advanceTimersByTime(0); // Initial debounce
      
      // Wait for retries
      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(100 * Math.pow(2, i)); // Exponential backoff
        await Promise.resolve(); // Allow promises to resolve
      }
      
      const result = await resultPromise;
      
      expect(result.isValid).toBe(true);
      expect(mockValidation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retry attempts', async () => {
      const mockValidation: ValidationFunction = vi.fn().mockRejectedValue(
        new Error('Persistent validation error')
      );

      const request: AsyncValidationRequest = {
        fieldId: 'test-field',
        value: 'test-value',
        formState: mockFormState,
        validationFunction: mockValidation,
        options: { 
          debounceMs: 0,
          retryAttempts: 2,
          retryDelay: 100
        }
      };

      const resultPromise = manager.validateField(request);
      
      // Fast-forward through debounce and all retries
      vi.advanceTimersByTime(0);
      
      for (let i = 0; i <= 2; i++) {
        vi.advanceTimersByTime(100 * Math.pow(2, i));
        await Promise.resolve();
      }
      
      await expect(resultPromise).rejects.toThrow('Persistent validation error');
      expect(mockValidation).toHaveBeenCalledTimes(3); // Initial + 2 retries
      
      const state = manager.getValidationState('test-field');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeDefined();
      expect(state.retryCount).toBe(2);
    });

    it('should handle timeout correctly', async () => {
      const mockValidation: ValidationFunction = vi.fn().mockImplementation(() => {
        return new Promise(() => {}); // Never resolves
      });

      const request: AsyncValidationRequest = {
        fieldId: 'test-field',
        value: 'test-value',
        formState: mockFormState,
        validationFunction: mockValidation,
        options: { 
          debounceMs: 0,
          timeout: 1000,
          retryAttempts: 0
        }
      };

      const resultPromise = manager.validateField(request);
      
      // Fast-forward past debounce and timeout
      vi.advanceTimersByTime(0);
      vi.advanceTimersByTime(1000);
      
      await expect(resultPromise).rejects.toThrow('Validation timeout');
    });
  });

  describe('callback system', () => {
    it('should notify callbacks on validation completion', async () => {
      const callback = vi.fn();
      const unsubscribe = manager.subscribe(callback);

      const mockValidation: ValidationFunction = vi.fn().mockResolvedValue({
        isValid: true,
        errors: []
      });

      const request: AsyncValidationRequest = {
        fieldId: 'test-field',
        value: 'test-value',
        formState: mockFormState,
        validationFunction: mockValidation,
        options: { debounceMs: 0 }
      };

      const resultPromise = manager.validateField(request);
      vi.advanceTimersByTime(0);
      await resultPromise;

      expect(callback).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldId: 'test-field',
          result: expect.objectContaining({ isValid: true }),
          state: expect.objectContaining({ isLoading: false }),
          timestamp: expect.any(Date)
        })
      );

      unsubscribe();
    });

    it('should handle callback errors gracefully', async () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      manager.subscribe(errorCallback);

      const mockValidation: ValidationFunction = vi.fn().mockResolvedValue({
        isValid: true,
        errors: []
      });

      const request: AsyncValidationRequest = {
        fieldId: 'test-field',
        value: 'test-value',
        formState: mockFormState,
        validationFunction: mockValidation,
        options: { debounceMs: 0 }
      };

      const resultPromise = manager.validateField(request);
      vi.advanceTimersByTime(0);
      await resultPromise;

      expect(consoleSpy).toHaveBeenCalledWith('Error in async validation callback:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('concurrent validation', () => {
    it('should validate multiple fields concurrently', async () => {
      const mockValidation1: ValidationFunction = vi.fn().mockResolvedValue({
        isValid: true,
        errors: []
      });
      
      const mockValidation2: ValidationFunction = vi.fn().mockResolvedValue({
        isValid: false,
        errors: [{ code: 'test_error', message: 'Test error' }]
      });

      const requests: AsyncValidationRequest[] = [
        {
          fieldId: 'field1',
          value: 'value1',
          formState: mockFormState,
          validationFunction: mockValidation1,
          options: { debounceMs: 0 }
        },
        {
          fieldId: 'field2',
          value: 'value2',
          formState: mockFormState,
          validationFunction: mockValidation2,
          options: { debounceMs: 0 }
        }
      ];

      const resultPromise = manager.validateFields(requests);
      vi.advanceTimersByTime(0);
      const results = await resultPromise;

      expect(results.size).toBe(2);
      expect(results.get('field1')?.isValid).toBe(true);
      expect(results.get('field2')?.isValid).toBe(false);
    });
  });

  describe('cancellation', () => {
    it('should cancel individual field validation', async () => {
      const mockValidation: ValidationFunction = vi.fn().mockImplementation(() => {
        return new Promise(() => {}); // Never resolves
      });

      const request: AsyncValidationRequest = {
        fieldId: 'test-field',
        value: 'test-value',
        formState: mockFormState,
        validationFunction: mockValidation,
        options: { debounceMs: 300 }
      };

      manager.validateField(request);
      
      // Cancel before debounce completes
      manager.cancelValidation('test-field');
      
      const state = manager.getValidationState('test-field');
      expect(state.isLoading).toBe(false);
    });

    it('should cancel all validations', () => {
      const mockValidation: ValidationFunction = vi.fn().mockImplementation(() => {
        return new Promise(() => {}); // Never resolves
      });

      const request: AsyncValidationRequest = {
        fieldId: 'test-field',
        value: 'test-value',
        formState: mockFormState,
        validationFunction: mockValidation,
        options: { debounceMs: 300 }
      };

      manager.validateField(request);
      manager.validateField({ ...request, fieldId: 'test-field-2' });
      
      expect(manager.getValidatingFields()).toHaveLength(0); // Still debouncing
      
      manager.cancelAllValidations();
      
      expect(manager.getValidatingFields()).toHaveLength(0);
    });
  });

  describe('statistics', () => {
    it('should provide validation statistics', async () => {
      const mockValidation: ValidationFunction = vi.fn().mockResolvedValue({
        isValid: true,
        errors: []
      });

      const request: AsyncValidationRequest = {
        fieldId: 'test-field',
        value: 'test-value',
        formState: mockFormState,
        validationFunction: mockValidation,
        options: { debounceMs: 0 }
      };

      const resultPromise = manager.validateField(request);
      vi.advanceTimersByTime(0);
      await resultPromise;

      const stats = manager.getValidationStats();
      expect(stats.totalFields).toBe(1);
      expect(stats.validatingFields).toBe(0);
      expect(stats.failedFields).toBe(0);
      expect(stats.averageRetryCount).toBe(0);
    });
  });
});