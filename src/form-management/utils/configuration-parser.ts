/**
 * Configuration Parser for Form Management System
 * 
 * Provides JSON schema validation for FormConfiguration objects,
 * validation for field types, required properties, and nested structures,
 * and descriptive error messages for invalid configurations.
 */

import { z } from 'zod';
import { 
  FormConfiguration, 
  FieldDescriptor, 
  ValidationRule, 
  ValidationResult, 
  ValidationError,
  FieldType,
  LayoutConfiguration,
  ValidationConfiguration,
  AutoSaveConfiguration,
  AnalyticsConfiguration,
  AccessibilityConfiguration,
  WizardStep,
  FieldStyling,
  FieldGroup,
  ResponsiveConfiguration,
  ConditionalRule,
  ConditionalAction
} from '../types/core';
import { ConfigurationParser } from '../types/interfaces';

// Zod schema for FieldType
const FieldTypeSchema = z.enum([
  'text', 'number', 'email', 'password', 'select', 
  'checkbox', 'radio', 'textarea', 'file', 'date', 
  'time', 'datetime-local'
]);

// Zod schema for ValidationRule - use type assertion for function schemas
const ValidationRuleSchema = z.object({
  type: z.enum(['required', 'email', 'minLength', 'maxLength', 'pattern', 'custom', 'async']),
  params: z.record(z.any()).optional(),
  message: z.string(),
  condition: z.function().optional()
}) as z.ZodSchema<ValidationRule>;

// Zod schema for FieldStyling
const FieldStylingSchema: z.ZodSchema<FieldStyling> = z.object({
  className: z.string().optional(),
  style: z.record(z.string()).optional(),
  width: z.enum(['full', 'half', 'third', 'quarter']).optional(),
  order: z.number().optional()
});

// Zod schema for FieldDescriptor
const FieldDescriptorSchema: z.ZodSchema<FieldDescriptor> = z.object({
  id: z.string().min(1, "Field ID cannot be empty"),
  type: FieldTypeSchema,
  label: z.string().min(1, "Field label cannot be empty"),
  placeholder: z.string().optional(),
  required: z.boolean(),
  validation: z.array(ValidationRuleSchema),
  dependencies: z.array(z.string()).optional(),
  styling: FieldStylingSchema.optional()
});

// Zod schema for ConditionalAction
const ConditionalActionSchema: z.ZodSchema<ConditionalAction> = z.object({
  type: z.enum(['show', 'hide', 'enable', 'disable', 'setValue']),
  targetFieldId: z.string(),
  value: z.any().optional()
});

// Zod schema for ConditionalRule - use type assertion for function schemas
const ConditionalRuleSchema = z.object({
  id: z.string(),
  condition: z.function(),
  actions: z.array(ConditionalActionSchema)
}) as z.ZodSchema<ConditionalRule>;

// Zod schema for ResponsiveConfiguration
const ResponsiveConfigurationSchema: z.ZodSchema<ResponsiveConfiguration> = z.object({
  breakpoints: z.record(z.number()),
  layouts: z.record(z.lazy(() => LayoutConfigurationSchema))
});

// Zod schema for FieldGroup
const FieldGroupSchema: z.ZodSchema<FieldGroup> = z.object({
  id: z.string(),
  title: z.string().optional(),
  fields: z.array(z.string()),
  layout: z.lazy(() => LayoutConfigurationSchema).optional()
});

// Zod schema for LayoutConfiguration
const LayoutConfigurationSchema: z.ZodSchema<LayoutConfiguration> = z.object({
  type: z.enum(['single-column', 'two-column', 'grid', 'custom']),
  spacing: z.enum(['compact', 'normal', 'relaxed']),
  fieldGroups: z.array(FieldGroupSchema).optional(),
  responsive: ResponsiveConfigurationSchema
});

// Zod schema for ValidationConfiguration - use type assertion for function schemas
const ValidationConfigurationSchema = z.object({
  validateOnChange: z.boolean(),
  validateOnBlur: z.boolean(),
  showErrorsOnSubmit: z.boolean(),
  debounceMs: z.number().min(0),
  customRules: z.record(z.function())
}) as z.ZodSchema<ValidationConfiguration>;

// Zod schema for AutoSaveConfiguration
const AutoSaveConfigurationSchema: z.ZodSchema<AutoSaveConfiguration> = z.object({
  enabled: z.boolean(),
  intervalMs: z.number().min(1000, "Auto-save interval must be at least 1000ms"),
  saveOnBlur: z.boolean(),
  maxDrafts: z.number().min(1, "Must allow at least 1 draft"),
  compressionEnabled: z.boolean()
});

// Zod schema for AnalyticsConfiguration
const AnalyticsConfigurationSchema: z.ZodSchema<AnalyticsConfiguration> = z.object({
  enabled: z.boolean(),
  trackFieldInteractions: z.boolean(),
  trackTimeSpent: z.boolean(),
  privacyMode: z.boolean(),
  customEvents: z.array(z.string())
});

// Zod schema for AccessibilityConfiguration
const AccessibilityConfigurationSchema: z.ZodSchema<AccessibilityConfiguration> = z.object({
  highContrastMode: z.boolean(),
  screenReaderSupport: z.boolean(),
  keyboardNavigation: z.boolean(),
  customFocusIndicators: z.boolean()
});

// Zod schema for WizardStep - use type assertion for function schemas
const WizardStepSchema = z.object({
  index: z.number().min(0),
  id: z.string(),
  title: z.string(),
  fields: z.array(z.string()),
  isComplete: z.boolean(),
  isValid: z.boolean(),
  conditionalNext: z.function().optional()
}) as z.ZodSchema<WizardStep>;

// Main FormConfiguration schema
const FormConfigurationSchema: z.ZodSchema<FormConfiguration> = z.object({
  id: z.string().min(1, "Form ID cannot be empty"),
  version: z.string().min(1, "Version cannot be empty"),
  title: z.string().min(1, "Form title cannot be empty"),
  description: z.string().optional(),
  steps: z.array(WizardStepSchema).optional(),
  fields: z.array(FieldDescriptorSchema).min(1, "Form must have at least one field"),
  layout: LayoutConfigurationSchema,
  validation: ValidationConfigurationSchema,
  autoSave: AutoSaveConfigurationSchema.optional(),
  analytics: AnalyticsConfigurationSchema.optional(),
  accessibility: AccessibilityConfigurationSchema.optional()
});

/**
 * Configuration Parser implementation
 */
export class FormConfigurationParser implements ConfigurationParser {
  
  /**
   * Parse JSON string into FormConfiguration object
   */
  parse(json: string): FormConfiguration {
    try {
      const parsed = JSON.parse(json);
      return this.validateAndTransform(parsed);
    } catch (error: unknown) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Validate FormConfiguration object
   */
  validate(config: FormConfiguration): ValidationResult {
    try {
      FormConfigurationSchema.parse(config);
      
      // Additional custom validations
      const customValidationErrors = this.performCustomValidations(config);
      
      return {
        isValid: customValidationErrors.length === 0,
        errors: customValidationErrors
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: ValidationError[] = error.errors.map((err: z.ZodIssue) => ({
          code: err.code,
          message: `${err.path.join('.')}: ${err.message}`,
          field: err.path.join('.')
        }));
        
        return {
          isValid: false,
          errors: validationErrors
        };
      }
      
      return {
        isValid: false,
        errors: [{
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown validation error'
        }]
      };
    }
  }

  /**
   * Format FormConfiguration object to JSON string
   */
  formatToJson(config: FormConfiguration): string {
    try {
      // Create a serializable version by removing functions
      const serializable = this.makeSerializable(config);
      return JSON.stringify(serializable, null, 2);
    } catch (error) {
      throw new Error(`Failed to format configuration to JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Format FormConfiguration object to compact JSON string (no indentation)
   */
  formatToCompactJson(config: FormConfiguration): string {
    try {
      const serializable = this.makeSerializable(config);
      return JSON.stringify(serializable);
    } catch (error) {
      throw new Error(`Failed to format configuration to compact JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Format FormConfiguration object with custom formatting options
   */
  formatToJsonWithOptions(config: FormConfiguration, options: {
    indent?: number | string;
    sortKeys?: boolean;
    includeMetadata?: boolean;
  } = {}): string {
    try {
      const { indent = 2, sortKeys = false, includeMetadata = true } = options;
      
      let serializable = this.makeSerializable(config);
      
      // Add metadata if requested
      if (includeMetadata) {
        serializable = {
          ...serializable,
          _metadata: {
            generatedAt: new Date().toISOString(),
            parserVersion: '1.0.0',
            schemaVersion: config.version
          }
        };
      }
      
      // Sort keys if requested
      if (sortKeys) {
        serializable = this.sortObjectKeys(serializable);
      }
      
      return JSON.stringify(serializable, null, indent);
    } catch (error) {
      throw new Error(`Failed to format configuration with options: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate and transform parsed object to FormConfiguration
   */
  private validateAndTransform(parsed: any): FormConfiguration {
    const result = FormConfigurationSchema.parse(parsed);
    
    // Additional custom validations
    const customValidationErrors = this.performCustomValidations(result);
    if (customValidationErrors.length > 0) {
      throw new Error(`Configuration validation failed: ${customValidationErrors.map(e => e.message).join(', ')}`);
    }
    
    return result;
  }

  /**
   * Perform custom validations beyond schema validation
   */
  private performCustomValidations(config: FormConfiguration): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate field ID uniqueness
    const fieldIds = config.fields.map(f => f.id);
    const duplicateIds = fieldIds.filter((id, index) => fieldIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push({
        code: 'DUPLICATE_FIELD_IDS',
        message: `Duplicate field IDs found: ${duplicateIds.join(', ')}`,
        field: 'fields'
      });
    }

    // Validate field dependencies reference existing fields
    config.fields.forEach(field => {
      if (field.dependencies) {
        const invalidDeps = field.dependencies.filter(dep => !fieldIds.includes(dep));
        if (invalidDeps.length > 0) {
          errors.push({
            code: 'INVALID_FIELD_DEPENDENCY',
            message: `Field '${field.id}' has invalid dependencies: ${invalidDeps.join(', ')}`,
            field: `fields.${field.id}.dependencies`
          });
        }
      }
    });

    // Validate circular dependencies
    const circularDeps = this.detectCircularDependencies(config.fields);
    if (circularDeps.length > 0) {
      errors.push({
        code: 'CIRCULAR_DEPENDENCY',
        message: `Circular dependencies detected: ${circularDeps.join(' -> ')}`,
        field: 'fields'
      });
    }

    // Validate wizard steps reference existing fields
    if (config.steps) {
      config.steps.forEach(step => {
        const invalidFields = step.fields.filter(fieldId => !fieldIds.includes(fieldId));
        if (invalidFields.length > 0) {
          errors.push({
            code: 'INVALID_STEP_FIELD',
            message: `Step '${step.id}' references non-existent fields: ${invalidFields.join(', ')}`,
            field: `steps.${step.id}.fields`
          });
        }
      });

      // Validate step index uniqueness and sequence
      const stepIndices = config.steps.map(s => s.index);
      const duplicateIndices = stepIndices.filter((index, i) => stepIndices.indexOf(index) !== i);
      if (duplicateIndices.length > 0) {
        errors.push({
          code: 'DUPLICATE_STEP_INDICES',
          message: `Duplicate step indices found: ${duplicateIndices.join(', ')}`,
          field: 'steps'
        });
      }
    }

    return errors;
  }

  /**
   * Detect circular dependencies in field dependencies
   */
  private detectCircularDependencies(fields: FieldDescriptor[]): string[] {
    const fieldMap = new Map(fields.map(f => [f.id, f.dependencies || []]));
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (fieldId: string, path: string[]): string[] | null => {
      if (recursionStack.has(fieldId)) {
        const cycleStart = path.indexOf(fieldId);
        return path.slice(cycleStart).concat(fieldId);
      }

      if (visited.has(fieldId)) {
        return null;
      }

      visited.add(fieldId);
      recursionStack.add(fieldId);

      const dependencies = fieldMap.get(fieldId) || [];
      for (const dep of dependencies) {
        const cycle = hasCycle(dep, [...path, fieldId]);
        if (cycle) {
          return cycle;
        }
      }

      recursionStack.delete(fieldId);
      return null;
    };

    for (const field of fields) {
      if (!visited.has(field.id)) {
        const cycle = hasCycle(field.id, []);
        if (cycle) {
          return cycle;
        }
      }
    }

    return [];
  }

  /**
   * Make configuration serializable by removing functions
   */
  private makeSerializable(config: FormConfiguration): any {
    return JSON.parse(JSON.stringify(config, (key, value) => {
      // Skip function properties during serialization
      if (typeof value === 'function') {
        return undefined;
      }
      return value;
    }));
  }

  /**
   * Recursively sort object keys for consistent output
   */
  private sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }
    
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj: any = {};
    
    for (const key of sortedKeys) {
      sortedObj[key] = this.sortObjectKeys(obj[key]);
    }
    
    return sortedObj;
  }
}

// Export singleton instance
export const configurationParser = new FormConfigurationParser();