/**
 * Validation System Integration Example
 * Demonstrates how to use all validation components together
 */

import {
  ValidationEngineImpl,
  AsyncValidationManager,
  CustomValidationRegistry,
  ValidationFeedbackDisplay,
  ValidationRuleBuilders
} from './index.js';
import { FieldDescriptor, FormState } from '../types/core.js';

/**
 * Complete validation system that integrates all validation components
 */
export class IntegratedValidationSystem {
  private validationEngine: ValidationEngineImpl;
  private asyncManager: AsyncValidationManager;
  private customRegistry: CustomValidationRegistry;
  private feedbackDisplay: ValidationFeedbackDisplay;

  constructor(fieldDescriptors: FieldDescriptor[], container?: HTMLElement) {
    // Initialize components
    this.validationEngine = new ValidationEngineImpl(fieldDescriptors);
    this.asyncManager = new AsyncValidationManager();
    this.customRegistry = new CustomValidationRegistry();
    this.feedbackDisplay = new ValidationFeedbackDisplay(container);

    // Register common custom validation rules
    this.registerCommonRules();

    // Set up async validation callback
    this.asyncManager.subscribe((response) => {
      this.feedbackDisplay.displayFeedback(response.fieldId, response.result);
    });
  }

  /**
   * Validate a field with both sync and async validation
   */
  async validateField(fieldId: string, value: any, formState: FormState): Promise<void> {
    // Synchronous validation
    const syncResult = this.validationEngine.validateField(fieldId, value, formState);
    
    // Display immediate feedback
    this.feedbackDisplay.displayFeedback(fieldId, syncResult);

    // Asynchronous validation (if needed)
    const asyncResult = await this.validationEngine.executeAsyncValidation(fieldId, value);
    
    // Combine results and update display
    const combinedResult = {
      isValid: syncResult.isValid && asyncResult.isValid,
      errors: [...syncResult.errors, ...asyncResult.errors],
      warnings: [
        ...(syncResult.warnings || []),
        ...(asyncResult.warnings || [])
      ]
    };

    this.feedbackDisplay.displayFeedback(fieldId, combinedResult);
  }

  /**
   * Validate entire form
   */
  async validateForm(formState: FormState): Promise<boolean> {
    const result = await this.validationEngine.validateForm(formState);
    
    // Display feedback for each field
    Object.entries(result.fieldResults).forEach(([fieldId, fieldResult]) => {
      this.feedbackDisplay.displayFeedback(fieldId, fieldResult);
    });

    return result.isValid;
  }

  /**
   * Add custom validation rule
   */
  addCustomRule(name: string, validationFunction: any): void {
    this.validationEngine.addCustomRule(name, validationFunction);
  }

  /**
   * Clear validation feedback for a field
   */
  clearFieldFeedback(fieldId: string): void {
    this.feedbackDisplay.clearFieldFeedback(fieldId);
  }

  /**
   * Clear all validation feedback
   */
  clearAllFeedback(): void {
    this.feedbackDisplay.clearAllFeedback();
  }

  /**
   * Register common validation rules
   */
  private registerCommonRules(): void {
    // Password confirmation rule
    const passwordMatchRule = ValidationRuleBuilders.createFieldComparisonRule(
      'password-match',
      'password',
      'equals',
      'Passwords must match'
    );
    this.customRegistry.registerRule(passwordMatchRule);

    // Email availability check (example async rule)
    const emailAvailabilityRule = ValidationRuleBuilders.createAsyncApiRule(
      'email-availability',
      async (email: string) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        return !email.includes('taken');
      },
      'This email address is already taken'
    );
    this.customRegistry.registerRule(emailAvailabilityRule);

    // Age validation rule
    this.customRegistry.registerRule({
      name: 'minimum-age',
      description: 'Validate minimum age requirement',
      isAsync: false,
      validationFunction: (value, formState, context) => {
        const age = parseInt(String(value));
        const minAge = 18;
        
        return {
          isValid: age >= minAge,
          errors: age < minAge ? [{
            code: 'minimum_age',
            message: `You must be at least ${minAge} years old`
          }] : []
        };
      }
    });

    // Phone number format rule
    this.customRegistry.registerRule({
      name: 'phone-format',
      description: 'Validate phone number format',
      isAsync: false,
      validationFunction: (value) => {
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        const isValid = phoneRegex.test(String(value));
        
        return {
          isValid,
          errors: isValid ? [] : [{
            code: 'phone_format',
            message: 'Please enter a valid phone number'
          }]
        };
      }
    });
  }

  /**
   * Get validation statistics
   */
  getStatistics() {
    return {
      customRules: this.customRegistry.getStatistics(),
      asyncValidation: this.asyncManager.getValidationStats(),
      feedback: this.feedbackDisplay.getStatistics()
    };
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.asyncManager.dispose();
    this.customRegistry.clear();
    this.feedbackDisplay.dispose();
  }
}

/**
 * Example usage of the integrated validation system
 */
export function createExampleValidationSystem(): IntegratedValidationSystem {
  const fieldDescriptors: FieldDescriptor[] = [
    {
      id: 'email',
      type: 'email',
      label: 'Email Address',
      required: true,
      validation: [
        {
          type: 'required',
          message: 'Email is required',
          params: {}
        },
        {
          type: 'email',
          message: 'Please enter a valid email address',
          params: {}
        },
        {
          type: 'async',
          message: 'Checking email availability...',
          params: {}
        }
      ]
    },
    {
      id: 'password',
      type: 'password',
      label: 'Password',
      required: true,
      validation: [
        {
          type: 'required',
          message: 'Password is required',
          params: {}
        },
        {
          type: 'minLength',
          message: 'Password must be at least 8 characters',
          params: { minLength: 8 }
        }
      ]
    },
    {
      id: 'confirmPassword',
      type: 'password',
      label: 'Confirm Password',
      required: true,
      validation: [
        {
          type: 'required',
          message: 'Please confirm your password',
          params: {}
        },
        {
          type: 'custom',
          message: 'Passwords do not match',
          params: {}
        }
      ]
    },
    {
      id: 'age',
      type: 'number',
      label: 'Age',
      required: true,
      validation: [
        {
          type: 'required',
          message: 'Age is required',
          params: {}
        },
        {
          type: 'custom',
          message: 'You must be at least 18 years old',
          params: {}
        }
      ]
    },
    {
      id: 'phone',
      type: 'text',
      label: 'Phone Number',
      required: false,
      validation: [
        {
          type: 'custom',
          message: 'Please enter a valid phone number',
          params: {}
        }
      ]
    }
  ];

  return new IntegratedValidationSystem(fieldDescriptors);
}