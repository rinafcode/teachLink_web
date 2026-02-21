/**
 * Validation Engine - Core validation system for form fields
 * Handles synchronous and asynchronous validation with built-in and custom rules
 */

import {
  ValidationRule,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  FormValidationResult,
  FormState,
  ValidationFunction,
  FieldDescriptor
} from '../types/core.js';

export interface ValidationEngine {
  validateField(fieldId: string, value: any, context: FormState): ValidationResult;
  validateForm(formState: FormState): Promise<FormValidationResult>;
  addCustomRule(name: string, rule: ValidationFunction): void;
  executeAsyncValidation(fieldId: string, value: any): Promise<ValidationResult>;
}

export interface ValidationContext {
  fieldId: string;
  value: any;
  formState: FormState;
  fieldDescriptor?: FieldDescriptor;
}

export interface AsyncValidationOptions {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export class ValidationEngineImpl implements ValidationEngine {
  private customRules: Map<string, ValidationFunction> = new Map();
  private fieldDescriptors: Map<string, FieldDescriptor> = new Map();
  private asyncValidationCache: Map<string, Promise<ValidationResult>> = new Map();
  private defaultAsyncOptions: AsyncValidationOptions = {
    timeout: 5000,
    retryAttempts: 3,
    retryDelay: 1000
  };

  constructor(fieldDescriptors: FieldDescriptor[] = []) {
    this.initializeFieldDescriptors(fieldDescriptors);
    this.initializeBuiltInRules();
  }

  /**
   * Initialize field descriptors for validation context
   */
  private initializeFieldDescriptors(fieldDescriptors: FieldDescriptor[]): void {
    fieldDescriptors.forEach(field => {
      this.fieldDescriptors.set(field.id, field);
    });
  }

  /**
   * Initialize built-in validation rules
   */
  private initializeBuiltInRules(): void {
    // Built-in rules are implemented as methods, not stored in customRules
    // This keeps them separate from user-defined custom rules
  }

  /**
   * Validate a single field with all its validation rules
   */
  validateField(fieldId: string, value: any, context: FormState): ValidationResult {
    const fieldDescriptor = this.fieldDescriptors.get(fieldId);
    if (!fieldDescriptor) {
      return {
        isValid: true,
        errors: [],
        warnings: []
      };
    }

    const validationContext: ValidationContext = {
      fieldId,
      value,
      formState: context,
      fieldDescriptor
    };

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Process each validation rule
    for (const rule of fieldDescriptor.validation) {
      // Check if rule condition is met (if specified)
      if (rule.condition && !rule.condition(context)) {
        continue;
      }

      // Skip async rules in synchronous validation
      if (rule.type === 'async') {
        continue;
      }

      const ruleResult = this.executeValidationRule(rule, validationContext);
      
      if (!ruleResult.isValid) {
        errors.push(...ruleResult.errors);
      }
      
      if (ruleResult.warnings) {
        warnings.push(...ruleResult.warnings);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Validate entire form with all field validation rules
   */
  async validateForm(formState: FormState): Promise<FormValidationResult> {
    const fieldResults: Record<string, ValidationResult> = {};
    const globalErrors: ValidationError[] = [];
    let isFormValid = true;

    // Validate each field
    for (const [fieldId] of this.fieldDescriptors) {
      const fieldValue = formState.values[fieldId];
      
      // Synchronous validation
      const syncResult = this.validateField(fieldId, fieldValue, formState);
      
      // Asynchronous validation
      const asyncResult = await this.executeAsyncValidation(fieldId, fieldValue);
      
      // Combine results
      const combinedResult: ValidationResult = {
        isValid: syncResult.isValid && asyncResult.isValid,
        errors: [...syncResult.errors, ...asyncResult.errors],
        warnings: [
          ...(syncResult.warnings || []),
          ...(asyncResult.warnings || [])
        ]
      };

      fieldResults[fieldId] = combinedResult;
      
      if (!combinedResult.isValid) {
        isFormValid = false;
      }
    }

    return {
      isValid: isFormValid,
      fieldResults,
      globalErrors
    };
  }

  /**
   * Add a custom validation rule
   */
  addCustomRule(name: string, rule: ValidationFunction): void {
    this.customRules.set(name, rule);
  }

  /**
   * Execute asynchronous validation for a field
   */
  async executeAsyncValidation(fieldId: string, value: any): Promise<ValidationResult> {
    const fieldDescriptor = this.fieldDescriptors.get(fieldId);
    if (!fieldDescriptor) {
      return { isValid: true, errors: [] };
    }

    const asyncRules = fieldDescriptor.validation.filter(rule => rule.type === 'async');
    if (asyncRules.length === 0) {
      return { isValid: true, errors: [] };
    }

    const cacheKey = `${fieldId}:${JSON.stringify(value)}`;
    
    // Return cached result if available
    if (this.asyncValidationCache.has(cacheKey)) {
      return this.asyncValidationCache.get(cacheKey)!;
    }

    // Create validation promise
    const validationPromise = this.executeAsyncRules(asyncRules, fieldId, value);
    
    // Cache the promise
    this.asyncValidationCache.set(cacheKey, validationPromise);
    
    // Clean up cache after completion
    validationPromise.finally(() => {
      this.asyncValidationCache.delete(cacheKey);
    });

    return validationPromise;
  }

  /**
   * Execute a single validation rule
   */
  private executeValidationRule(rule: ValidationRule, context: ValidationContext): ValidationResult {
    try {
      switch (rule.type) {
        case 'required':
          return this.validateRequired(context.value, rule);
        case 'email':
          return this.validateEmail(context.value, rule);
        case 'minLength':
          return this.validateMinLength(context.value, rule);
        case 'maxLength':
          return this.validateMaxLength(context.value, rule);
        case 'pattern':
          return this.validatePattern(context.value, rule);
        case 'custom':
          return this.validateCustom(context, rule);
        default:
          return {
            isValid: true,
            errors: []
          };
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          code: 'validation_error',
          message: `Validation rule execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          field: context.fieldId
        }]
      };
    }
  }

  /**
   * Execute async validation rules with retry logic
   */
  private async executeAsyncRules(
    rules: ValidationRule[], 
    fieldId: string, 
    value: any
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const rule of rules) {
      try {
        const result = await this.executeAsyncRule(rule, fieldId, value);
        
        if (!result.isValid) {
          errors.push(...result.errors);
        }
        
        if (result.warnings) {
          warnings.push(...result.warnings);
        }
      } catch (error) {
        errors.push({
          code: 'async_validation_error',
          message: `Async validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          field: fieldId
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Execute a single async validation rule with timeout and retry
   */
  private async executeAsyncRule(
    rule: ValidationRule, 
    fieldId: string, 
    value: any
  ): Promise<ValidationResult> {
    const customRule = this.customRules.get(rule.type);
    if (!customRule) {
      throw new Error(`Unknown async validation rule: ${rule.type}`);
    }

    const options = { ...this.defaultAsyncOptions, ...(rule.params?.asyncOptions || {}) };
    
    for (let attempt = 0; attempt <= options.retryAttempts!; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Validation timeout')), options.timeout);
        });

        const validationPromise = Promise.resolve(customRule(value, {} as FormState));
        
        const result = await Promise.race([validationPromise, timeoutPromise]);
        return result;
      } catch (error) {
        if (attempt === options.retryAttempts) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, options.retryDelay));
      }
    }

    throw new Error('Max retry attempts exceeded');
  }

  // Built-in validation rule implementations

  private validateRequired(value: any, rule: ValidationRule): ValidationResult {
    const isEmpty = value === null || 
                   value === undefined || 
                   value === '' || 
                   (Array.isArray(value) && value.length === 0);

    if (isEmpty) {
      return {
        isValid: false,
        errors: [{
          code: 'required',
          message: rule.message || 'This field is required'
        }]
      };
    }

    return { isValid: true, errors: [] };
  }

  private validateEmail(value: any, rule: ValidationRule): ValidationResult {
    if (!value) {
      return { isValid: true, errors: [] }; // Empty values are handled by required rule
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(String(value))) {
      return {
        isValid: false,
        errors: [{
          code: 'email',
          message: rule.message || 'Please enter a valid email address'
        }]
      };
    }

    return { isValid: true, errors: [] };
  }

  private validateMinLength(value: any, rule: ValidationRule): ValidationResult {
    if (!value) {
      return { isValid: true, errors: [] }; // Empty values are handled by required rule
    }

    const minLength = rule.params?.minLength || 0;
    const valueLength = String(value).length;

    if (valueLength < minLength) {
      return {
        isValid: false,
        errors: [{
          code: 'minLength',
          message: rule.message || `Minimum length is ${minLength} characters`
        }]
      };
    }

    return { isValid: true, errors: [] };
  }

  private validateMaxLength(value: any, rule: ValidationRule): ValidationResult {
    if (!value) {
      return { isValid: true, errors: [] }; // Empty values are handled by required rule
    }

    const maxLength = rule.params?.maxLength || Infinity;
    const valueLength = String(value).length;

    if (valueLength > maxLength) {
      return {
        isValid: false,
        errors: [{
          code: 'maxLength',
          message: rule.message || `Maximum length is ${maxLength} characters`
        }]
      };
    }

    return { isValid: true, errors: [] };
  }

  private validatePattern(value: any, rule: ValidationRule): ValidationResult {
    if (!value) {
      return { isValid: true, errors: [] }; // Empty values are handled by required rule
    }

    const pattern = rule.params?.pattern;
    if (!pattern) {
      return { isValid: true, errors: [] };
    }

    const regex = new RegExp(pattern);
    
    if (!regex.test(String(value))) {
      return {
        isValid: false,
        errors: [{
          code: 'pattern',
          message: rule.message || 'Value does not match required pattern'
        }]
      };
    }

    return { isValid: true, errors: [] };
  }

  private validateCustom(context: ValidationContext, rule: ValidationRule): ValidationResult {
    const customRule = this.customRules.get(rule.type);
    if (!customRule) {
      return {
        isValid: false,
        errors: [{
          code: 'unknown_rule',
          message: `Unknown validation rule: ${rule.type}`
        }]
      };
    }

    try {
      const result = customRule(context.value, context.formState);
      
      // Handle both sync and async results (though async should not be called here)
      if (result instanceof Promise) {
        return {
          isValid: false,
          errors: [{
            code: 'async_in_sync',
            message: 'Async validation rule called in synchronous context'
          }]
        };
      }

      return result;
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          code: 'custom_rule_error',
          message: `Custom validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }

  /**
   * Update field descriptors (useful when form configuration changes)
   */
  updateFieldDescriptors(fieldDescriptors: FieldDescriptor[]): void {
    this.fieldDescriptors.clear();
    this.initializeFieldDescriptors(fieldDescriptors);
  }

  /**
   * Clear async validation cache
   */
  clearAsyncCache(): void {
    this.asyncValidationCache.clear();
  }

  /**
   * Get all registered custom rules
   */
  getCustomRules(): string[] {
    return Array.from(this.customRules.keys());
  }

  /**
   * Remove a custom rule
   */
  removeCustomRule(name: string): boolean {
    return this.customRules.delete(name);
  }
}