/**
 * Unit tests for ValidationEngine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationEngineImpl } from './validation-engine.js';
import {
  FieldDescriptor,
  ValidationRule,
  FormState,
  ValidationResult,
  ValidationFunction
} from '../types/core.js';

describe('ValidationEngine', () => {
  let validationEngine: ValidationEngineImpl;
  let mockFormState: FormState;

  beforeEach(() => {
    const fieldDescriptors: FieldDescriptor[] = [
      {
        id: 'email',
        type: 'email',
        label: 'Email',
        required: true,
        validation: [
          {
            type: 'required',
            message: 'Email is required',
            params: {}
          },
          {
            type: 'email',
            message: 'Please enter a valid email',
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
      }
    ];

    validationEngine = new ValidationEngineImpl(fieldDescriptors);
    
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
  });

  describe('validateField', () => {
    it('should validate required fields correctly', () => {
      // Test empty value
      let result = validationEngine.validateField('email', '', mockFormState);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('required');

      // Test valid value
      result = validationEngine.validateField('email', 'test@example.com', mockFormState);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate email format correctly', () => {
      // Test invalid email
      let result = validationEngine.validateField('email', 'invalid-email', mockFormState);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'email')).toBe(true);

      // Test valid email
      result = validationEngine.validateField('email', 'user@domain.com', mockFormState);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate minimum length correctly', () => {
      // Test short password
      let result = validationEngine.validateField('password', '123', mockFormState);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'minLength')).toBe(true);

      // Test valid password
      result = validationEngine.validateField('password', 'password123', mockFormState);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle non-existent fields gracefully', () => {
      const result = validationEngine.validateField('nonexistent', 'value', mockFormState);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should skip validation when condition is not met', () => {
      const conditionalField: FieldDescriptor = {
        id: 'conditional',
        type: 'text',
        label: 'Conditional Field',
        required: false,
        validation: [
          {
            type: 'required',
            message: 'This field is required when condition is met',
            params: {},
            condition: (formState) => formState.values.enableConditional === true
          }
        ]
      };

      validationEngine.updateFieldDescriptors([conditionalField]);

      // Test when condition is false
      mockFormState.values.enableConditional = false;
      let result = validationEngine.validateField('conditional', '', mockFormState);
      expect(result.isValid).toBe(true);

      // Test when condition is true
      mockFormState.values.enableConditional = true;
      result = validationEngine.validateField('conditional', '', mockFormState);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('required');
    });
  });

  describe('custom validation rules', () => {
    it('should allow adding and using custom validation rules', () => {
      const passwordMatchRule: ValidationFunction = (value, formState) => {
        const password = formState.values.password;
        const isValid = value === password;
        
        return {
          isValid,
          errors: isValid ? [] : [{
            code: 'password_mismatch',
            message: 'Passwords do not match'
          }]
        };
      };

      validationEngine.addCustomRule('custom', passwordMatchRule);

      mockFormState.values.password = 'password123';
      
      // Test matching passwords
      let result = validationEngine.validateField('confirmPassword', 'password123', mockFormState);
      expect(result.isValid).toBe(true);

      // Test non-matching passwords
      result = validationEngine.validateField('confirmPassword', 'different', mockFormState);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'password_mismatch')).toBe(true);
    });

    it('should handle custom rule errors gracefully', () => {
      const errorRule: ValidationFunction = () => {
        throw new Error('Custom rule error');
      };

      validationEngine.addCustomRule('custom', errorRule);

      const result = validationEngine.validateField('confirmPassword', 'value', mockFormState);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('custom_rule_error');
    });
  });

  describe('validateForm', () => {
    it('should validate entire form and return combined results', async () => {
      mockFormState.values = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };

      // Add password match rule
      const passwordMatchRule: ValidationFunction = (value, formState) => ({
        isValid: value === formState.values.password,
        errors: value === formState.values.password ? [] : [{
          code: 'password_mismatch',
          message: 'Passwords do not match'
        }]
      });
      validationEngine.addCustomRule('custom', passwordMatchRule);

      const result = await validationEngine.validateForm(mockFormState);
      
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.fieldResults)).toHaveLength(3);
      expect(result.globalErrors).toHaveLength(0);
    });

    it('should return invalid result when any field fails validation', async () => {
      mockFormState.values = {
        email: 'invalid-email',
        password: '123', // Too short
        confirmPassword: 'different'
      };

      const result = await validationEngine.validateForm(mockFormState);
      
      expect(result.isValid).toBe(false);
      expect(result.fieldResults.email.isValid).toBe(false);
      expect(result.fieldResults.password.isValid).toBe(false);
    });
  });

  describe('async validation', () => {
    it('should handle async validation rules', async () => {
      const asyncRule: ValidationFunction = async (value) => {
        // Simulate async validation (e.g., checking username availability)
        await new Promise(resolve => setTimeout(resolve, 10));
        
        return {
          isValid: value !== 'taken@example.com',
          errors: value === 'taken@example.com' ? [{
            code: 'email_taken',
            message: 'This email is already taken'
          }] : []
        };
      };

      validationEngine.addCustomRule('async', asyncRule);

      const asyncField: FieldDescriptor = {
        id: 'asyncEmail',
        type: 'email',
        label: 'Email',
        required: true,
        validation: [
          {
            type: 'async',
            message: 'Email validation failed',
            params: {}
          }
        ]
      };

      validationEngine.updateFieldDescriptors([asyncField]);

      // Test available email
      let result = await validationEngine.executeAsyncValidation('asyncEmail', 'available@example.com');
      expect(result.isValid).toBe(true);

      // Test taken email
      result = await validationEngine.executeAsyncValidation('asyncEmail', 'taken@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('email_taken');
    });

    it('should handle async validation timeout', async () => {
      const slowRule: ValidationFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { isValid: true, errors: [] };
      };

      validationEngine.addCustomRule('async', slowRule);

      const asyncField: FieldDescriptor = {
        id: 'slowField',
        type: 'text',
        label: 'Slow Field',
        required: false,
        validation: [
          {
            type: 'async',
            message: 'Validation failed',
            params: {
              asyncOptions: {
                timeout: 50, // Shorter than the rule execution time
                retryAttempts: 0
              }
            }
          }
        ]
      };

      validationEngine.updateFieldDescriptors([asyncField]);

      const result = await validationEngine.executeAsyncValidation('slowField', 'value');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('timeout');
    });
  });

  describe('built-in validation rules', () => {
    it('should validate patterns correctly', () => {
      const patternField: FieldDescriptor = {
        id: 'phone',
        type: 'text',
        label: 'Phone',
        required: false,
        validation: [
          {
            type: 'pattern',
            message: 'Please enter a valid phone number',
            params: { pattern: '^\\d{3}-\\d{3}-\\d{4}$' }
          }
        ]
      };

      validationEngine.updateFieldDescriptors([patternField]);

      // Test invalid pattern
      let result = validationEngine.validateField('phone', '123456789', mockFormState);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('pattern');

      // Test valid pattern
      result = validationEngine.validateField('phone', '123-456-7890', mockFormState);
      expect(result.isValid).toBe(true);
    });

    it('should validate max length correctly', () => {
      const maxLengthField: FieldDescriptor = {
        id: 'shortText',
        type: 'text',
        label: 'Short Text',
        required: false,
        validation: [
          {
            type: 'maxLength',
            message: 'Text is too long',
            params: { maxLength: 10 }
          }
        ]
      };

      validationEngine.updateFieldDescriptors([maxLengthField]);

      // Test too long
      let result = validationEngine.validateField('shortText', 'This text is too long', mockFormState);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('maxLength');

      // Test valid length
      result = validationEngine.validateField('shortText', 'Short', mockFormState);
      expect(result.isValid).toBe(true);
    });
  });

  describe('utility methods', () => {
    it('should manage custom rules correctly', () => {
      const testRule: ValidationFunction = () => ({ isValid: true, errors: [] });
      
      validationEngine.addCustomRule('testRule', testRule);
      expect(validationEngine.getCustomRules()).toContain('testRule');
      
      expect(validationEngine.removeCustomRule('testRule')).toBe(true);
      expect(validationEngine.getCustomRules()).not.toContain('testRule');
      
      expect(validationEngine.removeCustomRule('nonexistent')).toBe(false);
    });

    it('should clear async cache', () => {
      validationEngine.clearAsyncCache();
      // This test mainly ensures the method doesn't throw
      expect(true).toBe(true);
    });
  });
});