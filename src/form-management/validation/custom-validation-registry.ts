/**
 * Custom Validation Registry - Manages custom validation rules and execution context
 */

import {
  ValidationFunction,
  ValidationResult,
  FormState,
  FieldDescriptor
} from '../types/core.js';

export interface ValidationContext {
  fieldId: string;
  fieldValue: any;
  formState: FormState;
  fieldDescriptor?: FieldDescriptor;
  allFieldDescriptors?: Map<string, FieldDescriptor>;
  customData?: Record<string, any>;
}

export interface CustomValidationRule {
  name: string;
  description: string;
  validationFunction: ValidationFunction;
  isAsync: boolean;
  dependencies?: string[]; // Field IDs this validation depends on
  category?: string;
  version?: string;
}

export interface ValidationExecutionContext {
  getFieldValue(fieldId: string): any;
  getFieldDescriptor(fieldId: string): FieldDescriptor | undefined;
  getAllFieldValues(): Record<string, any>;
  getFormMetadata(): FormState['metadata'];
  hasField(fieldId: string): boolean;
  isFieldTouched(fieldId: string): boolean;
  isFieldDirty(fieldId: string): boolean;
  getCustomData(key: string): any;
  setCustomData(key: string, value: any): void;
}

export class CustomValidationRegistry {
  private rules: Map<string, CustomValidationRule> = new Map();
  private categories: Map<string, Set<string>> = new Map();
  private dependencies: Map<string, Set<string>> = new Map();
  private customData: Map<string, any> = new Map();

  /**
   * Register a custom validation rule
   */
  registerRule(rule: CustomValidationRule): void {
    // Validate rule name
    if (!rule.name || typeof rule.name !== 'string') {
      throw new Error('Rule name must be a non-empty string');
    }

    if (this.rules.has(rule.name)) {
      throw new Error(`Validation rule '${rule.name}' is already registered`);
    }

    // Validate function
    if (typeof rule.validationFunction !== 'function') {
      throw new Error('Validation function must be a function');
    }

    // Store rule
    this.rules.set(rule.name, { ...rule });

    // Index by category
    if (rule.category) {
      if (!this.categories.has(rule.category)) {
        this.categories.set(rule.category, new Set());
      }
      this.categories.get(rule.category)!.add(rule.name);
    }

    // Index dependencies
    if (rule.dependencies && rule.dependencies.length > 0) {
      this.dependencies.set(rule.name, new Set(rule.dependencies));
    }
  }

  /**
   * Unregister a custom validation rule
   */
  unregisterRule(ruleName: string): boolean {
    const rule = this.rules.get(ruleName);
    if (!rule) {
      return false;
    }

    // Remove from rules
    this.rules.delete(ruleName);

    // Remove from category index
    if (rule.category) {
      const categoryRules = this.categories.get(rule.category);
      if (categoryRules) {
        categoryRules.delete(ruleName);
        if (categoryRules.size === 0) {
          this.categories.delete(rule.category);
        }
      }
    }

    // Remove from dependencies index
    this.dependencies.delete(ruleName);

    return true;
  }

  /**
   * Get a registered validation rule
   */
  getRule(ruleName: string): CustomValidationRule | undefined {
    return this.rules.get(ruleName);
  }

  /**
   * Get all registered rule names
   */
  getRuleNames(): string[] {
    return Array.from(this.rules.keys());
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category: string): CustomValidationRule[] {
    const ruleNames = this.categories.get(category);
    if (!ruleNames) {
      return [];
    }

    return Array.from(ruleNames)
      .map(name => this.rules.get(name)!)
      .filter(Boolean);
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  /**
   * Check if a rule exists
   */
  hasRule(ruleName: string): boolean {
    return this.rules.has(ruleName);
  }

  /**
   * Execute a custom validation rule with full context
   */
  async executeRule(
    ruleName: string,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const rule = this.rules.get(ruleName);
    if (!rule) {
      return {
        isValid: false,
        errors: [{
          code: 'unknown_rule',
          message: `Unknown validation rule: ${ruleName}`,
          field: context.fieldId
        }]
      };
    }

    try {
      // Create execution context
      const executionContext = this.createExecutionContext(context);

      // Execute validation function
      const result = await Promise.resolve(
        rule.validationFunction(context.fieldValue, context.formState, executionContext)
      );

      return result;
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          code: 'custom_rule_error',
          message: `Custom validation error in '${ruleName}': ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          field: context.fieldId
        }]
      };
    }
  }

  /**
   * Execute multiple validation rules for a field
   */
  async executeRulesForField(
    ruleNames: string[],
    context: ValidationContext
  ): Promise<ValidationResult> {
    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];

    // Execute rules in parallel
    const results = await Promise.allSettled(
      ruleNames.map(ruleName => this.executeRule(ruleName, context))
    );

    // Collect results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const validationResult = result.value;
        if (!validationResult.isValid) {
          errors.push(...validationResult.errors);
        }
        if (validationResult.warnings) {
          warnings.push(...validationResult.warnings);
        }
      } else {
        errors.push({
          code: 'rule_execution_failed',
          message: `Failed to execute rule '${ruleNames[index]}': ${result.reason}`,
          field: context.fieldId
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Get rules that depend on a specific field
   */
  getRulesDependingOnField(fieldId: string): string[] {
    const dependentRules: string[] = [];

    this.dependencies.forEach((deps, ruleName) => {
      if (deps.has(fieldId)) {
        dependentRules.push(ruleName);
      }
    });

    return dependentRules;
  }

  /**
   * Validate rule dependencies are satisfied
   */
  validateDependencies(
    ruleName: string,
    availableFields: Set<string>
  ): { isValid: boolean; missingFields: string[] } {
    const dependencies = this.dependencies.get(ruleName);
    if (!dependencies) {
      return { isValid: true, missingFields: [] };
    }

    const missingFields = Array.from(dependencies).filter(
      fieldId => !availableFields.has(fieldId)
    );

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Create execution context for validation functions
   */
  private createExecutionContext(context: ValidationContext): ValidationExecutionContext {
    return {
      getFieldValue: (fieldId: string) => {
        return context.formState.values[fieldId];
      },

      getFieldDescriptor: (fieldId: string) => {
        return context.allFieldDescriptors?.get(fieldId);
      },

      getAllFieldValues: () => {
        return { ...context.formState.values };
      },

      getFormMetadata: () => {
        return { ...context.formState.metadata };
      },

      hasField: (fieldId: string) => {
        return fieldId in context.formState.values;
      },

      isFieldTouched: (fieldId: string) => {
        return context.formState.touched[fieldId] || false;
      },

      isFieldDirty: (fieldId: string) => {
        return context.formState.dirty[fieldId] || false;
      },

      getCustomData: (key: string) => {
        return this.customData.get(key);
      },

      setCustomData: (key: string, value: any) => {
        this.customData.set(key, value);
      }
    };
  }

  /**
   * Register multiple rules at once
   */
  registerRules(rules: CustomValidationRule[]): void {
    const errors: string[] = [];

    rules.forEach(rule => {
      try {
        this.registerRule(rule);
      } catch (error) {
        errors.push(`Failed to register rule '${rule.name}': ${
          error instanceof Error ? error.message : 'Unknown error'
        }`);
      }
    });

    if (errors.length > 0) {
      throw new Error(`Failed to register some rules:\n${errors.join('\n')}`);
    }
  }

  /**
   * Clear all custom data
   */
  clearCustomData(): void {
    this.customData.clear();
  }

  /**
   * Get registry statistics
   */
  getStatistics(): {
    totalRules: number;
    asyncRules: number;
    syncRules: number;
    categories: number;
    rulesWithDependencies: number;
  } {
    const rules = Array.from(this.rules.values());

    return {
      totalRules: rules.length,
      asyncRules: rules.filter(r => r.isAsync).length,
      syncRules: rules.filter(r => !r.isAsync).length,
      categories: this.categories.size,
      rulesWithDependencies: this.dependencies.size
    };
  }

  /**
   * Export rules configuration
   */
  exportRules(): CustomValidationRule[] {
    return Array.from(this.rules.values()).map(rule => ({
      ...rule,
      // Don't export the actual function, just metadata
      validationFunction: rule.validationFunction
    }));
  }

  /**
   * Clear all rules
   */
  clear(): void {
    this.rules.clear();
    this.categories.clear();
    this.dependencies.clear();
    this.customData.clear();
  }
}

// Enhanced validation function type with execution context
export type EnhancedValidationFunction = (
  value: any,
  formState: FormState,
  context?: ValidationExecutionContext
) => ValidationResult | Promise<ValidationResult>;

// Common custom validation rule builders
export class ValidationRuleBuilders {
  /**
   * Create a field comparison rule
   */
  static createFieldComparisonRule(
    name: string,
    targetFieldId: string,
    comparison: 'equals' | 'not-equals' | 'greater' | 'less' | 'greater-equal' | 'less-equal',
    message: string
  ): CustomValidationRule {
    return {
      name,
      description: `Compare field value with ${targetFieldId}`,
      isAsync: false,
      dependencies: [targetFieldId],
      validationFunction: (value, formState, context) => {
        const targetValue = context?.getFieldValue(targetFieldId);
        let isValid = false;

        switch (comparison) {
          case 'equals':
            isValid = value === targetValue;
            break;
          case 'not-equals':
            isValid = value !== targetValue;
            break;
          case 'greater':
            isValid = Number(value) > Number(targetValue);
            break;
          case 'less':
            isValid = Number(value) < Number(targetValue);
            break;
          case 'greater-equal':
            isValid = Number(value) >= Number(targetValue);
            break;
          case 'less-equal':
            isValid = Number(value) <= Number(targetValue);
            break;
        }

        return {
          isValid,
          errors: isValid ? [] : [{
            code: 'field_comparison_failed',
            message
          }]
        };
      }
    };
  }

  /**
   * Create a conditional validation rule
   */
  static createConditionalRule(
    name: string,
    condition: (context: ValidationExecutionContext) => boolean,
    validationFunction: ValidationFunction,
    message: string
  ): CustomValidationRule {
    return {
      name,
      description: `Conditional validation: ${name}`,
      isAsync: false,
      validationFunction: (value, formState, context) => {
        if (!context || !condition(context)) {
          return { isValid: true, errors: [] };
        }

        return validationFunction(value, formState);
      }
    };
  }

  /**
   * Create an async API validation rule
   */
  static createAsyncApiRule(
    name: string,
    apiCall: (value: any) => Promise<boolean>,
    message: string
  ): CustomValidationRule {
    return {
      name,
      description: `Async API validation: ${name}`,
      isAsync: true,
      validationFunction: async (value) => {
        try {
          const isValid = await apiCall(value);
          return {
            isValid,
            errors: isValid ? [] : [{
              code: 'api_validation_failed',
              message
            }]
          };
        } catch (error) {
          return {
            isValid: false,
            errors: [{
              code: 'api_validation_error',
              message: `API validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            }]
          };
        }
      }
    };
  }
}