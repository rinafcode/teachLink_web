/**
 * Configuration Parser Tests
 * 
 * Tests for Form Configuration schema validation, parsing, and pretty printing.
 * Includes both unit tests and property-based tests for comprehensive coverage.
 */

import { describe, it, expect } from 'vitest';
import { fc, testConfig } from '../tests/test-setup';
import { FormConfigurationParser } from './configuration-parser';
import type { 
  FormConfiguration, 
  FieldDescriptor, 
  ValidationRule,
  LayoutConfiguration,
  ValidationConfiguration,
  FieldType
} from '../types/core';

describe('FormConfigurationParser', () => {
  const parser = new FormConfigurationParser();

  describe('Schema Validation', () => {
    it('should validate a minimal valid configuration', () => {
      const validConfig: FormConfiguration = {
        id: 'test-form',
        version: '1.0.0',
        title: 'Test Form',
        fields: [{
          id: 'field1',
          type: 'text',
          label: 'Test Field',
          required: false,
          validation: []
        }],
        layout: {
          type: 'single-column',
          spacing: 'normal',
          responsive: {
            breakpoints: { mobile: 768 },
            layouts: {}
          }
        },
        validation: {
          validateOnChange: true,
          validateOnBlur: true,
          showErrorsOnSubmit: true,
          debounceMs: 300,
          customRules: {}
        }
      };

      const result = parser.validate(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject configuration with empty form ID', () => {
      const invalidConfig = {
        id: '',
        version: '1.0.0',
        title: 'Test Form',
        fields: [{
          id: 'field1',
          type: 'text',
          label: 'Test Field',
          required: false,
          validation: []
        }],
        layout: {
          type: 'single-column',
          spacing: 'normal',
          responsive: { breakpoints: {}, layouts: {} }
        },
        validation: {
          validateOnChange: true,
          validateOnBlur: true,
          showErrorsOnSubmit: true,
          debounceMs: 300,
          customRules: {}
        }
      };

      const result = parser.validate(invalidConfig as FormConfiguration);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Form ID cannot be empty'))).toBe(true);
    });

    it('should reject configuration with no fields', () => {
      const invalidConfig = {
        id: 'test-form',
        version: '1.0.0',
        title: 'Test Form',
        fields: [],
        layout: {
          type: 'single-column',
          spacing: 'normal',
          responsive: { breakpoints: {}, layouts: {} }
        },
        validation: {
          validateOnChange: true,
          validateOnBlur: true,
          showErrorsOnSubmit: true,
          debounceMs: 300,
          customRules: {}
        }
      };

      const result = parser.validate(invalidConfig as FormConfiguration);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Form must have at least one field'))).toBe(true);
    });

    it('should detect duplicate field IDs', () => {
      const configWithDuplicates: FormConfiguration = {
        id: 'test-form',
        version: '1.0.0',
        title: 'Test Form',
        fields: [
          {
            id: 'duplicate-field',
            type: 'text',
            label: 'Field 1',
            required: false,
            validation: []
          },
          {
            id: 'duplicate-field',
            type: 'email',
            label: 'Field 2',
            required: false,
            validation: []
          }
        ],
        layout: {
          type: 'single-column',
          spacing: 'normal',
          responsive: { breakpoints: {}, layouts: {} }
        },
        validation: {
          validateOnChange: true,
          validateOnBlur: true,
          showErrorsOnSubmit: true,
          debounceMs: 300,
          customRules: {}
        }
      };

      const result = parser.validate(configWithDuplicates);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'DUPLICATE_FIELD_IDS')).toBe(true);
    });

    it('should detect invalid field dependencies', () => {
      const configWithInvalidDeps: FormConfiguration = {
        id: 'test-form',
        version: '1.0.0',
        title: 'Test Form',
        fields: [
          {
            id: 'field1',
            type: 'text',
            label: 'Field 1',
            required: false,
            validation: [],
            dependencies: ['nonexistent-field']
          }
        ],
        layout: {
          type: 'single-column',
          spacing: 'normal',
          responsive: { breakpoints: {}, layouts: {} }
        },
        validation: {
          validateOnChange: true,
          validateOnBlur: true,
          showErrorsOnSubmit: true,
          debounceMs: 300,
          customRules: {}
        }
      };

      const result = parser.validate(configWithInvalidDeps);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_FIELD_DEPENDENCY')).toBe(true);
    });

    it('should detect circular dependencies', () => {
      const configWithCircularDeps: FormConfiguration = {
        id: 'test-form',
        version: '1.0.0',
        title: 'Test Form',
        fields: [
          {
            id: 'field1',
            type: 'text',
            label: 'Field 1',
            required: false,
            validation: [],
            dependencies: ['field2']
          },
          {
            id: 'field2',
            type: 'text',
            label: 'Field 2',
            required: false,
            validation: [],
            dependencies: ['field1']
          }
        ],
        layout: {
          type: 'single-column',
          spacing: 'normal',
          responsive: { breakpoints: {}, layouts: {} }
        },
        validation: {
          validateOnChange: true,
          validateOnBlur: true,
          showErrorsOnSubmit: true,
          debounceMs: 300,
          customRules: {}
        }
      };

      const result = parser.validate(configWithCircularDeps);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'CIRCULAR_DEPENDENCY')).toBe(true);
    });
  });

  describe('JSON Parsing', () => {
    it('should parse valid JSON configuration', () => {
      const jsonConfig = JSON.stringify({
        id: 'test-form',
        version: '1.0.0',
        title: 'Test Form',
        fields: [{
          id: 'field1',
          type: 'text',
          label: 'Test Field',
          required: false,
          validation: []
        }],
        layout: {
          type: 'single-column',
          spacing: 'normal',
          responsive: { breakpoints: {}, layouts: {} }
        },
        validation: {
          validateOnChange: true,
          validateOnBlur: true,
          showErrorsOnSubmit: true,
          debounceMs: 300,
          customRules: {}
        }
      });

      const config = parser.parse(jsonConfig);
      expect(config.id).toBe('test-form');
      expect(config.fields).toHaveLength(1);
      expect(config.fields[0].id).toBe('field1');
    });

    it('should throw error for invalid JSON', () => {
      const invalidJson = '{ invalid json }';
      
      expect(() => parser.parse(invalidJson)).toThrow('Invalid JSON');
    });

    it('should throw error for JSON with invalid schema', () => {
      const invalidConfig = JSON.stringify({
        id: 'test-form',
        // Missing required fields
      });

      expect(() => parser.parse(invalidConfig)).toThrow('Configuration validation failed');
    });
  });

  describe('Pretty Printing', () => {
    it('should format configuration back to JSON', () => {
      const config: FormConfiguration = {
        id: 'test-form',
        version: '1.0.0',
        title: 'Test Form',
        fields: [{
          id: 'field1',
          type: 'text',
          label: 'Test Field',
          required: false,
          validation: []
        }],
        layout: {
          type: 'single-column',
          spacing: 'normal',
          responsive: { breakpoints: {}, layouts: {} }
        },
        validation: {
          validateOnChange: true,
          validateOnBlur: true,
          showErrorsOnSubmit: true,
          debounceMs: 300,
          customRules: {}
        }
      };

      const jsonString = parser.formatToJson(config);
      expect(jsonString).toContain('"id": "test-form"');
      expect(jsonString).toContain('"title": "Test Form"');
      expect(() => JSON.parse(jsonString)).not.toThrow();
    });

    it('should format configuration to compact JSON', () => {
      const config: FormConfiguration = {
        id: 'test-form',
        version: '1.0.0',
        title: 'Test Form',
        fields: [{
          id: 'field1',
          type: 'text',
          label: 'Test Field',
          required: false,
          validation: []
        }],
        layout: {
          type: 'single-column',
          spacing: 'normal',
          responsive: { breakpoints: {}, layouts: {} }
        },
        validation: {
          validateOnChange: true,
          validateOnBlur: true,
          showErrorsOnSubmit: true,
          debounceMs: 300,
          customRules: {}
        }
      };

      const compactJson = parser.formatToCompactJson(config);
      const prettyJson = parser.formatToJson(config);
      
      // Compact JSON should be shorter (no indentation)
      expect(compactJson.length).toBeLessThan(prettyJson.length);
      expect(compactJson).not.toContain('\n');
      expect(() => JSON.parse(compactJson)).not.toThrow();
    });

    it('should format configuration with custom options', () => {
      const config: FormConfiguration = {
        id: 'test-form',
        version: '1.0.0',
        title: 'Test Form',
        fields: [{
          id: 'field1',
          type: 'text',
          label: 'Test Field',
          required: false,
          validation: []
        }],
        layout: {
          type: 'single-column',
          spacing: 'normal',
          responsive: { breakpoints: {}, layouts: {} }
        },
        validation: {
          validateOnChange: true,
          validateOnBlur: true,
          showErrorsOnSubmit: true,
          debounceMs: 300,
          customRules: {}
        }
      };

      const jsonWithMetadata = parser.formatToJsonWithOptions(config, {
        includeMetadata: true,
        sortKeys: true,
        indent: 4
      });

      const parsed = JSON.parse(jsonWithMetadata);
      expect(parsed._metadata).toBeDefined();
      expect(parsed._metadata.generatedAt).toBeDefined();
      expect(parsed._metadata.parserVersion).toBe('1.0.0');
      expect(parsed._metadata.schemaVersion).toBe('1.0.0');
    });

    it('should handle configurations with functions by omitting them', () => {
      const configWithFunctions: FormConfiguration = {
        id: 'test-form',
        version: '1.0.0',
        title: 'Test Form',
        fields: [{
          id: 'field1',
          type: 'text',
          label: 'Test Field',
          required: false,
          validation: [{
            type: 'custom',
            message: 'Custom validation',
            condition: () => true // This function should be omitted
          }]
        }],
        layout: {
          type: 'single-column',
          spacing: 'normal',
          responsive: { breakpoints: {}, layouts: {} }
        },
        validation: {
          validateOnChange: true,
          validateOnBlur: true,
          showErrorsOnSubmit: true,
          debounceMs: 300,
          customRules: {
            customRule: () => ({ isValid: true, errors: [] }) // This should be omitted
          }
        }
      };

      const jsonString = parser.formatToJson(configWithFunctions);
      const parsed = JSON.parse(jsonString);
      
      // Functions should be omitted from the serialized output
      expect(parsed.fields[0].validation[0].condition).toBeUndefined();
      expect(parsed.validation.customRules.customRule).toBeUndefined();
    });

    it('should preserve structure and formatting', () => {
      const config: FormConfiguration = {
        id: 'complex-form',
        version: '2.0.0',
        title: 'Complex Form with Nested Structure',
        description: 'A form with complex nested structures',
        fields: [
          {
            id: 'personal-info',
            type: 'text',
            label: 'Personal Information',
            required: true,
            validation: [
              { type: 'required', message: 'This field is required' },
              { type: 'minLength', message: 'Minimum 2 characters', params: { min: 2 } }
            ],
            styling: {
              className: 'form-field-personal',
              width: 'full',
              order: 1
            }
          },
          {
            id: 'contact-email',
            type: 'email',
            label: 'Email Address',
            placeholder: 'Enter your email',
            required: true,
            validation: [
              { type: 'required', message: 'Email is required' },
              { type: 'email', message: 'Please enter a valid email' }
            ],
            dependencies: ['personal-info']
          }
        ],
        layout: {
          type: 'two-column',
          spacing: 'normal',
          fieldGroups: [{
            id: 'personal-group',
            title: 'Personal Information',
            fields: ['personal-info', 'contact-email']
          }],
          responsive: {
            breakpoints: { mobile: 768, tablet: 1024 },
            layouts: {
              mobile: {
                type: 'single-column',
                spacing: 'compact',
                responsive: { breakpoints: {}, layouts: {} }
              }
            }
          }
        },
        validation: {
          validateOnChange: true,
          validateOnBlur: true,
          showErrorsOnSubmit: true,
          debounceMs: 500,
          customRules: {}
        },
        autoSave: {
          enabled: true,
          intervalMs: 10000,
          saveOnBlur: true,
          maxDrafts: 5,
          compressionEnabled: true
        }
      };

      const jsonString = parser.formatToJson(config);
      const parsedBack = parser.parse(jsonString);
      
      // Verify structure is preserved
      expect(parsedBack.id).toBe(config.id);
      expect(parsedBack.fields).toHaveLength(config.fields.length);
      expect(parsedBack.fields[0].styling?.className).toBe('form-field-personal');
      expect(parsedBack.layout.fieldGroups?.[0].title).toBe('Personal Information');
      expect(parsedBack.autoSave?.intervalMs).toBe(10000);
    });
  });

  describe('Round-Trip Property Tests', () => {
    // Property test for round-trip validation (parse -> format -> parse)
    it('Property: Configuration round-trip should produce equivalent object', () => {
      // Create a generator for valid FormConfiguration objects
      const validConfigArbitrary = fc.record({
        id: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        version: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        title: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        // schema: description is optional string (undefined allowed, null not allowed)
        description: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
        fields: fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            type: fc.constantFrom(
              'text',
              'number',
              'email',
              'password',
              'select',
              'checkbox',
              'radio',
              'textarea',
              'file',
              'date',
              'time',
              'datetime-local'
            ) as fc.Arbitrary<FieldType>,
            label: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
            // schema: placeholder is optional string (undefined allowed, null not allowed)
            placeholder: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
            required: fc.boolean(),
            validation: fc.array(
              fc.record({
                type: fc.constantFrom('required', 'email', 'minLength', 'maxLength', 'pattern', 'custom', 'async'),
                // schema: params is optional record<any> (undefined allowed, null not allowed)
                params: fc.option(fc.dictionary(fc.string({ minLength: 1 }), fc.anything()), { nil: undefined }),
                message: fc.string({ minLength: 1 })
              })
            )
          }),
          { minLength: 1 }
        ),
        layout: fc.record({
          type: fc.constantFrom('single-column', 'two-column', 'grid', 'custom'),
          spacing: fc.constantFrom('compact', 'normal', 'relaxed'),
          responsive: fc.record({
            breakpoints: fc.dictionary(fc.string({ minLength: 1 }), fc.integer({ min: 0, max: 4096 })),
            // schema expects LayoutConfiguration objects; easiest is to provide an empty dict
            // (zod allows empty record and will validate values only if present)
            layouts: fc.constant({})
          })
        }),
        validation: fc.record({
          validateOnChange: fc.boolean(),
          validateOnBlur: fc.boolean(),
          showErrorsOnSubmit: fc.boolean(),
          debounceMs: fc.integer({ min: 0, max: 60000 }),
          // schema expects record<function>, but validate() only schema-parses when called with config;
          // in round trip we also call validate(parsedConfig) which requires functions.
          // Keep it empty.
          customRules: fc.constant({})
        })
      });

      fc.assert(
        fc.property(
          validConfigArbitrary,
          (config) => {
            try {
              // Step 1: Format to JSON
              const jsonString = parser.formatToJson(config as FormConfiguration);
              
              // Step 2: Parse back from JSON
              const parsedConfig = parser.parse(jsonString);
              
              // Step 3: Validate the parsed configuration
              const validationResult = parser.validate(parsedConfig);
              
              // The round-trip should produce a valid configuration
              return validationResult.isValid && 
                     parsedConfig.id === config.id &&
                     parsedConfig.title === config.title &&
                     parsedConfig.fields.length === config.fields.length;
            } catch (error) {
              // If any step fails, the property is violated
              return false;
            }
          }
        ),
        testConfig
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', () => {
      const malformedJson = '{"id": "test", "title": "Test", "fields": [}';
      
      expect(() => parser.parse(malformedJson)).toThrow('Invalid JSON');
    });

    it('should provide descriptive error messages for validation failures', () => {
      const configMissingRequiredFields = {
        id: 'test-form'
        // Missing other required fields
      };

      const result = parser.validate(configMissingRequiredFields as FormConfiguration);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.every(error => error.message && error.message.length > 0)).toBe(true);
    });

    it('should handle nested validation errors', () => {
      const configWithInvalidField = {
        id: 'test-form',
        version: '1.0.0',
        title: 'Test Form',
        fields: [{
          id: '', // Invalid: empty field ID
          type: 'invalid-type', // Invalid field type
          label: '', // Invalid: empty label
          required: 'not-boolean', // Invalid: should be boolean
          validation: 'not-array' // Invalid: should be array
        }],
        layout: {
          type: 'single-column',
          spacing: 'normal',
          responsive: { breakpoints: {}, layouts: {} }
        },
        validation: {
          validateOnChange: true,
          validateOnBlur: true,
          showErrorsOnSubmit: true,
          debounceMs: 300,
          customRules: {}
        }
      };

      const result = parser.validate(configWithInvalidField as unknown as FormConfiguration);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Should have errors for field ID, type, label, required, and validation
      const errorFields = result.errors.map(e => e.field);
      expect(errorFields.some(field => field?.includes('fields.0.id'))).toBe(true);
      expect(errorFields.some(field => field?.includes('fields.0.type'))).toBe(true);
    });
  });

  describe('Complex Configuration Scenarios', () => {
    it('should handle configuration with wizard steps', () => {
      const configWithSteps: FormConfiguration = {
        id: 'wizard-form',
        version: '1.0.0',
        title: 'Wizard Form',
        fields: [
          {
            id: 'step1-field',
            type: 'text',
            label: 'Step 1 Field',
            required: false,
            validation: []
          },
          {
            id: 'step2-field',
            type: 'email',
            label: 'Step 2 Field',
            required: true,
            validation: []
          }
        ],
        steps: [
          {
            index: 0,
            id: 'step1',
            title: 'Step 1',
            fields: ['step1-field'],
            isComplete: false,
            isValid: false
          },
          {
            index: 1,
            id: 'step2',
            title: 'Step 2',
            fields: ['step2-field'],
            isComplete: false,
            isValid: false
          }
        ],
        layout: {
          type: 'single-column',
          spacing: 'normal',
          responsive: { breakpoints: {}, layouts: {} }
        },
        validation: {
          validateOnChange: true,
          validateOnBlur: true,
          showErrorsOnSubmit: true,
          debounceMs: 300,
          customRules: {}
        }
      };

      const result = parser.validate(configWithSteps);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle configuration with auto-save settings', () => {
      const configWithAutoSave: FormConfiguration = {
        id: 'autosave-form',
        version: '1.0.0',
        title: 'Auto-Save Form',
        fields: [{
          id: 'field1',
          type: 'textarea',
          label: 'Long Text Field',
          required: false,
          validation: []
        }],
        layout: {
          type: 'single-column',
          spacing: 'normal',
          responsive: { breakpoints: {}, layouts: {} }
        },
        validation: {
          validateOnChange: true,
          validateOnBlur: true,
          showErrorsOnSubmit: true,
          debounceMs: 300,
          customRules: {}
        },
        autoSave: {
          enabled: true,
          intervalMs: 5000,
          saveOnBlur: true,
          maxDrafts: 10,
          compressionEnabled: true
        }
      };

      const result = parser.validate(configWithAutoSave);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle configuration with analytics settings', () => {
      const configWithAnalytics: FormConfiguration = {
        id: 'analytics-form',
        version: '1.0.0',
        title: 'Analytics Form',
        fields: [{
          id: 'field1',
          type: 'text',
          label: 'Tracked Field',
          required: false,
          validation: []
        }],
        layout: {
          type: 'single-column',
          spacing: 'normal',
          responsive: { breakpoints: {}, layouts: {} }
        },
        validation: {
          validateOnChange: true,
          validateOnBlur: true,
          showErrorsOnSubmit: true,
          debounceMs: 300,
          customRules: {}
        },
        analytics: {
          enabled: true,
          trackFieldInteractions: true,
          trackTimeSpent: true,
          privacyMode: false,
          customEvents: ['custom-event-1', 'custom-event-2']
        }
      };

      const result = parser.validate(configWithAnalytics);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});