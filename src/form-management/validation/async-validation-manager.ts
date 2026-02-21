/**
 * Async Validation Manager - Handles asynchronous validation with loading states and retry logic
 */

import {
  ValidationResult,
  ValidationError,
  FormState,
  ValidationFunction
} from '../types/core.js';

export interface AsyncValidationState {
  isLoading: boolean;
  lastValidated?: Date;
  retryCount: number;
  error?: Error;
}

export interface AsyncValidationOptions {
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  debounceMs: number;
}

export interface AsyncValidationRequest {
  fieldId: string;
  value: any;
  formState: FormState;
  validationFunction: ValidationFunction;
  options?: Partial<AsyncValidationOptions>;
}

export interface AsyncValidationResponse {
  fieldId: string;
  result: ValidationResult;
  state: AsyncValidationState;
  timestamp: Date;
}

export type AsyncValidationCallback = (response: AsyncValidationResponse) => void;

export class AsyncValidationManager {
  private validationStates: Map<string, AsyncValidationState> = new Map();
  private pendingValidations: Map<string, Promise<ValidationResult>> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private callbacks: Set<AsyncValidationCallback> = new Set();
  
  private defaultOptions: AsyncValidationOptions = {
    timeout: 5000,
    retryAttempts: 3,
    retryDelay: 1000,
    debounceMs: 300
  };

  /**
   * Subscribe to async validation state changes
   */
  subscribe(callback: AsyncValidationCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Get current validation state for a field
   */
  getValidationState(fieldId: string): AsyncValidationState {
    return this.validationStates.get(fieldId) || {
      isLoading: false,
      retryCount: 0
    };
  }

  /**
   * Check if any field is currently being validated
   */
  isAnyFieldValidating(): boolean {
    return Array.from(this.validationStates.values()).some(state => state.isLoading);
  }

  /**
   * Get all fields currently being validated
   */
  getValidatingFields(): string[] {
    return Array.from(this.validationStates.entries())
      .filter(([_, state]) => state.isLoading)
      .map(([fieldId]) => fieldId);
  }

  /**
   * Validate field asynchronously with debouncing
   */
  async validateField(request: AsyncValidationRequest): Promise<ValidationResult> {
    const { fieldId, value, formState, validationFunction, options } = request;
    const mergedOptions = { ...this.defaultOptions, ...options };

    // Clear existing debounce timer
    const existingTimer = this.debounceTimers.get(fieldId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Return existing validation if in progress
    const existingValidation = this.pendingValidations.get(fieldId);
    if (existingValidation) {
      return existingValidation;
    }

    // Create debounced validation
    return new Promise((resolve, reject) => {
      const timer = setTimeout(async () => {
        this.debounceTimers.delete(fieldId);
        
        try {
          const result = await this.executeValidationWithRetry(
            fieldId,
            value,
            formState,
            validationFunction,
            mergedOptions
          );
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, mergedOptions.debounceMs);

      this.debounceTimers.set(fieldId, timer);
    });
  }

  /**
   * Execute validation with retry logic and state management
   */
  private async executeValidationWithRetry(
    fieldId: string,
    value: any,
    formState: FormState,
    validationFunction: ValidationFunction,
    options: AsyncValidationOptions
  ): Promise<ValidationResult> {
    // Initialize validation state
    this.setValidationState(fieldId, {
      isLoading: true,
      retryCount: 0
    });

    const validationPromise = this.performValidationWithRetries(
      fieldId,
      value,
      formState,
      validationFunction,
      options
    );

    // Store pending validation
    this.pendingValidations.set(fieldId, validationPromise);

    try {
      const result = await validationPromise;
      
      // Update state on success
      this.setValidationState(fieldId, {
        isLoading: false,
        lastValidated: new Date(),
        retryCount: 0
      });

      // Notify callbacks
      this.notifyCallbacks({
        fieldId,
        result,
        state: this.getValidationState(fieldId),
        timestamp: new Date()
      });

      return result;
    } catch (error) {
      // Update state on error
      this.setValidationState(fieldId, {
        isLoading: false,
        lastValidated: new Date(),
        retryCount: options.retryAttempts,
        error: error instanceof Error ? error : new Error('Unknown validation error')
      });

      // Create error result
      const errorResult: ValidationResult = {
        isValid: false,
        errors: [{
          code: 'async_validation_failed',
          message: `Async validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          field: fieldId
        }]
      };

      // Notify callbacks
      this.notifyCallbacks({
        fieldId,
        result: errorResult,
        state: this.getValidationState(fieldId),
        timestamp: new Date()
      });

      throw error;
    } finally {
      // Clean up pending validation
      this.pendingValidations.delete(fieldId);
    }
  }

  /**
   * Perform validation with retry attempts
   */
  private async performValidationWithRetries(
    fieldId: string,
    value: any,
    formState: FormState,
    validationFunction: ValidationFunction,
    options: AsyncValidationOptions
  ): Promise<ValidationResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= options.retryAttempts; attempt++) {
      try {
        // Update retry count in state
        this.updateValidationState(fieldId, { retryCount: attempt });

        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Validation timeout after ${options.timeout}ms`));
          }, options.timeout);
        });

        // Execute validation with timeout
        const validationPromise = Promise.resolve(validationFunction(value, formState));
        const result = await Promise.race([validationPromise, timeoutPromise]);

        // Validation succeeded
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on the last attempt
        if (attempt === options.retryAttempts) {
          break;
        }

        // Wait before retry
        await this.delay(options.retryDelay * Math.pow(2, attempt)); // Exponential backoff
      }
    }

    // All retries failed
    throw lastError || new Error('Validation failed after all retry attempts');
  }

  /**
   * Cancel ongoing validation for a field
   */
  cancelValidation(fieldId: string): void {
    // Clear debounce timer
    const timer = this.debounceTimers.get(fieldId);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(fieldId);
    }

    // Update state
    this.setValidationState(fieldId, {
      isLoading: false,
      retryCount: 0
    });

    // Remove pending validation
    this.pendingValidations.delete(fieldId);
  }

  /**
   * Cancel all ongoing validations
   */
  cancelAllValidations(): void {
    // Clear all debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // Update all states
    this.validationStates.forEach((_, fieldId) => {
      this.setValidationState(fieldId, {
        isLoading: false,
        retryCount: 0
      });
    });

    // Clear pending validations
    this.pendingValidations.clear();
  }

  /**
   * Validate multiple fields concurrently
   */
  async validateFields(requests: AsyncValidationRequest[]): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();
    
    // Execute all validations concurrently
    const validationPromises = requests.map(async (request) => {
      try {
        const result = await this.validateField(request);
        results.set(request.fieldId, result);
      } catch (error) {
        // Create error result for failed validation
        results.set(request.fieldId, {
          isValid: false,
          errors: [{
            code: 'async_validation_error',
            message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            field: request.fieldId
          }]
        });
      }
    });

    await Promise.allSettled(validationPromises);
    return results;
  }

  /**
   * Set validation state for a field
   */
  private setValidationState(fieldId: string, state: Partial<AsyncValidationState>): void {
    const currentState = this.getValidationState(fieldId);
    this.validationStates.set(fieldId, { ...currentState, ...state });
  }

  /**
   * Update validation state for a field
   */
  private updateValidationState(fieldId: string, updates: Partial<AsyncValidationState>): void {
    const currentState = this.getValidationState(fieldId);
    this.validationStates.set(fieldId, { ...currentState, ...updates });
  }

  /**
   * Notify all callbacks of validation state change
   */
  private notifyCallbacks(response: AsyncValidationResponse): void {
    this.callbacks.forEach(callback => {
      try {
        callback(response);
      } catch (error) {
        console.error('Error in async validation callback:', error);
      }
    });
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear all state and pending operations
   */
  dispose(): void {
    this.cancelAllValidations();
    this.callbacks.clear();
    this.validationStates.clear();
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): {
    totalFields: number;
    validatingFields: number;
    failedFields: number;
    averageRetryCount: number;
  } {
    const states = Array.from(this.validationStates.values());
    
    return {
      totalFields: states.length,
      validatingFields: states.filter(s => s.isLoading).length,
      failedFields: states.filter(s => s.error).length,
      averageRetryCount: states.length > 0 
        ? states.reduce((sum, s) => sum + s.retryCount, 0) / states.length 
        : 0
    };
  }
}