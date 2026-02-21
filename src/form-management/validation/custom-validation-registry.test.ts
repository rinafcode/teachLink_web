/**
 * Unit tests for CustomValidationRegistry
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  CustomValidationRegistry, 
  CustomValidationRule, 
  ValidationContext,
  ValidationRuleBuilders
} from './custom-validation-registry.js';
import { FormState, ValidationFunction } from '../types/core.js';

describe('CustomValidationRegistry', () => {
  let registry: CustomValidationRegistry;
  let mockFormState: FormState;
  let mockContext: ValidationContext;

  beforeEach(() => {
    registry = new CustomValidationRegistry();
    
    mockFormState = {
      values: {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      },
      validation: {},
      touched: { email: true },
      dirty: { email: true },
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

    mockContext = {
      fieldId: 'email',
      fieldValue: 'test@example.com',
      formState: mockFormState
    };
  });

  describe('rule registration', () => {
    it('should register a custom validation rule', () => {
      const rule: CustomValidationRule = {
        name: 'test-rule',
        description: 'Test validation rule',
        isAsync: false,
        validationFunction: (value) => ({
          isValid: value === 'valid',
          errors: []
        })
      };

      registry.registerRule(rule);
      
      expect(registry.hasRule('test-rule')).toBe(true);
      expect(registry.getRuleNames()).toContain('test-rule');
      expect(registry.getRule('test-rule')).toEqual(rule);
    });

    it('should throw error for duplicate rule names', () => {
      const rule: CustomValidationRule = {
        name: 'duplicate-rule',
        description: 'Test rule',
        isAsync: false,
        validationFunction: () => ({ isValid: true, errors: [] })
      };

      registry.registerRule(rule);
      
      expect(() => registry.registerRule(rule)).toThrow(
        "Validation rule 'duplicate-rule' is already registered"
      );
    });

    it('should throw error for invalid rule name', () => {
      const rule: CustomValidationRule = {
        name: '',
        description: 'Test rule',
        isAsync: false,
        validationFunction: () => ({ isValid: true, errors: [] })
      };

      expect(() => registry.registerRule(rule)).toThrow(
        'Rule name must be a non-empty string'
      );
    });

    it('should throw error for invalid validation function', () => {
      const rule = {
        name: 'invalid-rule',
        description: 'Test rule',
        isAsync: false,
        validationFunction: 'not a function'
      } as any;

      expect(() => registry.registerRule(rule)).toThrow(
        'Validation function must be a function'
      );
    });

    it('should register multiple rules at once', () => {
      const rules: CustomValidationRule[] = [
        {
          name: 'rule1',
          description: 'Rule 1',
          isAsync: false,
          validationFunction: () => ({ isValid: true, errors: [] })
        },
        {
          name: 'rule2',
          description: 'Rule 2',
          isAsync: false,
          validationFunction: () => ({ isValid: true, errors: [] })
        }
      ];

      registry.registerRules(rules);
      
      expect(registry.hasRule('rule1')).toBe(true);
      expect(registry.hasRule('rule2')).toBe(true);
    });
  });

  describe('rule unregistration', () => {
    it('should unregister a rule', () => {
      const rule: CustomValidationRule = {
        name: 'temp-rule',
        description: 'Temporary rule',
        isAsync: false,
        validationFunction: () => ({ isValid: true, errors: [] })
      };

      registry.registerRule(rule);
      expect(registry.hasRule('temp-rule')).toBe(true);
      
      const result = registry.unregisterRule('temp-rule');
      expect(result).toBe(true);
      expect(registry.hasRule('temp-rule')).toBe(false);
    });

    it('should return false for non-existent rule', () => {
      const result = registry.unregisterRule('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('category management', () => {
    it('should organize rules by category', () => {
      const rule1: CustomValidationRule = {
        name: 'email-rule',
        description: 'Email validation',
        isAsync: false,
        category: 'format',
        validationFunction: () => ({ isValid: true, errors: [] })
      };

      const rule2: CustomValidationRule = {
        name: 'phone-rule',
        description: 'Phone validation',
        isAsync: false,
        category: 'format',
        validationFunction: () => ({ isValid: true, errors: [] })
      };

      registry.registerRule(rule1);
      registry.registerRule(rule2);

      expect(registry.getCategories()).toContain('format');
      expect(registry.getRulesByCategory('format')).toHaveLength(2);
      expect(registry.getRulesByCategory('format').map(r => r.name)).toEqual(
        expect.arrayContaining(['email-rule', 'phone-rule'])
      );
    });

    it('should clean up empty categories', () => {
      const rule: CustomValidationRule = {
        name: 'temp-rule',
        description: 'Temporary rule',
        isAsync: false,
        category: 'temp-category',
        validationFunction: () => ({ isValid: true, errors: [] })
      };

      registry.registerRule(rule);
      expect(registry.getCategories()).toContain('temp-category');
      
      registry.unregisterRule('temp-rule');
      expect(registry.getCategories()).not.toContain('temp-category');
    });
  });

  describe('dependency management', () => {
    it('should track rule dependencies', () => {
      const rule: CustomValidationRule = {
        name: 'password-match',
        description: 'Password confirmation',
        isAsync: false,
        dependencies: ['password'],
        validationFunction: () => ({ isValid: true, errors: [] })
      };

      registry.registerRule(rule);
      
      const dependentRules = registry.getRulesDependingOnField('password');
      expect(dependentRules).toContain('password-match');
    });

    it('should validate dependencies', () => {
      const rule: CustomValidationRule = {
        name: 'dependent-rule',
        description: 'Rule with dependencies',
        isAsync: false,
        dependencies: ['field1', 'field2'],
        validationFunction: () => ({ isValid: true, errors: [] })
      };

      registry.registerRule(rule);
      
      const availableFields = new Set(['field1']);
      const validation = registry.validateDependencies('dependent-rule', availableFields);
      
      expect(validation.isValid).toBe(false);
      expect(validation.missingFields).toContain('field2');
    });
  });

  describe('rule execution', () => {
    it('should execute a custom validation rule', async () => {
      const mockValidation: ValidationFunction = vi.fn().mockReturnValue({
        isValid: true,
        errors: []
      });

      const rule: CustomValidationRule = {
        name: 'test-execution',
        description: 'Test execution',
        isAsync: false,
        validationFunction: mockValidation
      };

      registry.registerRule(rule);
      
      const result = await registry.executeRule('test-execution', mockContext);
      
      expect(result.isValid).toBe(true);
      expect(mockValidation).toHaveBeenCalledWith(
        mockContext.fieldValue,
        mockContext.formState,
        expect.any(Object) // execution context
      );
    });

    it('should handle rule execution errors', async () => {
      const errorRule: CustomValidationRule = {
        name: 'error-rule',
        description: 'Rule that throws error',
        isAsync: false,
        validationFunction: () => {
          throw new Error('Validation error');
        }
      };

      registry.registerRule(errorRule);
      
      const result = await registry.executeRule('error-rule', mockContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('custom_rule_error');
      expect(result.errors[0].message).toContain('Validation error');
    });

    it('should handle unknown rules', async () => {
      const result = await registry.executeRule('unknown-rule', mockContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('unknown_rule');
    });

    it('should execute multiple rules for a field', async () => {
      const rule1: CustomValidationRule = {
        name: 'rule1',
        description: 'Rule 1',
        isAsync: false,
        validationFunction: () => ({ isValid: true, errors: [] })
      };

      const rule2: CustomValidationRule = {
        name: 'rule2',
        description: 'Rule 2',
        isAsync: false,
        validationFunction: () => ({
          isValid: false,
          errors: [{ code: 'rule2_error', message: 'Rule 2 failed' }]
        })
      };

      registry.registerRule(rule1);
      registry.registerRule(rule2);
      
      const result = await registry.executeRulesForField(['rule1', 'rule2'], mockContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('rule2_error');
    });
  });

  describe('execution context', () => {
    it('should provide execution context to validation functions', async () => {
      let capturedContext: any;

      const rule: CustomValidationRule = {
        name: 'context-test',
        description: 'Test execution context',
        isAsync: false,
        validationFunction: (value, formState, context) => {
          capturedContext = context;
          return { isValid: true, errors: [] };
        }
      };

      registry.registerRule(rule);
      await registry.executeRule('context-test', mockContext);
      
      expect(capturedContext).toBeDefined();
      expect(typeof capturedContext.getFieldValue).toBe('function');
      expect(typeof capturedContext.getAllFieldValues).toBe('function');
      expect(typeof capturedContext.isFieldTouched).toBe('function');
      
      // Test context methods
      expect(capturedContext.getFieldValue('email')).toBe('test@example.com');
      expect(capturedContext.isFieldTouched('email')).toBe(true);
      expect(capturedContext.isFieldDirty('email')).toBe(true);
      expect(capturedContext.hasField('email')).toBe(true);
    });

    it('should handle custom data in execution context', async () => {
      let capturedContext: any;

      const rule: CustomValidationRule = {
        name: 'custom-data-test',
        description: 'Test custom data',
        isAsync: false,
        validationFunction: (value, formState, context) => {
          capturedContext = context;
          context?.setCustomData('testKey', 'testValue');
          return { isValid: true, errors: [] };
        }
      };

      registry.registerRule(rule);
      await registry.executeRule('custom-data-test', mockContext);
      
      expect(capturedContext.getCustomData('testKey')).toBe('testValue');
    });
  });

  describe('statistics and utilities', () => {
    it('should provide registry statistics', () => {
      const syncRule: CustomValidationRule = {
        name: 'sync-rule',
        description: 'Sync rule',
        isAsync: false,
        validationFunction: () => ({ isValid: true, errors: [] })
      };

      const asyncRule: CustomValidationRule = {
        name: 'async-rule',
        description: 'Async rule',
        isAsync: true,
        dependencies: ['field1'],
        validationFunction: () => Promise.resolve({ isValid: true, errors: [] })
      };

      registry.registerRule(syncRule);
      registry.registerRule(asyncRule);
      
      const stats = registry.getStatistics();
      
      expect(stats.totalRules).toBe(2);
      expect(stats.syncRules).toBe(1);
      expect(stats.asyncRules).toBe(1);
      expect(stats.rulesWithDependencies).toBe(1);
    });

    it('should export rules configuration', () => {
      const rule: CustomValidationRule = {
        name: 'export-test',
        description: 'Export test rule',
        isAsync: false,
        validationFunction: () => ({ isValid: true, errors: [] })
      };

      registry.registerRule(rule);
      
      const exported = registry.exportRules();
      expect(exported).toHaveLength(1);
      expect(exported[0].name).toBe('export-test');
    });

    it('should clear all rules and data', () => {
      const rule: CustomValidationRule = {
        name: 'clear-test',
        description: 'Clear test rule',
        isAsync: false,
        validationFunction: () => ({ isValid: true, errors: [] })
      };

      registry.registerRule(rule);
      registry.clear();
      
      expect(registry.getRuleNames()).toHaveLength(0);
      expect(registry.getCategories()).toHaveLength(0);
    });
  });

  describe('ValidationRuleBuilders', () => {
    it('should create field comparison rule', () => {
      const rule = ValidationRuleBuilders.createFieldComparisonRule(
        'password-match',
        'password',
        'equals',
        'Passwords must match'
      );

      expect(rule.name).toBe('password-match');
      expect(rule.dependencies).toContain('password');
      expect(rule.isAsync).toBe(false);
    });

    it('should create conditional rule', () => {
      const condition = (context: any) => context.getFieldValue('enableValidation') === true;
      const validation: ValidationFunction = (value) => ({
        isValid: value.length > 5,
        errors: value.length <= 5 ? [{ code: 'too_short', message: 'Too short' }] : []
      });

      const rule = ValidationRuleBuilders.createConditionalRule(
        'conditional-length',
        condition,
        validation,
        'Conditional validation failed'
      );

      expect(rule.name).toBe('conditional-length');
      expect(rule.isAsync).toBe(false);
    });

    it('should create async API rule', () => {
      const apiCall = vi.fn().mockResolvedValue(true);
      
      const rule = ValidationRuleBuilders.createAsyncApiRule(
        'api-validation',
        apiCall,
        'API validation failed'
      );

      expect(rule.name).toBe('api-validation');
      expect(rule.isAsync).toBe(true);
    });
  });
});